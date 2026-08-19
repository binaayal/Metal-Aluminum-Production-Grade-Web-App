import { PrismaClient } from '@prisma/client';

// Singleton PrismaClient — reused across all modules
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;

// Re-export Prisma namespace for transaction client typing
export type { PrismaClient } from '@prisma/client';
export { Prisma } from '@prisma/client';
