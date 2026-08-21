import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ForbiddenError } from '../../lib/errors.js';
import { parsePagination } from '../../lib/pagination.js';
import * as inventoryService from './service.js';

function requireOwner(request: FastifyRequest): void {
  if (request.session.userRole !== 'owner') {
    throw new ForbiddenError();
  }
}

const CreateItemBody = z.object({
  name: z.string().min(2),
  itemType: z.enum(['raw_material', 'finished_good']),
  unitOfMeasure: z.string().min(1),
  lowStockThreshold: z.number().nonnegative(),
});

const RecordMovementBody = z.object({
  itemId: z.string().uuid(),
  movementType: z.enum(['receipt', 'consumption', 'adjustment', 'shipment']),
  quantity: z.number().refine((val) => val !== 0, { message: 'Quantity cannot be 0' }),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.movementType === 'receipt' && data.quantity <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Receipt quantity must be positive', path: ['quantity'] });
  } else if ((data.movementType === 'consumption' || data.movementType === 'shipment') && data.quantity >= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${data.movementType} quantity must be negative`, path: ['quantity'] });
  }
});

export async function registerInventoryRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/inventory/items
  app.get<{ Querystring: { type?: string; belowThreshold?: string; limit?: string; offset?: string } }>(
    '/api/inventory/items',
    async (request, reply) => {
      const pagination = parsePagination(request.query);
      const result = await inventoryService.listItems({
        type: request.query.type,
        belowThreshold: request.query.belowThreshold === 'true',
        ...pagination,
      });
      reply.send(result);
    }
  );

  // POST /api/inventory/items — Owner only
  app.post('/api/inventory/items', async (request: FastifyRequest, reply: FastifyReply) => {
    requireOwner(request);
    const body = CreateItemBody.parse(request.body);
    const item = await inventoryService.createItem(body);
    reply.code(201).send(item);
  });

  // GET /api/inventory/items/:id
  app.get<{ Params: { id: string } }>('/api/inventory/items/:id', async (request, reply) => {
    const item = await inventoryService.getItem(request.params.id);
    reply.send(item);
  });

  // GET /api/inventory/items/:id/movements
  app.get<{ Params: { id: string }; Querystring: { from?: string; to?: string; limit?: string; offset?: string } }>(
    '/api/inventory/items/:id/movements',
    async (request, reply) => {
      const pagination = parsePagination(request.query);
      const result = await inventoryService.getMovements(request.params.id, {
        from: request.query.from,
        to: request.query.to,
        ...pagination,
      });
      reply.send(result);
    }
  );

  // POST /api/inventory/movements — Owner only
  app.post('/api/inventory/movements', async (request: FastifyRequest, reply: FastifyReply) => {
    requireOwner(request);
    const body = RecordMovementBody.parse(request.body);
    const movement = await inventoryService.recordManualMovement({
      ...body,
      recordedBy: request.session.userId!,
    });
    reply.code(201).send(movement);
  });
}
