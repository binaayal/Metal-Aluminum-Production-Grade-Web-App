import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ForbiddenError } from '../../lib/errors.js';
import { parsePagination } from '../../lib/pagination.js';
import * as orderService from './service.js';

function requireOwner(request: FastifyRequest): void {
  if (request.session.userRole !== 'owner') {
    throw new ForbiddenError();
  }
}

const CreateCustomerBody = z.object({
  name: z.string().min(2),
  contactInfo: z.string().optional(),
});

const CreateOrderBody = z.object({
  customerId: z.string().uuid(),
  lineItems: z.array(z.object({
    finishedGoodId: z.string().uuid(),
    quantity: z.number().int().positive(),
    specNotes: z.string().optional(),
  })).min(1),
  requestedDeliveryDate: z.string().min(1),
});

const UpdateOrderBody = z.object({
  status: z.enum(['Received', 'In Production', 'Ready for Delivery', 'Fulfilled', 'Cancelled']).optional(),
  version: z.number().int(),
});

export async function registerOrderRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/orders/customers
  app.get<{ Querystring: { search?: string } }>(
    '/api/orders/customers',
    async (request, reply) => {
      const customers = await orderService.listCustomers(request.query.search);
      reply.send(customers);
    }
  );

  // POST /api/orders/customers — Owner only
  app.post('/api/orders/customers', async (request: FastifyRequest, reply: FastifyReply) => {
    requireOwner(request);
    const body = CreateCustomerBody.parse(request.body);
    const customer = await orderService.createCustomer(body);
    reply.code(201).send(customer);
  });

  // GET /api/orders
  app.get<{ Querystring: { status?: string; customerId?: string; from?: string; to?: string; limit?: string; offset?: string } }>(
    '/api/orders',
    async (request, reply) => {
      const pagination = parsePagination(request.query);
      const result = await orderService.listOrders({
        status: request.query.status,
        customerId: request.query.customerId,
        from: request.query.from,
        to: request.query.to,
        ...pagination,
      });
      reply.send(result);
    }
  );

  // POST /api/orders — Owner only
  app.post('/api/orders', async (request: FastifyRequest, reply: FastifyReply) => {
    requireOwner(request);
    const body = CreateOrderBody.parse(request.body);
    const order = await orderService.createOrder({
      ...body,
      createdBy: request.session.userId!,
    });
    reply.code(201).send(order);
  });

  // GET /api/orders/:id
  app.get<{ Params: { id: string } }>('/api/orders/:id', async (request, reply) => {
    const order = await orderService.getOrder(request.params.id);
    reply.send(order);
  });

  // PATCH /api/orders/:id — Owner only
  app.patch<{ Params: { id: string } }>('/api/orders/:id', async (request, reply) => {
    requireOwner(request);
    const body = UpdateOrderBody.parse(request.body);
    const order = await orderService.updateOrderStatus(request.params.id, body);
    reply.send(order);
  });
}
