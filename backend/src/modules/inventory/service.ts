import { NotFoundError, ValidationError } from '../../lib/errors.js';
import * as repo from './repository.js';
import type { Prisma } from '../../lib/prisma.js';
import type { InventoryItemResponse, StockMovementResponse } from './types.js';

type TxClient = Prisma.TransactionClient;

// ── Public Interface (module-interfaces.md) ─────────────

/**
 * InventoryService.recordMovement
 * Called by: Production module (for material consumption and finished goods receipt)
 *            and directly by routes for manual movements.
 * Accepts optional tx for cross-module transaction participation.
 */
export async function recordMovement(
  itemId: string,
  movementType: string,
  quantity: number,
  referenceType: string,
  referenceId: string | undefined,
  recordedBy: string,
  notes?: string,
  tx?: TxClient
): Promise<StockMovementResponse> {
  // Validate item exists
  const item = await repo.findItemById(itemId);
  if (!item) {
    throw new NotFoundError('InventoryItem', itemId);
  }

  return repo.createMovement(
    {
      itemId,
      movementType,
      quantity,
      recordedBy,
      referenceType,
      referenceId,
      notes,
    },
    tx
  );
}

/**
 * InventoryService.getCurrentStock
 * Called by: Orders module (read-only), Reporting module, Dashboard.
 */
export async function getCurrentStock(itemId: string): Promise<{ itemId: string; quantity: number; unit: string }> {
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
export async function getItemsBelowThreshold(): Promise<InventoryItemResponse[]> {
  return repo.findItemsBelowThreshold();
}

// ── Route-facing service methods ────────────────────────

export async function listItems(params: {
  type?: string;
  belowThreshold?: boolean;
  limit: number;
  offset: number;
}): Promise<{ items: InventoryItemResponse[]; total: number }> {
  return repo.findAllItems(params);
}

export async function getItem(id: string): Promise<InventoryItemResponse> {
  const item = await repo.findItemById(id);
  if (!item) {
    throw new NotFoundError('InventoryItem', id);
  }
  return item;
}

export async function createItem(data: {
  name: string;
  itemType: string;
  unitOfMeasure: string;
  lowStockThreshold: number;
}): Promise<InventoryItemResponse> {
  return repo.createItem(data);
}

export async function getMovements(
  itemId: string,
  params: { from?: string; to?: string; limit: number; offset: number }
): Promise<{ items: StockMovementResponse[]; total: number }> {
  // Verify item exists
  const item = await repo.findItemById(itemId);
  if (!item) {
    throw new NotFoundError('InventoryItem', itemId);
  }
  return repo.findMovementsByItemId(itemId, params);
}

export async function recordManualMovement(data: {
  itemId: string;
  movementType: string;
  quantity: number;
  notes?: string;
  recordedBy: string;
}): Promise<StockMovementResponse> {
  return recordMovement(
    data.itemId,
    data.movementType,
    data.quantity,
    'manual',
    undefined,
    data.recordedBy,
    data.notes
  );
}
