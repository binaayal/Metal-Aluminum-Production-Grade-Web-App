import prisma from '../../lib/prisma.js';
function toItemResponse(item, currentStock) {
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
export async function computeCurrentStock(itemId, tx) {
    const client = tx || prisma;
    const result = await client.stockMovement.aggregate({
        where: { itemId },
        _sum: { quantity: true },
    });
    return Number(result._sum.quantity || 0);
}
export async function findAllItems(params) {
    const where = {};
    if (params.type) {
        where.itemType = params.type;
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
    const itemsWithStock = await Promise.all(items.map(async (item) => {
        const stock = await computeCurrentStock(item.id);
        return toItemResponse(item, stock);
    }));
    // Filter by belowThreshold if requested
    if (params.belowThreshold) {
        const filtered = itemsWithStock.filter((item) => item.currentStock < item.lowStockThreshold);
        return { items: filtered, total: filtered.length };
    }
    return { items: itemsWithStock, total };
}
export async function findItemById(id) {
    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item)
        return null;
    const stock = await computeCurrentStock(id);
    return toItemResponse(item, stock);
}
export async function createItem(data) {
    const item = await prisma.inventoryItem.create({
        data: {
            name: data.name,
            itemType: data.itemType,
            unitOfMeasure: data.unitOfMeasure,
            lowStockThreshold: data.lowStockThreshold,
        },
    });
    return toItemResponse(item, 0); // New item starts with 0 stock
}
export async function findMovementsByItemId(itemId, params) {
    const where = { itemId };
    if (params.from || params.to) {
        where.recordedAt = {};
        if (params.from)
            where.recordedAt.gte = new Date(params.from);
        if (params.to)
            where.recordedAt.lte = new Date(params.to);
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
export async function createMovement(data, tx) {
    const client = tx || prisma;
    const movement = await client.stockMovement.create({
        data: {
            itemId: data.itemId,
            movementType: data.movementType,
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
export async function findItemsBelowThreshold() {
    const allItems = await prisma.inventoryItem.findMany();
    const results = [];
    for (const item of allItems) {
        const stock = await computeCurrentStock(item.id);
        if (stock < Number(item.lowStockThreshold)) {
            results.push(toItemResponse(item, stock));
        }
    }
    return results;
}
//# sourceMappingURL=repository.js.map