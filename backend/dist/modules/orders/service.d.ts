import type { CustomerResponse, OrderResponse } from './types.js';
export declare function listCustomers(search?: string): Promise<CustomerResponse[]>;
export declare function createCustomer(data: {
    name: string;
    contactInfo?: string;
}): Promise<CustomerResponse>;
export declare function listOrders(params: {
    status?: string;
    customerId?: string;
    from?: string;
    to?: string;
    limit: number;
    offset: number;
}): Promise<{
    items: OrderResponse[];
    total: number;
}>;
export declare function getOrder(id: string): Promise<OrderResponse>;
/**
 * OrdersService.createOrder — Does NOT call InventoryService
 * per §2.4 decision 1. lineItems reference finished goods by FK
 * for display/reporting only, not a stock hold.
 */
export declare function createOrder(data: {
    customerId: string;
    createdBy: string;
    requestedDeliveryDate: string;
    lineItems: Array<{
        finishedGoodId: string;
        quantity: number;
        specNotes?: string;
    }>;
}): Promise<OrderResponse>;
/**
 * OrdersService.updateOrderStatus — with optimistic locking.
 * Called only by Owner UI action — never automatically by Production module.
 */
export declare function updateOrderStatus(orderId: string, data: {
    status?: string;
    version: number;
}): Promise<OrderResponse>;
/**
 * OrdersService.getOrdersForJob — read-only cross-module call.
 */
export declare function getOrderForJob(jobId: string): Promise<OrderResponse | null>;
//# sourceMappingURL=service.d.ts.map