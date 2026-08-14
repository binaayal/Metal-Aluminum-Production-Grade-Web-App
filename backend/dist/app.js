import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyCors from '@fastify/cors';
import pgSimple from 'connect-pg-simple';
import pg from 'pg';
import { AppError } from './lib/errors.js';
import { ZodError } from 'zod';
// Module route registrations
import { registerAuthRoutes } from './modules/auth/routes.js';
import { registerUserRoutes } from './modules/users/routes.js';
import { registerProductionRoutes } from './modules/production/routes.js';
import { registerInventoryRoutes } from './modules/inventory/routes.js';
import { registerOrderRoutes } from './modules/orders/routes.js';
import { registerReportRoutes } from './modules/reporting/routes.js';
export async function buildApp() {
    const app = Fastify({
        logger: {
            level: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
            transport: process.env.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
        },
    });
    // ── CORS ──────────────────────────────────────────────
    await app.register(fastifyCors, {
        origin: process.env.NODE_ENV === 'development'
            ? ['http://localhost:3000', 'http://127.0.0.1:3000']
            : true,
        credentials: true,
    });
    // ── Cookie + Session ──────────────────────────────────
    await app.register(fastifyCookie);
    // connect-pg-simple expects the express-session module as its argument.
    // @fastify/session re-exports express-session internals, so we can
    // pass it directly (it has the compatible Store class).
    const PgSession = pgSimple(fastifySession);
    const pgPool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
    });
    await app.register(fastifySession, {
        secret: process.env.SESSION_SECRET || 'change-me-in-production-this-is-insecure',
        store: new PgSession({
            pool: pgPool,
            tableName: 'session',
            schemaName: 'public',
            createTableIfMissing: true, // Auto-create if missing, safe for dev
        }),
        cookie: {
            maxAge: 8 * 60 * 60 * 1000, // 8 hours (shift-aligned per NFR-2.2)
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        },
        saveUninitialized: false,
    });
    // ── Auth preHandler hook ──────────────────────────────
    // Applied to all /api/* routes except /api/auth/login
    app.addHook('preHandler', async (request, reply) => {
        const url = request.url;
        // Skip auth for login endpoint and health check
        if (url === '/api/auth/login' || url === '/health') {
            return;
        }
        // All other /api/* routes require a valid session
        if (url.startsWith('/api/')) {
            if (!request.session?.userId) {
                reply.code(401).send({
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required.',
                    },
                });
                return;
            }
        }
    });
    // ── Global Error Handler ──────────────────────────────
    app.setErrorHandler((error, request, reply) => {
        // AppError (our custom errors)
        if (error instanceof AppError) {
            reply.code(error.statusCode).send(error.toJSON());
            return;
        }
        // Zod validation errors
        if (error instanceof ZodError) {
            const fields = {};
            for (const issue of error.issues) {
                const path = issue.path.join('.');
                fields[path] = issue.message;
            }
            reply.code(400).send({
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Request validation failed.',
                    fields,
                },
            });
            return;
        }
        // Log unexpected errors
        request.log.error(error, 'Unhandled error');
        reply.code(500).send({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred.',
            },
        });
    });
    // ── Health Check ──────────────────────────────────────
    app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
    // ── Register Module Routes ────────────────────────────
    await registerAuthRoutes(app);
    await registerUserRoutes(app);
    await registerProductionRoutes(app);
    await registerInventoryRoutes(app);
    await registerOrderRoutes(app);
    await registerReportRoutes(app);
    return app;
}
//# sourceMappingURL=app.js.map