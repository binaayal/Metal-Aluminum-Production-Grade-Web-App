import { Prisma } from '../../lib/prisma.js';
import type { JobStatus } from '@prisma/client';
import type { JobResponse, ProductionRunResponse } from './types.js';
type TxClient = Prisma.TransactionClient;
export declare function parseJobStatus(status: string): JobStatus;
export declare function findAllJobs(params: {
    status?: string;
    orderId?: string;
    from?: string;
    to?: string;
    limit: number;
    offset: number;
}): Promise<{
    items: JobResponse[];
    total: number;
}>;
export declare function findJobById(id: string): Promise<JobResponse | null>;
export declare function createJob(data: {
    description: string;
    targetQuantity: number;
    orderId?: string | null;
    finishedGoodId?: string | null;
    targetCompletionDate: string;
    createdBy: string;
}): Promise<JobResponse>;
/**
 * Update job with optimistic locking (NFR-4.1).
 * Returns null if version conflict (0 rows affected).
 */
export declare function updateJob(id: string, data: {
    status?: string;
    description?: string;
    targetCompletionDate?: string;
}, expectedVersion: number): Promise<JobResponse | null>;
/**
 * Create a production run and its materials inside a transaction.
 * Returns the run data; the service layer handles inventory movements.
 */
export declare function createProductionRun(tx: TxClient, data: {
    jobId: string;
    loggedBy: string;
    quantityProduced: number;
    materialsConsumed: Array<{
        itemId: string;
        quantity: number;
    }>;
}): Promise<ProductionRunResponse>;
export declare function getJobRaw(id: string, tx?: TxClient): Promise<({
    finishedGood: {
        id: string;
        name: string;
    } | null;
} & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: import("@prisma/client").$Enums.JobStatus;
    version: number;
    description: string;
    targetQuantity: number;
    targetCompletionDate: Date;
    orderId: string | null;
    finishedGoodId: string | null;
    createdBy: string;
}) | null>;
export {};
//# sourceMappingURL=repository.d.ts.map