import { apiGet, apiPost } from './client';
import type { InventoryItem, StockMovement } from '../types/domain';
import type { CreateInventoryItemInput, RecordMovementInput } from '../schemas/validation';

export async function getInventoryItems(params?: {
  type?: string;
  belowThreshold?: boolean;
  search?: string;
}): Promise<{ items: InventoryItem[]; total: number }> {
  const result = await apiGet<{ items: InventoryItem[]; total: number }>('/api/inventory/items', {
    type: params?.type,
    belowThreshold: params?.belowThreshold ? 'true' : undefined,
  });
  // Client-side search filter (backend doesn't have text search for items)
  if (params?.search) {
    const term = params.search.toLowerCase();
    const filtered = result.items.filter(item =>
      item.name.toLowerCase().includes(term)
    );
    return { items: filtered, total: filtered.length };
  }
  return result;
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  return apiGet<InventoryItem>(`/api/inventory/items/${id}`);
}

export async function createInventoryItem(input: CreateInventoryItemInput): Promise<InventoryItem> {
  return apiPost<InventoryItem>('/api/inventory/items', input);
}

export async function getItemMovements(
  itemId: string,
  params?: { from?: string; to?: string }
): Promise<{ items: StockMovement[]; total: number }> {
  return apiGet<{ items: StockMovement[]; total: number }>(`/api/inventory/items/${itemId}/movements`, {
    from: params?.from,
    to: params?.to,
  });
}

export async function recordMovement(input: RecordMovementInput): Promise<StockMovement> {
  return apiPost<StockMovement>('/api/inventory/movements', input);
}
