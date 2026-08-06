# Metal & Aluminum Works — Business Dashboard
## Requirements Specification — v1.0 (Finalized)

**Status:** Finalized. All open decisions from v0.1 have been resolved and are incorporated below. This is the baseline for architecture and schema design going forward — treat any future change to §0–§2 as a revision requiring a version bump and re-review, not a quiet edit.

---

## 0. Confirmed Architectural Premises

These are locked based on your answers — I will build the rest of this document as if these are true. If any of these is wrong, everything downstream of it is wrong too, so check this list first.

| # | Premise | Implication |
|---|---|---|
| P1 | Single facility, single deployment | No multi-tenancy, no cross-site data partitioning needed |
| P2 | 20–100 users, but split into two distinct roles: **Owner** (write) and **Viewer** (read-only) | This is an RBAC system with exactly two authorization tiers, not a flat user model |
| P3 | Only Owners (small number, likely 1–5) create/edit data | Low write concurrency. Optimistic locking is sufficient — no need for event sourcing or append-only logs |
| P4 | All data entry is manual (no sensor/IoT/ERP ingestion) | No streaming ingestion pipeline, no protocol adapters (OPC-UA, Modbus, etc.) |
| P5 | Viewers see updates only on manual page refresh — no live push | Standard request/response HTTP. No WebSocket/SSE infrastructure. No cache-invalidation-on-write complexity beyond normal HTTP caching |
| P6 | Domain spans three areas: Production, Inventory, Orders — architected as a **modular monolith** | Distinct bounded contexts (separate schemas, explicit module boundaries, no direct cross-module table joins) deployed as one application |

**What P1–P5 mean in one sentence:** this is a CRUD application with role-based access control and a normal cache-friendly read path — not a real-time system. Say that explicitly to any future engineer who joins the project and starts reaching for Kafka. It will save you a very expensive detour.

---

## 1. Actors & Roles

| Role | Permissions | Notes |
|---|---|---|
| **Owner** | Full, uniform read/write across Production, Inventory, and Orders modules | **Decided:** no per-module scoping. Any Owner account can write to any module. This simplifies the authorization model to a single boolean check (`is_owner`) rather than a per-module permission matrix — take that simplicity, it's a real engineering win, not just a shortcut. |
| **Viewer** | Read-only, all modules | Confirmed: uniform read access, no viewer sub-tiers needed at this scope. |
| **System Admin** (implicit) | User provisioning, role assignment | **Decided:** first Owner account is created via a one-time seed script/CLI during deployment (not through the UI — no "register as first admin" web form, which is a common security hole). That first Owner then provisions all other Owner/Viewer accounts through an in-app "manage users" screen restricted to Owners. No separate Admin role needed for a two-role system. |

---

## 2. Bounded Contexts (Modular Monolith Structure)

Each module below is a separate schema/package with its own entities, its own module-internal business rules, and a defined, narrow public interface for cross-module reads. **No module reaches directly into another module's tables.** This is the whole point of "modular" — you get monolith deployment simplicity without the coupling that makes a monolith into a "distributed monolith's uglier cousin."

### 2.1 Production Module
**Core entities:** `Job` (a unit of work — e.g., "fabricate 200 aluminum brackets, order #4471"), `ProductionRun` (a single work session against a Job), `Machine`/`Station` (optional — do you track *which* machine/line did the work, or just that it happened?)

**Lifecycle (adopted, with two states added for realism in metalworking):** `Pending → In Progress → On Hold (material shortage/equipment issue) → In Progress → Completed`, plus `Cancelled` reachable from any pre-Completed state. `Rework` is intentionally **not** a separate state — a reworked Job is a new `ProductionRun` logged against the same Job, not a new lifecycle branch; this keeps the state machine simple and pushes the "did this need rework" question into the run history instead of the status field. Flag if you want Rework tracked more explicitly (e.g., for quality metrics).

### 2.2 Inventory Module
**Core entities:** `RawMaterial` (aluminum stock, sheet metal, etc. — by weight or unit), `FinishedGood` (completed product ready to ship), `StockMovement` (an append-only log of quantity changes — receipt, consumption, adjustment, shipment)

Note: `StockMovement` as append-only is the right call **regardless** of the write-concurrency conclusion above — inventory *always* wants an audit trail of "who changed the count and why," because physical stock discrepancies are a when-not-if problem in metalworking (scrap, miscount, theft, measurement error). Current quantity is a *derived* value (sum of movements), not a directly-edited field. This is non-negotiable in my view — if you want to push back on it, tell me why, but I'd need a strong reason to drop it.

### 2.3 Orders Module
**Core entities:** `Order` (customer commitment), `OrderLineItem` (specific product/quantity/spec within an order), `Customer`

**Lifecycle (adopted):** `Received → In Production → Ready for Delivery → Fulfilled`, plus `Cancelled` reachable from any pre-Fulfilled state. Note this is manually driven per §2.4 decision 2 — no automatic transitions.

### 2.4 Cross-Module Integration — Finalized

1. **Order creation does NOT touch Inventory.** Only actual Production consumption does. Concretely: creating an `Order` and its `OrderLineItem`s writes only to the Orders schema — no `StockMovement` is generated at that point. A `StockMovement` (type: Consumption) is created only when an Owner logs a `ProductionRun` that records material used. This means Inventory reflects *physical* reality (what's actually been consumed), not *committed* reality (what's been promised to customers). One consequence you should be aware of going forward, not a flaw: this design gives you **no automatic "insufficient stock to fulfill this order" warning at order-creation time**, because Orders and Inventory don't cross-check each other. If that gap ever starts to hurt (an Owner promises a delivery date the material can't support), the fix is an explicit, separate feature — a manual or automated "check current stock against open order commitments" report — not a retrofit of the core write path. Worth flagging now so it doesn't get blamed on a "bug" later; it's a deliberate boundary.

2. **Job → Order status linkage is manual.** Completing a Production Job does NOT automatically change the linked Order's status. An Owner explicitly updates Order status as its own action. This keeps the two modules decoupled — a Job's internal lifecycle and an Order's customer-facing lifecycle are allowed to diverge (e.g., a Job can complete while the Order still needs a manual QA sign-off before "Ready for Delivery").

3. **A Job may exist without a linked Order** — confirmed optional (0 or 1) relationship, supporting speculative/stock production.

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization
- **FR-1.1:** System shall support two roles: Owner, Viewer, with role assigned at account creation.
- **FR-1.2:** Owners shall have full, uniform create/read/update capability across Production, Inventory, and Orders modules — a single `is_owner` flag, no per-module permission granularity.
- **FR-1.3:** Viewers shall have read-only access to all dashboard views; write actions (forms, edit buttons) shall not be rendered or accepted from Viewer sessions, enforced server-side (not merely hidden client-side).
- **FR-1.4:** System shall support session-based authentication with a defined session expiry (needs a number — see NFR-Security).

### 3.2 Production Module
- **FR-2.1:** Owner can create a Job with: description, target quantity, linked Order (optional), target completion date.
- **FR-2.2:** Owner can transition a Job through its lifecycle states (Pending → In Progress → Completed, plus On Hold / Cancelled).
- **FR-2.3:** Owner can log a ProductionRun against a Job, recording quantity produced and materials consumed (which shall generate a corresponding Inventory StockMovement — see §2.4).
- **FR-2.4:** Viewer can see current status, progress (quantity produced vs. target), and history of all Jobs.

### 3.3 Inventory Module
- **FR-3.1:** Owner can record a StockMovement: Receipt (new stock in), Consumption (used in production), Adjustment (correction/scrap/loss), Shipment (finished goods out).
- **FR-3.2:** Current stock level for any material/good shall be computed as the sum of its StockMovements, never directly edited.
- **FR-3.3:** System shall support a configurable low-stock threshold per material, and flag/display materials below threshold on the dashboard.
- **FR-3.4:** Viewer can see current stock levels and (at minimum) a recent movement history for audit/transparency.

### 3.4 Orders Module
- **FR-4.1:** Owner can create an Order with Customer, one or more Line Items (product, quantity, spec), and requested delivery date.
- **FR-4.2:** Owner can update Order status manually through its lifecycle. No automatic status change is triggered by Production Job completion (§2.4).
- **FR-4.4:** Order creation shall NOT check or reserve Inventory stock (§2.4 decision 1). If stock-checking is desired later, it is a separate reporting feature, not part of order creation.
- **FR-4.3:** Viewer can see Order status, associated Jobs, and delivery timeline.

### 3.5 Dashboard / Reporting
- **FR-5.1:** Home dashboard shall present a summary view: active Jobs by status, low-stock alerts, Orders due soon/overdue — refreshed on page load/manual refresh (per P5).
- **FR-5.2:** System shall support filtering/search across Jobs, Orders, and Inventory by relevant fields (status, date range, customer, material).
### 3.6 Reporting & Historical Trends Module

You confirmed this is required, so it needs its own subsection rather than living as a vague bullet under "dashboard." This is architecturally distinct from §3.5 above: §3.5 is **current-state** queries (what's true right now); this is **aggregation-over-time** queries (what changed across a period). Conflating them is how dashboards quietly become slow — the moment someone adds a "last 12 months" chart directly against the live operational tables, every page load starts doing a table scan across a year of `StockMovement` rows. I'm specifying this as a logically separate read path from day one so that stays cheap to fix later (e.g., via a nightly aggregation job or materialized view) without touching the operational write path at all.

- **FR-6.1:** Owner and Viewer can view **Production trends**: units produced per Job/time period, Job completion rate, average time-to-completion, and On Hold frequency, over a selectable date range (e.g., last 30/90/365 days, or custom range).
- **FR-6.2:** Owner and Viewer can view **Inventory trends**: consumption rate per material over time, receipt vs. consumption balance, and stock-level history (to visually spot recurring low-stock patterns), over a selectable date range.
- **FR-6.3:** Owner and Viewer can view **Order fulfillment trends**: on-time delivery rate (Fulfilled date vs. requested delivery date), order volume over time, and cancellation rate, over a selectable date range.
- **FR-6.4:** All trend views must be filterable by at least one relevant dimension (e.g., by material for Inventory, by customer for Orders, by product type for Production) — a single unfiltered aggregate number is rarely actionable on its own.
- **FR-6.5:** Reporting UI shall be presented as line/bar trend charts (not tables). Implication for later: this pushes you toward a charting library on the frontend (e.g., Recharts/Chart.js) and means your reporting API responses should return pre-aggregated time-series data (e.g., `[{period: "2026-06", value: 420}, ...]`) rather than raw row dumps — the aggregation happens server-side, not in the browser.

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1.1:** Dashboard summary view shall load in **< 2 seconds** under expected load (20–100 concurrent viewers) on standard broadband. *(This number is a placeholder — confirm what's acceptable for your users; it drives whether you need caching/read-model optimization or plain queries suffice at this scale.)*
- **NFR-1.2:** Given the read-heavy/write-light profile (P3, P5), aggressive read-side caching (e.g., cache dashboard summary, invalidate on write) is appropriate and low-risk — stale-for-a-few-seconds data is acceptable since there's no live-push requirement.

### 4.2 Security
- **NFR-2.1:** All write actions server-side enforce role checks — never trust client-side role display alone.
- **NFR-2.2:** Passwords hashed (bcrypt/argon2), no plaintext storage. Session tokens expire after **`[OPEN — pick a duration, e.g. 8hr shift-aligned or 30-day persistent]`**.
- **NFR-2.3:** All Inventory StockMovements and Order status changes are immutably logged with actor + timestamp (audit trail) — not optional, given physical stock discrepancy risk noted in §2.2.
- **NFR-2.4:** Transport encrypted (HTTPS only, no plaintext HTTP even on internal network — cheap to do right, expensive to retrofit).

### 4.3 Availability & Reliability
- **NFR-3.1:** System shall target **99.9% uptime** (≤ ~8.76 hours downtime/year, ~43 min/month). **This is a deliberate, cost-aware decision, not a default**, and it mandates specific architecture, not just aspiration:
  - Minimum 2 application instances behind a load balancer (no single-instance deployment can credibly claim 99.9%)
  - Managed database with automated failover/standby replica (not a single unmanaged DB instance)
  - Health checks with automatic restart on all components
  - Active monitoring + alerting, with a defined on-call/response responsibility (a person, not just a dashboard nobody watches) — without this, 99.9% is a number on paper, not a real SLA
  - This NFR should directly inform your hosting choice: a managed platform (e.g., a PaaS with built-in redundancy) gets you most of this out of the box far more cheaply than self-managing redundant infrastructure from scratch.
- **NFR-3.2:** Daily automated database backup, retention **90 days** (chosen to cover a full quarter of historical/audit recovery need, consistent with the trend-reporting requirement in §3.6), with a *tested* restore procedure performed at least quarterly — an untested backup is not a backup.

### 4.4 Data Integrity
- **NFR-4.1:** Optimistic concurrency control (version/timestamp column) on all editable entities to prevent silent overwrite when two Owners edit concurrently — low probability per P3, but not zero, and the failure mode (silent data loss) is bad enough to guard against cheaply.
- **NFR-4.2:** Referential integrity enforced at the database level (foreign keys), not just application logic, for Job↔Order, StockMovement↔Material links.

### 4.5 Maintainability
- **NFR-5.1:** Module boundaries (Production/Inventory/Orders) enforced at the code level — no cross-module direct table access; cross-module data access goes through an explicit internal service interface, so a future extraction to separate services (if the business ever grows to multi-site) is possible without a full rewrite.

### 4.6 Observability
- **NFR-6.1:** Given the 99.9% target in NFR-3.1, observability is no longer optional — you cannot detect and respond to an incident within a 43-minute monthly budget without it. Minimum required: application error logging, uptime/health-check monitoring with alerting (e.g., a simple external ping/health-check service is sufficient at this scale — full Prometheus/Grafana-style metrics/tracing is not necessary yet), plus the who-did-what audit trail already required by NFR-2.3.

---

## 5. Status

All open items resolved as of this revision. §0–§4 constitute the accepted baseline requirements. Next artifact: entity-relationship diagram + module interface contracts (see accompanying ERD).
