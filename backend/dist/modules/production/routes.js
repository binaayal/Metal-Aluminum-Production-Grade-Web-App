import { z } from 'zod';
import { ForbiddenError } from '../../lib/errors.js';
import { parsePagination } from '../../lib/pagination.js';
import * as productionService from './service.js';
function requireOwner(request) {
    if (request.session.userRole !== 'owner') {
        throw new ForbiddenError();
    }
}
const CreateJobBody = z.object({
    description: z.string().min(3),
    targetQuantity: z.number().int().positive(),
    orderId: z.string().uuid().nullable().optional(),
    finishedGoodId: z.string().uuid().nullable().optional(),
    targetCompletionDate: z.string().min(1),
});
const UpdateJobBody = z.object({
    status: z.enum(['Pending', 'In Progress', 'On Hold', 'Completed', 'Cancelled']).optional(),
    description: z.string().min(3).optional(),
    targetCompletionDate: z.string().optional(),
    version: z.number().int(),
});
const LogRunBody = z.object({
    quantityProduced: z.number().int().nonnegative(),
    materialsConsumed: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.number().positive(),
    })),
});
export async function registerProductionRoutes(app) {
    // GET /api/production/jobs
    app.get('/api/production/jobs', async (request, reply) => {
        const pagination = parsePagination(request.query);
        const result = await productionService.listJobs({
            status: request.query.status,
            orderId: request.query.orderId,
            from: request.query.from,
            to: request.query.to,
            ...pagination,
        });
        reply.send(result);
    });
    // POST /api/production/jobs — Owner only
    app.post('/api/production/jobs', async (request, reply) => {
        requireOwner(request);
        const body = CreateJobBody.parse(request.body);
        const job = await productionService.createJob({
            ...body,
            createdBy: request.session.userId,
        });
        reply.code(201).send(job);
    });
    // GET /api/production/jobs/:id
    app.get('/api/production/jobs/:id', async (request, reply) => {
        const job = await productionService.getJob(request.params.id);
        reply.send(job);
    });
    // PATCH /api/production/jobs/:id — Owner only
    app.patch('/api/production/jobs/:id', async (request, reply) => {
        requireOwner(request);
        const body = UpdateJobBody.parse(request.body);
        const job = await productionService.updateJob(request.params.id, body);
        reply.send(job);
    });
    // POST /api/production/jobs/:id/runs — Owner only
    // THE transactional endpoint from architecture-design §3
    app.post('/api/production/jobs/:id/runs', async (request, reply) => {
        requireOwner(request);
        const body = LogRunBody.parse(request.body);
        const run = await productionService.logProductionRun(request.params.id, body, request.session.userId);
        reply.code(201).send(run);
    });
}
//# sourceMappingURL=routes.js.map