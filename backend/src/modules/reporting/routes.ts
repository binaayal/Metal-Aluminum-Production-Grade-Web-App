import { FastifyInstance } from 'fastify';
import * as reportService from './service.js';

export async function registerReportRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/reports/production
  app.get<{ Querystring: { from?: string; to?: string; groupBy?: string; filterBy?: string } }>(
    '/api/reports/production',
    async (request, reply) => {
      const result = await reportService.getProductionReport({
        from: request.query.from,
        to: request.query.to,
        groupBy: request.query.groupBy,
        filterBy: request.query.filterBy,
      });
      reply.send(result);
    }
  );

  // GET /api/reports/inventory
  app.get<{ Querystring: { from?: string; to?: string; groupBy?: string; itemId?: string } }>(
    '/api/reports/inventory',
    async (request, reply) => {
      const result = await reportService.getInventoryReport({
        from: request.query.from,
        to: request.query.to,
        groupBy: request.query.groupBy,
        itemId: request.query.itemId,
      });
      reply.send(result);
    }
  );

  // GET /api/reports/orders
  app.get<{ Querystring: { from?: string; to?: string; groupBy?: string; customerId?: string } }>(
    '/api/reports/orders',
    async (request, reply) => {
      const result = await reportService.getOrdersReport({
        from: request.query.from,
        to: request.query.to,
        groupBy: request.query.groupBy,
        customerId: request.query.customerId,
      });
      reply.send(result);
    }
  );
}
