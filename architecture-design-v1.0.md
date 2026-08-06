# Metal & Aluminum Works Dashboard — Architecture & Design
## v1.0

---

## 1. Tech Stack — Decided

| Layer | Choice | Reasoning |
|---|---|---|
| Language/Runtime | Node.js + TypeScript | Your preference. TypeScript is non-negotiable given it, not optional — a modular monolith with enforced module boundaries lives or dies on the compiler catching a boundary violation (an illegal cross-module import) at build time, not at runtime. |
| Backend framework | Fastify | Chosen over Express: comparable ecosystem maturity, meaningfully better default performance, and built-in JSON schema validation for request/response — which gives you free input validation at each module's API boundary rather than hand-rolled checks. Express is a defensible alternative if your team already knows it better; the difference isn't large enough to fight over. |
| ORM / DB access | Prisma | Strong TypeScript type generation from schema (matches your migration file 1:1), and its schema-first workflow keeps the DDL as the single source of truth — you edit the Prisma schema, it generates both migrations and typed query clients. Alternative: Knex + hand-written types, more control, more boilerplate. Prisma is the better default at this scale. |
| Frontend | React + TypeScript | Standard, pairs naturally with a Node/TS backend (shared types possible via a shared package), large ecosystem for the charting requirement. |
| Charting (FR-6.5) | Recharts | Declarative, React-native charting; sufficient for line/bar trend views without pulling in a heavier viz library you don't need. |
| Session storage | Postgres-backed session table (`connect-pg-simple`-style pattern) | NOT in-memory — required the moment you have 2+ app instances behind a load balancer (see NFR-3.1). Avoids introducing Redis as an extra moving part purely for sessions when Postgres already handles it fine at this scale. |
| Deployment | Render (managed PaaS) | See reasoning above — gets you multi-instance + managed Postgres failover + health checks without a dedicated ops function. |

---

## 2. Layered Architecture — Per Module

Every module (Production, Inventory, Orders) follows the same internal layering, so the pattern is learnable once and repeated three times:

```
modules/
  inventory/
    routes.ts       <- HTTP layer: Fastify route handlers, request/response
                       schema validation. Talks ONLY to service.ts.
    service.ts       <- Business logic. THE ONLY file other modules are
                       allowed to import from. Exports the functions listed
                       in module-interfaces.md (recordMovement,
                       getCurrentStock, getItemsBelowThreshold, etc).
    repository.ts    <- Prisma queries, scoped to this module's tables only.
                       Nothing outside this file touches Prisma models
                       directly for this module's data.
    types.ts         <- TypeScript types/interfaces for this module's domain
                       objects, exported for other modules to use when
                       calling service.ts functions.
    index.ts         <- Public barrel export. ONLY re-exports service.ts's
                       functions and types.ts's types. This file's exports
                       are the module's entire public surface area.
  production/
    (same structure)
  orders/
    (same structure)
  reporting/
    service.ts       <- Calls into inventory/index.ts, production/index.ts,
                       orders/index.ts's exported functions only. Never
                       imports their repository.ts files.
```

**The enforcement mechanism you asked about earlier, made concrete:** configure an ESLint rule (`eslint-plugin-boundaries` or a custom `no-restricted-imports` pattern) that fails the build if any file under `modules/production/**` imports anything from `modules/inventory/**` except `modules/inventory/index.ts`. This turns "please don't reach into another module's internals" from a code-review hope into a CI failure. Do this on day one — retrofitting it after six months of organic imports is far more painful than starting with it.

---

## 3. Request Flow Example — tying it together

`POST /production/jobs/:id/runs` (an Owner logs a production run):

```
routes.ts (production)
  -> validates request body against schema (Fastify)
  -> calls service.ts: ProductionService.logProductionRun(...)

service.ts (production)
  -> opens a Prisma transaction ($transaction)
  -> repository.ts: INSERT production_run
  -> repository.ts: INSERT production_run_materials (bulk)
  -> for each material: calls inventory/index.ts -> recordMovement(...)
       (this executes INSIDE the same Prisma transaction — Prisma's
       $transaction accepts a callback, so the Inventory module's writes
       participate in Production's transaction boundary. This is the
       one place module boundaries and transaction boundaries interact:
       the calling module owns the transaction, the called module's
       repository code just needs to accept a transaction client param
       instead of always using the default one.)
  -> if quantityProduced > 0: recordMovement(..., 'receipt', ...) for
       the finished good, same transaction
  -> repository.ts: UPDATE jobs (status/updated_at) if applicable
  -> commit. Any failure above -> automatic rollback, Fastify returns 500,
     Owner sees an error, nothing partially recorded.
```

This is the direct implementation of the transaction decision you confirmed.

---

## 4. Deployment Topology

- 2+ Fastify app instances (Render "Web Service", horizontal scaling) behind Render's built-in load balancer / health checks
- 1 managed Postgres instance (Render "Postgres", paid tier includes automated daily backups + point-in-time recovery; enable read replica later only if the reporting module's aggregation queries start measurably slowing down the operational path — don't provision it preemptively)
- Static frontend (React build) served via Render "Static Site" or bundled behind the same service — either is fine at this scale; a separate static site is marginally simpler to reason about
- Environment-based config (DB connection string, session secret) via Render's environment variable management — never committed to source control

---

## 5. What's Deliberately NOT in This Design

Worth naming explicitly, so it's a decision and not a gap:

- **No message queue / event bus.** Cross-module calls are synchronous in-process function calls, not async events — appropriate because everything happens inside one request/transaction and you have no need for eventual consistency at this scale.
- **No API gateway / BFF layer.** One Fastify app serves the whole API; there's no reason to split by client type when you have one frontend.
- **No container orchestration (Kubernetes).** Render's managed scaling replaces what you'd otherwise hand-roll with K8s. Reaching for Kubernetes here would be solving a scaling problem you don't have at the cost of an operational burden you can't staff.
