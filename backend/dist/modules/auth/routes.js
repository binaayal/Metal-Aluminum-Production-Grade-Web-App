import { z } from 'zod';
import { authenticateUser, getUserById } from './service.js';
const LoginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});
export async function registerAuthRoutes(app) {
    // POST /api/auth/login
    app.post('/api/auth/login', async (request, reply) => {
        const body = LoginBodySchema.parse(request.body);
        const user = await authenticateUser(body.email, body.password);
        // Set session data
        request.session.userId = user.id;
        request.session.userRole = user.role;
        request.session.userName = user.name;
        request.session.userEmail = user.email;
        await request.session.save();
        reply.code(200).send({ user });
    });
    // POST /api/auth/logout
    app.post('/api/auth/logout', async (request, reply) => {
        await request.session.destroy();
        reply.code(204).send();
    });
    // GET /api/auth/me
    app.get('/api/auth/me', async (request, reply) => {
        if (!request.session?.userId) {
            reply.code(401).send({
                error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' },
            });
            return;
        }
        const user = await getUserById(request.session.userId);
        if (!user) {
            await request.session.destroy();
            reply.code(401).send({
                error: { code: 'UNAUTHORIZED', message: 'User no longer exists.' },
            });
            return;
        }
        reply.send({ user });
    });
}
//# sourceMappingURL=routes.js.map