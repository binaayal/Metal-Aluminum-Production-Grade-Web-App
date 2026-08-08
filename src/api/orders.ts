import { apiGet, apiPost, apiPatch } from './client';
import type { Customer, Order } from '../types/domain';
import type { CreateCustomerInput, CreateOrderInput, UpdateOrderInput } from '../schemas/validation';

export async function getCustomers(search?: string): Promise<Customer[]> {
  return apiGet<Customer[]>('/api/orders/customers', { search });
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  return apiPost<Customer>('/api/orders/customers', input);
}

export async function getOrders(params?: {
  status?: string;
  customerId?: string;
  search?: string;
}): Promise<{ items: Order[]; total: number }> {
  const result = await apiGet<{ items: Order[]; total: number }>('/api/orders', {
    status: params?.status,
    customerId: params?.customerId,
  });
  // Client-side search filter
  if (params?.search) {
    const term = params.search.toLowerCase();
    const filtered = result.items.filter(order =>
      (order.customerName || '').toLowerCase().includes(term)
    );
    return { items: filtered, total: filtered.length };
  }
  return result;
}

export async function getOrder(id: string): Promise<Order> {
  return apiGet<Order>(`/api/orders/${id}`);
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  return apiPost<Order>('/api/orders', input);
}

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
  return apiPatch<Order>(`/api/orders/${id}`, input);
}
