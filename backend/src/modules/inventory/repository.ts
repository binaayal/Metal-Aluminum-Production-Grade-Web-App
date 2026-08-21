import prisma, { Prisma } from '../../lib/prisma.js';
import type { ItemType, MovementType } from '@prisma/client';
import type { InventoryItemResponse, StockMovementResponse } from './types.js';

// Transaction client type — allows repository methods to participate in cross-module transactions
type TxClient = Prisma.TransactionClient;

function toItemResponse(
  item: { id: string; name: string; itemType: ItemType; unitOfMeasure: string; lowStockThreshold: Prisma.Decimal; createdAt: Date; updatedAt: Date },
  currentStock: number
): InventoryItemResponse {
  return {
    id: item.id,
    name: item.name,
    itemType: item.itemType,
    unitOfMeasure: item.unitOfMeasure,
    lowStockThreshold: Number(item.lowStockThreshold),
    currentStock,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

/**
 * Compute current stock for an item by summing all movements.
 * FR-3.2: current stock is always derived, never directly edited.
 */
export async function computeCurrentStock(itemId: string, tx?: TxClient): Promise<number> {
  const client = tx || prisma;
  const result = await client.stockMovement.aggregate({
    where: { itemId },
    _sum: { quantity: true },
  });
  return Number(result._sum.quantity || 0);
}

export async function findAllItems(params: {
  type?: string;
  belowThreshold?: boolean;
  limit: number;
  offset: number;
}): Promise<{ items: InventoryItemResponse[]; total: number }> {
  const where: Prisma.InventoryItemWhereInput = {};
  if (params.type) {
    where.itemType = params.type as ItemType;
  }

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit,
      skip: params.offset,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  // Compute current stock for each item
  const itemsWithStock = await Promise.all(
    items.map(async (item) => {
      const stock = await computeCurrentStock(item.id);
      return toItemResponse(item, stock);
    })
  );

  // Filter by belowThreshold if requested
  if (params.belowThreshold) {
    const filtered = itemsWithStock.filter(
      (item) => item.currentStock < item.lowStockThreshold
    );
    return { items: filtered, total: filtered.length };
  }

  return { items: itemsWithStock, total };
}

export async function findItemById(id: string): Promise<InventoryItemResponse | null> {
  const item = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!item) return null;

  const stock = await computeCurrentStock(id);
  return toItemResponse(item, stock);
}

export async function createItem(data: {
  name: string;
  itemType: string;
  unitOfMeasure: string;
  lowStockThreshold: number;
}): Promise<InventoryItemResponse> {
  const item = await prisma.inventoryItem.create({
    data: {
      name: data.name,
      itemType: data.itemType as ItemType,
      unitOfMeasure: data.unitOfMeasure,
      lowStockThreshold: data.lowStockThreshold,
    },
  });
  return toItemResponse(item, 0); // New item starts with 0 stock
}

export async function findMovementsByItemId(
  itemId: string,
  params: { from?: string; to?: string; limit: number; offset: number }
): Promise<{ items: StockMovementResponse[]; total: number }> {
  const where: Prisma.StockMovementWhereInput = { itemId };

  if (params.from || params.to) {
    where.recordedAt = {};
    if (params.from) where.recordedAt.gte = new Date(params.from);
    if (params.to) where.recordedAt.lte = new Date(params.to);
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        item: { select: { name: true } },
        recorder: { select: { name: true } },
      },
      orderBy: { recordedAt: 'desc' },
      take: params.limit,
      skip: params.offset,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    items: movements.map((m) => ({
      id: m.id,
      itemId: m.itemId,
      itemName: m.item.name,
      recordedBy: m.recordedBy,
      recordedByName: m.recorder.name,
      movementType: m.movementType,
      quantity: Number(m.quantity),
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      notes: m.notes,
      recordedAt: m.recordedAt.toISOString(),
    })),
    total,
  };
}

/**
 * Create a stock movement. Accepts optional transaction client for
 * cross-module transaction support (Production module calls this
 * inside its own $transaction).
 */
export async function createMovement(
  data: {
    itemId: string;
    movementType: string;
    quantity: number;
    recordedBy: string;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
  },
  tx?: TxClient
): Promise<StockMovementResponse> {
  const client = tx || prisma;

  const movement = await client.stockMovement.create({
    data: {
      itemId: data.itemId,
      movementType: data.movementType as MovementType,
      quantity: data.quantity,
      recordedBy: data.recordedBy,
      referenceType: data.referenceType || 'manual',
      referenceId: data.referenceId || null,
      notes: data.notes || null,
    },
    include: {
      item: { select: { name: true } },
      recorder: { select: { name: true } },
    },
  });

  return {
    id: movement.id,
    itemId: movement.itemId,
    itemName: movement.item.name,
    recordedBy: movement.recordedBy,
    recordedByName: movement.recorder.name,
    movementType: movement.movementType,
    quantity: Number(movement.quantity),
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    notes: movement.notes,
    recordedAt: movement.recordedAt.toISOString(),
  };
}

/**
 * Get items below their low stock threshold — used by dashboard (FR-3.3).
 */
export async function findItemsBelowThreshold(): Promise<InventoryItemResponse[]> {
  const allItems = await prisma.inventoryItem.findMany();
  const results: InventoryItemResponse[] = [];

  for (const item of allItems) {
    const stock = await computeCurrentStock(item.id);
    if (stock < Number(item.lowStockThreshold)) {
      results.push(toItemResponse(item, stock));
    }
  }

  return results;
}
