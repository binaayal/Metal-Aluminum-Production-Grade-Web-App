import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ForbiddenError } from '../../lib/errors.js';
import * as userService from './service.js';

const CreateUserBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['owner', 'viewer']),
});

const UpdateUserBody = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['owner', 'viewer']).optional(),
  active: z.boolean().optional(),
});

function requireOwner(request: FastifyRequest): void {
  if (request.session.userRole !== 'owner') {
    throw new ForbiddenError();
  }
}

export async function registerUserRoutes(app: FastifyInstance): Promise<void> {

  // GET /api/users — Owner only
  app.get('/api/users', async (request: FastifyRequest, reply: FastifyReply) => {
    requireOwner(request);
    const users = await userService.listUsers();
    reply.send(users);
  });

  // POST /api/users — Owner only
  app.post('/api/users', async (request: FastifyRequest, reply: FastifyReply) => {
    requireOwner(request);
    const body = CreateUserBody.parse(request.body);
    const user = await userService.createUser(body);
    reply.code(201).send(user);
  });

  // PATCH /api/users/:id — Owner only
  app.patch<{ Params: { id: string } }>('/api/users/:id', async (request, reply) => {
    requireOwner(request);
    const body = UpdateUserBody.parse(request.body);
    const user = await userService.updateUser(request.params.id, body);
    reply.send(user);
  });
}
