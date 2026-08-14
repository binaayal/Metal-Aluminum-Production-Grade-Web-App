import type { Prisma } from '../../lib/prisma.js';
import type { InventoryItemResponse, StockMovementResponse } from './types.js';
type TxClient = Prisma.TransactionClient;
/**
 * InventoryService.recordMovement
 * Called by: Production module (for material consumption and finished goods receipt)
 *            and directly by routes for manual movements.
 * Accepts optional tx for cross-module transaction participation.
 */
export declare function recordMovement(itemId: string, movementType: string, quantity: number, referenceType: string, referenceId: string | undefined, recordedBy: string, notes?: string, tx?: TxClient): Promise<StockMovementResponse>;
/**
 * InventoryService.getCurrentStock
 * Called by: Orders module (read-only), Reporting module, Dashboard.
 */
export declare function getCurrentStock(itemId: string): Promise<{
    itemId: string;
    quantity: number;
    unit: string;
}>;
/**
 * InventoryService.getItemsBelowThreshold
 * Called by: Dashboard summary view (FR-5.1).
 */
export declare function getItemsBelowThreshold(): Promise<InventoryItemResponse[]>;
export declare function listItems(params: {
    type?: string;
    belowThreshold?: boolean;
    limit: number;
    offset: number;
}): Promise<{
    items: InventoryItemResponse[];
    total: number;
}>;
export declare function getItem(id: string): Promise<InventoryItemResponse>;
export declare function createItem(data: {
    name: string;
    itemType: string;
    unitOfMeasure: string;
    lowStockThreshold: number;
}): Promise<InventoryItemResponse>;
export declare function getMovements(itemId: string, params: {
    from?: string;
    to?: string;
    limit: number;
    offset: number;
}): Promise<{
    items: StockMovementResponse[];
    total: number;
}>;
export declare function recordManualMovement(data: {
    itemId: string;
    movementType: string;
    quantity: number;
    notes?: string;
    recordedBy: string;
}): Promise<StockMovementResponse>;
export {};
//# sourceMappingURL=service.d.ts.map