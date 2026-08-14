import { NotFoundError } from '../../lib/errors.js';
import * as repo from './repository.js';
// ── Public Interface (module-interfaces.md) ─────────────
/**
 * InventoryService.recordMovement
 * Called by: Production module (for material consumption and finished goods receipt)
 *            and directly by routes for manual movements.
 * Accepts optional tx for cross-module transaction participation.
 */
export async function recordMovement(itemId, movementType, quantity, referenceType, referenceId, recordedBy, notes, tx) {
    // Validate item exists
    const item = await repo.findItemById(itemId);
    if (!item) {
        throw new NotFoundError('InventoryItem', itemId);
    }
    return repo.createMovement({
        itemId,
        movementType,
        quantity,
        recordedBy,
        referenceType,
        referenceId,
        notes,
    }, tx);
}
/**
 * InventoryService.getCurrentStock
 * Called by: Orders module (read-only), Reporting module, Dashboard.
 */
export async function getCurrentStock(itemId) {
    const item = await repo.findItemById(itemId);
    if (!item) {
        throw new NotFoundError('InventoryItem', itemId);
    }
    return {
        itemId: item.id,
        quantity: item.currentStock,
        unit: item.unitOfMeasure,
    };
}
/**
 * InventoryService.getItemsBelowThreshold
 * Called by: Dashboard summary view (FR-5.1).
 */
export async function getItemsBelowThreshold() {
    return repo.findItemsBelowThreshold();
}
// ── Route-facing service methods ────────────────────────
export async function listItems(params) {
    return repo.findAllItems(params);
}
export async function getItem(id) {
    const item = await repo.findItemById(id);
    if (!item) {
        throw new NotFoundError('InventoryItem', id);
    }
    return item;
}
export async function createItem(data) {
    return repo.createItem(data);
}
export async function getMovements(itemId, params) {
    // Verify item exists
    const item = await repo.findItemById(itemId);
    if (!item) {
        throw new NotFoundError('InventoryItem', itemId);
    }
    return repo.findMovementsByItemId(itemId, params);
}
export async function recordManualMovement(data) {
    return recordMovement(data.itemId, data.movementType, data.quantity, 'manual', undefined, data.recordedBy, data.notes);
}
//# sourceMappingURL=service.js.map