import { NotFoundError, ConflictError } from '../../lib/errors.js';
import * as repo from './repository.js';
// ── Public Interface (module-interfaces.md) ─────────────
export async function listCustomers(search) {
    return repo.findCustomers(search);
}
export async function createCustomer(data) {
    return repo.createCustomer(data);
}
export async function listOrders(params) {
    return repo.findAllOrders(params);
}
export async function getOrder(id) {
    const order = await repo.findOrderById(id);
    if (!order) {
        throw new NotFoundError('Order', id);
    }
    return order;
}
/**
 * OrdersService.createOrder — Does NOT call InventoryService
 * per §2.4 decision 1. lineItems reference finished goods by FK
 * for display/reporting only, not a stock hold.
 */
export async function createOrder(data) {
    return repo.createOrder(data);
}
/**
 * OrdersService.updateOrderStatus — with optimistic locking.
 * Called only by Owner UI action — never automatically by Production module.
 */
export async function updateOrderStatus(orderId, data) {
    const existing = await repo.findOrderById(orderId);
    if (!existing) {
        throw new NotFoundError('Order', orderId);
    }
    const { version, ...updateData } = data;
    const result = await repo.updateOrder(orderId, updateData, version);
    if (!result) {
        throw new ConflictError('This order was modified by another user. Please refresh and try again.');
    }
    return result;
}
/**
 * OrdersService.getOrdersForJob — read-only cross-module call.
 */
export async function getOrderForJob(jobId) {
    return repo.findOrderByJobId(jobId);
}
//# sourceMappingURL=service.js.map