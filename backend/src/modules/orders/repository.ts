import prisma, { Prisma } from '../../lib/prisma.js';
import type { OrderStatus } from '@prisma/client';
import type { CustomerResponse, OrderResponse } from './types.js';

// Map Prisma OrderStatus enum to display strings
const statusDisplayMap: Record<string, string> = {
  'Received': 'Received',
  'InProduction': 'In Production',
  'ReadyForDelivery': 'Ready for Delivery',
  'Fulfilled': 'Fulfilled',
  'Cancelled': 'Cancelled',
};

const statusToEnum: Record<string, OrderStatus> = {
  'Received': 'Received',
  'In Production': 'InProduction',
  'Ready for Delivery': 'ReadyForDelivery',
  'Fulfilled': 'Fulfilled',
  'Cancelled': 'Cancelled',
};

function formatOrderStatus(status: OrderStatus): string {
  return statusDisplayMap[status] || status;
}

export function parseOrderStatus(status: string): OrderStatus {
  return statusToEnum[status] || (status as OrderStatus);
}

function toCustomerResponse(c: { id: string; name: string; contactInfo: string | null; createdAt: Date }): CustomerResponse {
  return {
    id: c.id,
    name: c.name,
    contactInfo: c.contactInfo || '',
    createdAt: c.createdAt.toISOString(),
  };
}

function toOrderResponse(order: any): OrderResponse {
  return {
    id: order.id,
    customerId: order.customerId,
    customerName: order.customer?.name || '',
    createdBy: order.createdBy,
    createdByName: order.creator?.name || '',
    status: formatOrderStatus(order.status),
    requestedDeliveryDate: order.requestedDeliveryDate instanceof Date
      ? order.requestedDeliveryDate.toISOString().split('T')[0]
      : order.requestedDeliveryDate,
    version: order.version,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    lineItems: (order.lineItems || []).map((li: any) => ({
      id: li.id,
      orderId: li.orderId,
      finishedGoodId: li.finishedGoodId,
      finishedGoodName: li.finishedGood?.name || '',
      quantity: li.quantity,
      specNotes: li.specNotes || null,
    })),
    linkedJobsCount: order._count?.jobs ?? order.jobs?.length ?? 0,
  };
}

const orderInclude = {
  customer: { select: { name: true } },
  creator: { select: { name: true } },
  lineItems: {
    include: {
      finishedGood: { select: { name: true } },
    },
  },
  _count: { select: { jobs: true } },
};

// ── Customers ───────────────────────────────────────────

export async function findCustomers(search?: string): Promise<CustomerResponse[]> {
  const where: Prisma.CustomerWhereInput = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { name: 'asc' },
  });
  return customers.map(toCustomerResponse);
}

export async function createCustomer(data: { name: string; contactInfo?: string }): Promise<CustomerResponse> {
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      contactInfo: data.contactInfo || null,
    },
  });
  return toCustomerResponse(customer);
}

// ── Orders ──────────────────────────────────────────────

export async function findAllOrders(params: {
  status?: string;
  customerId?: string;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}): Promise<{ items: OrderResponse[]; total: number }> {
  const where: Prisma.OrderWhereInput = {};

  if (params.status) {
    where.status = parseOrderStatus(params.status);
  }
  if (params.customerId) {
    where.customerId = params.customerId;
  }
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) where.createdAt.lte = new Date(params.to);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: params.limit,
      skip: params.offset,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: orders.map(toOrderResponse),
    total,
  };
}

export async function findOrderById(id: string): Promise<OrderResponse | null> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      ...orderInclude,
      jobs: true,
    },
  });

  if (!order) return null;
  return toOrderResponse(order);
}

export async function createOrder(data: {
  customerId: string;
  createdBy: string;
  requestedDeliveryDate: string;
  lineItems: Array<{ finishedGoodId: string; quantity: number; specNotes?: string }>;
}): Promise<OrderResponse> {
  const order = await prisma.order.create({
    data: {
      customerId: data.customerId,
      createdBy: data.createdBy,
      status: 'Received',
      requestedDeliveryDate: new Date(data.requestedDeliveryDate),
      lineItems: {
        create: data.lineItems.map((li) => ({
          finishedGoodId: li.finishedGoodId,
          quantity: li.quantity,
          specNotes: li.specNotes || null,
        })),
      },
    },
    include: orderInclude,
  });

  return toOrderResponse(order);
}

/**
 * Update order status with optimistic locking (NFR-4.1).
 * Returns null if version conflict.
 */
export async function updateOrder(
  id: string,
  data: { status?: string },
  expectedVersion: number
): Promise<OrderResponse | null> {
  const updateData: Prisma.OrderUpdateInput = {
    version: { increment: 1 },
  };

  if (data.status) {
    updateData.status = parseOrderStatus(data.status);
  }

  try {
    const order = await prisma.order.update({
      where: { id, version: expectedVersion },
      data: updateData,
      include: orderInclude,
    });
    return toOrderResponse(order);
  } catch (err: any) {
    if (err.code === 'P2025') {
      return null;
    }
    throw err;
  }
}

/**
 * OrdersService.getOrdersForJob — read-only cross-module call.
 * Called by Production to display "this Job is for Order #X".
 */
export async function findOrderByJobId(jobId: string): Promise<OrderResponse | null> {
  const order = await prisma.order.findFirst({
    where: { jobs: { some: { id: jobId } } },
    include: orderInclude,
  });
  if (!order) return null;
  return toOrderResponse(order);
}
