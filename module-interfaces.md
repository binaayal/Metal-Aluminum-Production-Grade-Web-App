# Metal & Aluminum Works Dashboard — Module Interface Contracts
## Companion to Requirements Spec v1.0 and ERD

This defines the **only** sanctioned entry points between modules. If code in one module needs data or behavior from another, it calls one of these — never a direct query against another module's tables. This is what makes "modular monolith" enforceable instead of aspirational.

---

## Inventory module — exposed interface

```
InventoryService.recordMovement(itemId, movementType, quantity, referenceType, referenceId, recordedBy)
  -> StockMovement
  Called by: Production module, when a ProductionRun logs material consumption
             or reports finished-goods output.

InventoryService.getCurrentStock(itemId) -> { itemId, quantity, unit }
  Called by: Orders module (read-only), Reporting module.
  NOTE: per requirements §2.4, Orders does NOT call this at order-creation time
  today. It exists for the future "check stock against open orders" report
  (§2.4 note), and for the operational dashboard's low-stock display (FR-3.3).

InventoryService.getItemsBelowThreshold() -> InventoryItem[]
  Called by: Dashboard summary view (FR-5.1).
```

**What Inventory does NOT expose:** direct write access to `StockMovement` rows from outside the module, and no way for another module to set `INVENTORY_ITEMS.quantity` directly — because there is no such column. Quantity is always derived.

---

## Production module — exposed interface

```
ProductionService.createJob(description, targetQty, orderId?, targetDate, createdBy)
  -> Job
  Called by: Owner UI directly. orderId is optional (§2.4 decision 3).

ProductionService.logProductionRun(jobId, quantityProduced, materialsConsumed[], loggedBy)
  -> ProductionRun
  Internally: for each material in materialsConsumed, calls
  InventoryService.recordMovement(materialId, 'consumption', qty, 'production_run', run.id, loggedBy).
  If quantityProduced > 0 and the Job has an associated finished-good item,
  also calls InventoryService.recordMovement(finishedGoodId, 'receipt', quantityProduced, 'production_run', run.id, loggedBy).
  This is THE bridge point named in requirements §2.4 — it's the only place
  Production is allowed to trigger an Inventory write, and it goes through
  InventoryService, never a direct table write.

ProductionService.getJobStatus(jobId) -> { status, quantityProduced, targetQuantity }
  Called by: Orders module, ONLY if you later decide to build an
  "auto-suggest Order status based on Job status" feature. Per §2.4 decision 2,
  this is NOT called automatically today — Order status stays manual. This
  entry point exists so that if you change your mind later, it's a new
  caller of an existing read method, not a new coupling to build from scratch.
```

---

## Orders module — exposed interface

```
OrdersService.createOrder(customerId, lineItems[], requestedDeliveryDate, createdBy)
  -> Order
  Does NOT call InventoryService (§2.4 decision 1 — no stock check/reservation
  at order creation). lineItems reference InventoryItem.id (finished goods)
  via a plain FK for display/reporting purposes only, not a stock hold.

OrdersService.updateOrderStatus(orderId, newStatus, updatedBy) -> Order
  Called only by Owner UI action — never called automatically by Production
  module (§2.4 decision 2, manual linkage).

OrdersService.getOrdersForJob(jobId) -> Order | null
  Called by: Production module, to display "this Job is for Order #X" context
  on the Job detail view. Read-only, one direction (Production reads Orders'
  data; Orders never reads Production's).
```

---

## Reporting module — read-only aggregator, no module owns it exclusively

Reporting doesn't write to any module. It reads from all three via their existing query interfaces (`getCurrentStock`, `getJobStatus`, order history, stock movement history) and aggregates over time ranges. Per the requirements doc §3.6 rationale: at your current scale, this can be implemented as scheduled aggregation queries (e.g., a nightly job that pre-computes daily rollups into a small `daily_metrics` table) rather than a separate service — but it must still only call the other modules' exposed read methods, not their tables directly. That boundary is what lets you swap "nightly batch job" for "materialized view" or "real aggregation service" later without touching Production, Inventory, or Orders code at all.

---

## The one rule that makes all of the above enforceable

**No module's code may `import` or directly query another module's ORM models/tables.** Every cross-module interaction goes through the function signatures above. In a modular monolith this is a *discipline*, not something the deployment topology forces on you — nothing stops a developer from taking a shortcut and joining across schemas directly in a rushed sprint. If you want this enforced mechanically rather than by code review vigilance alone, the concrete technique is: separate database *schemas* per module (Postgres supports this natively) with each module's application code connecting via a role that only has grants on its own schema — a cross-module direct query then fails at the database permission level, not just at review time.
