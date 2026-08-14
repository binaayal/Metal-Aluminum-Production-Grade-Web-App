import type { JobResponse, ProductionRunResponse } from './types.js';
export declare function listJobs(params: {
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
export declare function getJob(id: string): Promise<JobResponse>;
/**
 * ProductionService.createJob
 */
export declare function createJob(data: {
    description: string;
    targetQuantity: number;
    orderId?: string | null;
    finishedGoodId?: string | null;
    targetCompletionDate: string;
    createdBy: string;
}): Promise<JobResponse>;
/**
 * Update job status/description with optimistic locking (NFR-4.1).
 * Returns 409 Conflict if version mismatch.
 */
export declare function updateJob(id: string, data: {
    status?: string;
    description?: string;
    targetCompletionDate?: string;
    version: number;
}): Promise<JobResponse>;
/**
 * ProductionService.logProductionRun — THE transactional endpoint.
 *
 * From architecture-design §3: opens a Prisma transaction, creates the
 * production run + materials, then calls InventoryService.recordMovement()
 * for each consumed material and for finished goods receipt — all inside
 * the same transaction.
 */
export declare function logProductionRun(jobId: string, data: {
    quantityProduced: number;
    materialsConsumed: Array<{
        itemId: string;
        quantity: number;
    }>;
}, loggedBy: string): Promise<ProductionRunResponse>;
/**
 * ProductionService.getJobStatus — read-only, for Orders module.
 */
export declare function getJobStatus(jobId: string): Promise<{
    status: string;
    quantityProduced: number;
    targetQuantity: number;
} | null>;
//# sourceMappingURL=service.d.ts.map