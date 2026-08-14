import * as reportService from './service.js';
export async function registerReportRoutes(app) {
    // GET /api/reports/production
    app.get('/api/reports/production', async (request, reply) => {
        const result = await reportService.getProductionReport({
            from: request.query.from,
            to: request.query.to,
            groupBy: request.query.groupBy,
            filterBy: request.query.filterBy,
        });
        reply.send(result);
    });
    // GET /api/reports/inventory
    app.get('/api/reports/inventory', async (request, reply) => {
        const result = await reportService.getInventoryReport({
            from: request.query.from,
            to: request.query.to,
            groupBy: request.query.groupBy,
            itemId: request.query.itemId,
        });
        reply.send(result);
    });
    // GET /api/reports/orders
    app.get('/api/reports/orders', async (request, reply) => {
        const result = await reportService.getOrdersReport({
            from: request.query.from,
            to: request.query.to,
            groupBy: request.query.groupBy,
            customerId: request.query.customerId,
        });
        reply.send(result);
    });
}
//# sourceMappingURL=routes.js.map