export type Role = 'owner' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export type JobStatus = 'Pending' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled';

export interface MaterialConsumptionInput {
  itemId: string;
  quantity: number;
}

export interface MaterialConsumedRecord {
  id: string;
  productionRunId: string;
  itemId: string;
  itemName?: string;
  unitOfMeasure?: string;
  quantityConsumed: number;
}

export interface ProductionRun {
  id: string;
  jobId: string;
  loggedBy: string;
  loggedByName?: string;
  quantityProduced: number;
  runDate: string; // ISO String
  materialsConsumed: MaterialConsumedRecord[];
}

export interface Job {
  id: string;
  description: string;
  targetQuantity: number;
  producedQuantity: number;
  status: JobStatus;
  targetCompletionDate: string; // ISO date YYYY-MM-DD
  version: number;
  orderId?: string | null;
  customerName?: string | null;
  finishedGoodId?: string | null;
  finishedGoodName?: string | null;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  productionRuns?: ProductionRun[];
}

export type ItemType = 'raw_material' | 'finished_good';

export interface InventoryItem {
  id: string;
  name: string;
  itemType: ItemType;
  unitOfMeasure: string;
  lowStockThreshold: number;
  currentStock: number; // Derived sum of movements
}

export type MovementType = 'receipt' | 'consumption' | 'adjustment' | 'shipment';

export interface StockMovement {
  id: string;
  itemId: string;
  itemName?: string;
  recordedBy: string;
  recordedByName?: string;
  movementType: MovementType;
  quantity: number; // Positive for receipt, negative for consumption/shipment, either for adjustment
  referenceType?: string | null; // 'production_run', 'manual', 'order_fulfillment'
  referenceId?: string | null;
  recordedAt: string; // ISO timestamp
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  contactInfo: string;
  createdAt: string;
}

export type OrderStatus = 'Received' | 'In Production' | 'Ready for Delivery' | 'Fulfilled' | 'Cancelled';

export interface OrderLineItem {
  id: string;
  orderId: string;
  finishedGoodId: string;
  finishedGoodName?: string;
  quantity: number;
  specNotes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  createdBy: string;
  createdByName?: string;
  status: OrderStatus;
  requestedDeliveryDate: string; // ISO date YYYY-MM-DD
  version: number;
  createdAt: string;
  updatedAt: string;
  lineItems: OrderLineItem[];
  linkedJobsCount?: number;
}

// Analytics / Trend Reporting types
export interface TimeSeriesPoint {
  period: string; // YYYY-MM-DD or YYYY-WW or YYYY-MM
  [key: string]: string | number;
}

export interface ProductionReportSeries {
  period: string;
  unitsProduced: number;
  jobsCompleted: number;
  avgCompletionDays: number;
}

export interface InventoryReportSeries {
  period: string;
  consumed: number;
  received: number;
  netChange: number;
}

export interface OrderReportSeries {
  period: string;
  orderCount: number;
  onTimeRate: number; // Percentage 0-100
  cancelledCount: number;
}
