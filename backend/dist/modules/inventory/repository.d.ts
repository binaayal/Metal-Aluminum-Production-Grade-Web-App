import { Prisma } from '../../lib/prisma.js';
import type { InventoryItemResponse, StockMovementResponse } from './types.js';
type TxClient = Prisma.TransactionClient;
/**
 * Compute current stock for an item by summing all movements.
 * FR-3.2: current stock is always derived, never directly edited.
 */
export declare function computeCurrentStock(itemId: string, tx?: TxClient): Promise<number>;
export declare function findAllItems(params: {
    type?: string;
    belowThreshold?: boolean;
    limit: number;
    offset: number;
}): Promise<{
    items: InventoryItemResponse[];
    total: number;
}>;
export declare function findItemById(id: string): Promise<InventoryItemResponse | null>;
export declare function createItem(data: {
    name: string;
    itemType: string;
    unitOfMeasure: string;
    lowStockThreshold: number;
}): Promise<InventoryItemResponse>;
export declare function findMovementsByItemId(itemId: string, params: {
    from?: string;
    to?: string;
    limit: number;
    offset: number;
}): Promise<{
    items: StockMovementResponse[];
    total: number;
}>;
/**
 * Create a stock movement. Accepts optional transaction client for
 * cross-module transaction support (Production module calls this
 * inside its own $transaction).
 */
export declare function createMovement(data: {
    itemId: string;
    movementType: string;
    quantity: number;
    recordedBy: string;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
}, tx?: TxClient): Promise<StockMovementResponse>;
/**
 * Get items below their low stock threshold — used by dashboard (FR-3.3).
 */
export declare function findItemsBelowThreshold(): Promise<InventoryItemResponse[]>;
export {};
//# sourceMappingURL=repository.d.ts.map