import { FastifyInstance } from 'fastify';
declare module '@fastify/session' {
    interface FastifySessionObject {
        userId?: string;
        userRole?: string;
        userName?: string;
        userEmail?: string;
    }
}
export declare function buildApp(): Promise<FastifyInstance>;
//# sourceMappingURL=app.d.ts.map