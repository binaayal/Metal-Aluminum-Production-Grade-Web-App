import type { OrderStatus } from '@prisma/client';
import type { CustomerResponse, OrderResponse } from './types.js';
export declare function parseOrderStatus(status: string): OrderStatus;
export declare function findCustomers(search?: string): Promise<CustomerResponse[]>;
export declare function createCustomer(data: {
    name: string;
    contactInfo?: string;
}): Promise<CustomerResponse>;
export declare function findAllOrders(params: {
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
export declare function findOrderById(id: string): Promise<OrderResponse | null>;
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
 * Update order status with optimistic locking (NFR-4.1).
 * Returns null if version conflict.
 */
export declare function updateOrder(id: string, data: {
    status?: string;
}, expectedVersion: number): Promise<OrderResponse | null>;
/**
 * OrdersService.getOrdersForJob — read-only cross-module call.
 * Called by Production to display "this Job is for Order #X".
 */
export declare function findOrderByJobId(jobId: string): Promise<OrderResponse | null>;
//# sourceMappingURL=repository.d.ts.map