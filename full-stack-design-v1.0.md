# Metal & Aluminum Works Dashboard — Full-Stack Design (Final)
## Frontend / Backend API / Database — v1.0

This closes out the design phase. It builds on, and does not repeat, `requirements-spec-v1.0.md`, the ERD, `module-interfaces.md`, `001_initial_schema.sql`, and `architecture-design-v1.0.md`. Read this as the missing third: how a request actually enters the system (frontend), how it's carried over the wire (API), and how it's finally guaranteed correct at rest (database).

---
---

# PART 1 — FRONTEND DESIGN

## 1.1 Stack
React + TypeScript, bundled with **Vite** (not Next.js — you have no SEO or SSR need; this is an auth-gated internal dashboard, so a plain SPA is simpler and has less to reason about). **TanStack Query** for all server-state (data fetching/caching), **React Router** for navigation, **Recharts** for trend charts (per FR-6.5), **React Hook Form + Zod** for forms and validation.

**Why Zod specifically, and why it matters architecturally, not just as a library pick:** define validation schemas once, in a shared package (`packages/shared-schemas`), imported by BOTH the Fastify backend (as its request validation) and the frontend (as its form validation). Without this, you will inevitably let frontend and backend validation drift apart — someone updates a max-length rule on one side during a rushed fix and forgets the other. One schema, two consumers, zero drift. This is the same "single source of truth" principle you already applied to the database schema; apply it here too.

## 1.2 Routing & Page Structure

```
/login                          - public
/                                - dashboard home (FR-5.1 summary) - all authenticated roles
/production                     - Job list (filter/search, FR-5.2)
/production/:jobId              - Job detail: status, run history, "log a run" form (Owner only)
/inventory                       - Item list, current stock, low-stock flags (FR-3.3/3.4)
/inventory/:itemId               - Item detail: movement history, "record movement" form (Owner only)
/orders                          - Order list (filter/search)
/orders/:orderId                 - Order detail: line items, status control (Owner only)
/reports                         - Trend charts (FR-6.1–6.4), date range + dimension filters
/admin/users                     - User management (Owner only, per §1 System Admin decision)
```

Every route except `/login` is wrapped in a `<RequireAuth>` component; `/admin/users` and every mutating action additionally check `role === 'owner'` client-side **purely for UI (hide/disable buttons) — never as the actual security boundary**, since FR-1.3 requires server-side enforcement regardless of what the client renders. A Viewer with browser dev tools open must not be able to force a write through by re-enabling a hidden button; the server rejects it either way.

## 1.3 Component Structure

```
src/
  api/
    client.ts            <- fetch wrapper: base URL, credentials:'include' for
                             session cookie, shared error-parsing
    production.ts         <- typed functions: getJobs(), getJob(id),
                             createJob(), logRun(), matching backend endpoints 1:1
    inventory.ts
    orders.ts
    reports.ts
    auth.ts
  features/
    auth/          LoginPage.tsx, RequireAuth.tsx, useCurrentUser.ts
    production/    JobList.tsx, JobDetail.tsx, JobForm.tsx, RunForm.tsx
    inventory/     ItemList.tsx, ItemDetail.tsx, MovementForm.tsx, LowStockPanel.tsx
    orders/        OrderList.tsx, OrderDetail.tsx, OrderForm.tsx, CustomerPicker.tsx
    reports/       ProductionTrendChart.tsx, InventoryTrendChart.tsx,
                   OrderTrendChart.tsx, DateRangeFilter.tsx
    admin/         UserManagement.tsx  (Owner only route)
  components/       Button, Table, Modal, Badge (status/role), Toast — shared,
                     dumb/presentational only, no data fetching here
  layouts/          DashboardLayout.tsx (nav bar, role-conditional nav items,
                     manual "Refresh" button — see below)
```

## 1.4 Implementing "Manual Refresh Only" (P5) Concretely

This requirement needs a specific TanStack Query configuration, not just a policy statement:

```ts
useQuery({
  queryKey: ['jobs', filters],
  queryFn: () => getJobs(filters),
  staleTime: Infinity,        // never auto-refetch due to "staleness"
  refetchOnWindowFocus: false, // don't refetch just because the tab regained focus
  refetchOnReconnect: false,
});
```

Every page's `DashboardLayout` includes a persistent **"Refresh" button** that calls `queryClient.invalidateQueries()` for the current page's query keys. This is the entire mechanism — no polling interval, no WebSocket, no background timer. It's a direct, literal implementation of P5, not an approximation of it.

## 1.5 Auth Flow (Frontend Side)

1. `LoginPage` posts credentials to `/api/auth/login`. Backend sets an httpOnly session cookie (frontend never touches the token directly — this is deliberate: httpOnly cookies aren't readable by JS, which closes off an entire class of XSS-driven session theft).
2. On app load, `useCurrentUser()` calls `GET /api/auth/me`; result (or 401) determines whether `<RequireAuth>` renders children or redirects to `/login`.
3. Role (`owner`/`viewer`) comes back in that same response and drives conditional rendering throughout — but again, decoration only, not enforcement.

## 1.6 Error Handling UX

All API errors surface through a single `ApiError` type (matching the backend's error envelope — Part 2, §2.4) caught at the `api/client.ts` layer. Form-level validation errors (400s from a failed Zod check) map to individual field errors via React Hook Form's `setError`. All other errors (403, 500, network failure) surface as a global toast notification. One handling path, not one-off try/catch blocks scattered per component.

---
---

# PART 2 — BACKEND API DESIGN

## 2.1 Conventions (apply to every endpoint below)

- Base path: `/api`
- Auth: session cookie, checked by a Fastify `preHandler` hook on every route except `/api/auth/login`. Returns `401` if no valid session.
- Role enforcement: a second `preHandler` (`requireOwner`) on every mutating route. Returns `403` if the session's role isn't `owner`. This is the literal, server-side implementation of FR-1.3 — it is not optional and does not get skipped because the frontend already hid the button.
- Request/response bodies validated against the shared Zod schemas (§1.1) via `fastify-type-provider-zod`. A schema failure returns `400` with a field-level error list, not a bare "bad request."
- Pagination: simple `?limit=&offset=` on all list endpoints, default `limit=50`, max `200`. No cursor-based pagination — unnecessary complexity at this data volume (single facility, manual entry; you are not going to have millions of rows).
- Error envelope, consistent on every non-2xx response:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": {"quantity": "must be positive"} } }
  ```

## 2.2 Auth Endpoints

| Method | Path | Auth | Body / Query | Response |
|---|---|---|---|---|
| POST | `/api/auth/login` | none | `{email, password}` | `{user: {id,name,email,role}}` + sets session cookie |
| POST | `/api/auth/logout` | session | — | `204` |
| GET | `/api/auth/me` | session | — | `{user}` or `401` |

## 2.3 User Management (Owner only — §1 admin decision)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| GET | `/api/users` | owner | — | `User[]` |
| POST | `/api/users` | owner | `{name,email,password,role}` | `201, User` |
| PATCH | `/api/users/:id` | owner | `{name?, role?}` | `User` |

Note: no `DELETE /api/users/:id` — deactivate via a `role`/`active` flag rather than hard-deleting a user who may be referenced as `created_by`/`recorded_by` on historical records. Deleting a user would either cascade-orphan audit history or require nullable FKs on every audit column, both worse than a soft-deactivate flag.

## 2.4 Production Module

| Method | Path | Auth | Body / Query | Response |
|---|---|---|---|---|
| GET | `/api/production/jobs` | session | `?status=&orderId=&from=&to=&limit=&offset=` | `{items: Job[], total}` |
| POST | `/api/production/jobs` | owner | `{description, targetQuantity, orderId?, finishedGoodId?, targetCompletionDate?}` | `201, Job` |
| GET | `/api/production/jobs/:id` | session | — | `Job` (includes nested `productionRuns[]`) |
| PATCH | `/api/production/jobs/:id` | owner | `{status?, description?, targetCompletionDate?, version}` | `Job` or `409` (see §2.7, optimistic locking) |
| POST | `/api/production/jobs/:id/runs` | owner | `{quantityProduced, materialsConsumed: [{itemId, quantity}]}` | `201, ProductionRun` — this is the transactional endpoint from architecture-design-v1.0.md §3 |

## 2.5 Inventory Module

| Method | Path | Auth | Body / Query | Response |
|---|---|---|---|---|
| GET | `/api/inventory/items` | session | `?type=&belowThreshold=&limit=&offset=` | `{items: InventoryItem[], total}` |
| POST | `/api/inventory/items` | owner | `{name, itemType, unitOfMeasure, lowStockThreshold}` | `201, InventoryItem` |
| GET | `/api/inventory/items/:id` | session | — | `InventoryItem` + computed `currentStock` |
| GET | `/api/inventory/items/:id/movements` | session | `?from=&to=&limit=&offset=` | `{items: StockMovement[], total}` |
| POST | `/api/inventory/movements` | owner | `{itemId, movementType, quantity, notes?}` | `201, StockMovement` — for manual receipt/adjustment/shipment entries NOT tied to a production run |

Note: there is deliberately no `PATCH`/`DELETE` on movements or items' stock — append-only per NFR-2.3/FR-3.2. A correction is a new movement (type `adjustment`), never an edit to history.

## 2.6 Orders Module

| Method | Path | Auth | Body / Query | Response |
|---|---|---|---|---|
| GET | `/api/orders/customers` | session | `?search=` | `Customer[]` |
| POST | `/api/orders/customers` | owner | `{name, contactInfo?}` | `201, Customer` |
| GET | `/api/orders` | session | `?status=&customerId=&from=&to=&limit=&offset=` | `{items: Order[], total}` |
| POST | `/api/orders` | owner | `{customerId, lineItems: [{finishedGoodId, quantity, specNotes?}], requestedDeliveryDate?}` | `201, Order` — per §2.4 requirements decision, this does NOT touch inventory |
| GET | `/api/orders/:id` | session | — | `Order` (includes nested `lineItems[]`, linked `jobs[]` if any) |
| PATCH | `/api/orders/:id` | owner | `{status?, version}` | `Order` or `409` |

## 2.7 Optimistic Locking Over HTTP (making NFR-4.1 concrete)

`Job` and `Order` PATCH bodies require the client to submit the `version` it last read. Backend logic:
```sql
UPDATE production.jobs SET status = $1, version = version + 1, updated_at = now()
WHERE id = $2 AND version = $3;
-- if 0 rows affected -> someone else updated it first -> return 409 Conflict
```
Frontend behavior on `409`: refetch the current record, show the user "this was changed by someone else — here's the latest, please reapply your change" rather than silently overwriting. Given P3 (only a handful of Owners, low write concurrency), this will be rare in practice — but "rare" and "silent data loss when it happens" is exactly the combination worth guarding against cheaply, which is why NFR-4.1 exists at all.

## 2.8 Reports Module

| Method | Path | Auth | Query | Response |
|---|---|---|---|---|
| GET | `/api/reports/production` | session | `?from=&to=&groupBy=day\|week\|month&filterBy=finishedGoodId?` | `{series: [{period, unitsProduced, jobsCompleted, avgCompletionDays}]}` |
| GET | `/api/reports/inventory` | session | `?from=&to=&groupBy=&itemId=` | `{series: [{period, consumed, received, netChange}]}` |
| GET | `/api/reports/orders` | session | `?from=&to=&groupBy=&customerId=` | `{series: [{period, orderCount, onTimeRate, cancelledCount}]}` |

Response shape is pre-aggregated time-series arrays, matching what Recharts consumes directly — no client-side aggregation of raw rows, consistent with the FR-6.5 implication already noted in the requirements doc.

---
---

# PART 3 — DATABASE DESIGN (Finalized)

The migration file (`001_initial_schema.sql`) stands as written, plus these additions that close the gaps named at the top of this document.

## 3.1 CHECK Constraints — Enforcing Sign Conventions at the DB Level

Previously stated only in prose ("positive = in, negative = out"). A prose rule the database doesn't enforce is a rule that *will* eventually be violated by a bug. Add:

```sql
ALTER TABLE inventory.stock_movements
  ADD CONSTRAINT chk_movement_sign CHECK (
    (movement_type = 'receipt'     AND quantity > 0) OR
    (movement_type = 'consumption' AND quantity < 0) OR
    (movement_type = 'shipment'    AND quantity < 0) OR
    (movement_type = 'adjustment') -- adjustment may be either sign (correcting over- or under-count)
  );

ALTER TABLE inventory.inventory_items
  ADD CONSTRAINT chk_threshold_nonnegative CHECK (low_stock_threshold >= 0);

ALTER TABLE production.jobs
  ADD CONSTRAINT chk_target_quantity_positive CHECK (target_quantity > 0);

ALTER TABLE orders.order_line_items
  ADD CONSTRAINT chk_line_item_quantity_positive CHECK (quantity > 0);
```

This is a small addition with an outsized payoff: an application bug that tries to insert a positive "consumption" movement now fails loudly at the database, instead of silently corrupting your stock-level math — and stock-level correctness was the entire justification for the append-only design in the first place. Skipping this would mean the append-only pattern only protects you from concurrent-write races, not from application logic bugs, which is a much more common failure mode in practice.

## 3.2 Trend Reporting: Direct Queries, Not Materialized Views (For Now)

Earlier I noted materialized views as a possible future optimization. Final call, stated plainly: **don't build them yet.** At your actual scale (single facility, manual entry by a handful of Owners), your total row count across a full year of `stock_movements`, `production_runs`, and `orders` combined is very likely in the low thousands, not millions. A `GROUP BY date_trunc('day', recorded_at)` query against an indexed timestamp column (already added in the migration — `idx_stock_movements_recorded_at`) will run in milliseconds at this volume. Building materialized views now means maintaining refresh schedules and staleness-tracking logic for a performance problem you don't have. Revisit this only if `EXPLAIN ANALYZE` on a real report query shows it's actually slow — measure before you optimize, not before you have data to measure.

## 3.3 Seed Script (First-Owner Bootstrap — §1 decision)

```ts
// scripts/seed-first-owner.ts — run once at initial deployment, never via the API
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

async function main() {
  const prisma = new PrismaClient();
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  if (!email || !password) throw new Error('SEED_OWNER_EMAIL / SEED_OWNER_PASSWORD required');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) { console.log('Seed owner already exists, skipping.'); return; }

  await prisma.user.create({
    data: {
      name: 'Initial Owner',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'owner',
    },
  });
  console.log(`Seed owner created: ${email}`);
}

main();
```

Run via `npm run seed:owner` with `SEED_OWNER_EMAIL`/`SEED_OWNER_PASSWORD` set as one-time deployment environment variables (never committed, never left in shell history longer than needed) — deliberately not exposed as an API endpoint, closing off the "anyone can POST to /register and become the first admin" hole named in §1 of the requirements doc.

## 3.4 What Remains Genuinely Open (Not a Gap — a Future Decision Point)

- Whether `orders.order_line_items.finished_good_id` should eventually allow referencing a `Job` directly (custom, not-yet-catalogued products) — deferred; today every finished good must be a pre-defined `InventoryItem`, which is consistent with your confirmed requirement that Order creation doesn't touch Inventory but still needs *something* concrete to reference.
- Read replica for Postgres — explicitly deferred per §3.2 above until measured need exists.

---

## Design Phase — Closed

Frontend, Backend API, and Database are now each specified concretely enough to implement directly against. Combined with the requirements spec, ERD, module interfaces, and architecture doc already delivered, this is a complete design package.
