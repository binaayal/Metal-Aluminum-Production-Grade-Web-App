import { PrismaClient } from '@prisma/client';
// Singleton PrismaClient — reused across all modules
const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});
export default prisma;
export { Prisma } from '@prisma/client';
//# sourceMappingURL=prisma.js.map