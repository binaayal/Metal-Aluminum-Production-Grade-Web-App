// Orders module — public barrel export
export {
  listCustomers,
  createCustomer,
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getOrderForJob,
} from './service.js';

export type { CustomerResponse, OrderResponse, OrderLineItemResponse } from './types.js';
