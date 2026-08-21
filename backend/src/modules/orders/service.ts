import { NotFoundError, ConflictError } from '../../lib/errors.js';
import * as repo from './repository.js';
import type { CustomerResponse, OrderResponse } from './types.js';

// ── Public Interface (module-interfaces.md) ─────────────

export async function listCustomers(search?: string): Promise<CustomerResponse[]> {
  return repo.findCustomers(search);
}

export async function createCustomer(data: { name: string; contactInfo?: string }): Promise<CustomerResponse> {
  return repo.createCustomer(data);
}

export async function listOrders(params: {
  status?: string;
  customerId?: string;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}): Promise<{ items: OrderResponse[]; total: number }> {
  return repo.findAllOrders(params);
}

export async function getOrder(id: string): Promise<OrderResponse> {
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
export async function createOrder(data: {
  customerId: string;
  createdBy: string;
  requestedDeliveryDate: string;
  lineItems: Array<{ finishedGoodId: string; quantity: number; specNotes?: string }>;
}): Promise<OrderResponse> {
  return repo.createOrder(data);
}

/**
 * OrdersService.updateOrderStatus — with optimistic locking.
 * Called only by Owner UI action — never automatically by Production module.
 */
export async function updateOrderStatus(
  orderId: string,
  data: { status?: string; version: number }
): Promise<OrderResponse> {
  const existing = await repo.findOrderById(orderId);
  if (!existing) {
    throw new NotFoundError('Order', orderId);
  }

  const { version, ...updateData } = data;
  const result = await repo.updateOrder(orderId, updateData, version);

  if (!result) {
    throw new ConflictError(
      'This order was modified by another user. Please refresh and try again.'
    );
  }

  return result;
}

/**
 * OrdersService.getOrdersForJob — read-only cross-module call.
 */
export async function getOrderForJob(jobId: string): Promise<OrderResponse | null> {
  return repo.findOrderByJobId(jobId);
}
