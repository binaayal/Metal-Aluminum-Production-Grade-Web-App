export interface InventoryItemResponse {
  id: string;
  name: string;
  itemType: string;
  unitOfMeasure: string;
  lowStockThreshold: number;
  currentStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovementResponse {
  id: string;
  itemId: string;
  itemName?: string;
  recordedBy: string;
  recordedByName?: string;
  movementType: string;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  recordedAt: string;
}
