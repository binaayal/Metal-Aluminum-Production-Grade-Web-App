import prisma from '../../lib/prisma.js';
import { NotFoundError, ConflictError, ValidationError } from '../../lib/errors.js';
import * as repo from './repository.js';
import { recordMovement } from '../inventory/index.js'; // Cross-module call through barrel
// ── Public Interface (module-interfaces.md) ─────────────
export async function listJobs(params) {
    return repo.findAllJobs(params);
}
export async function getJob(id) {
    const job = await repo.findJobById(id);
    if (!job) {
        throw new NotFoundError('Job', id);
    }
    return job;
}
/**
 * ProductionService.createJob
 */
export async function createJob(data) {
    return repo.createJob(data);
}
/**
 * Update job status/description with optimistic locking (NFR-4.1).
 * Returns 409 Conflict if version mismatch.
 */
export async function updateJob(id, data) {
    // Verify job exists
    const existing = await repo.findJobById(id);
    if (!existing) {
        throw new NotFoundError('Job', id);
    }
    const { version, ...updateData } = data;
    const result = await repo.updateJob(id, updateData, version);
    if (!result) {
        throw new ConflictError('This job was modified by another user. Please refresh and try again.');
    }
    return result;
}
/**
 * ProductionService.logProductionRun — THE transactional endpoint.
 *
 * From architecture-design §3: opens a Prisma transaction, creates the
 * production run + materials, then calls InventoryService.recordMovement()
 * for each consumed material and for finished goods receipt — all inside
 * the same transaction.
 */
export async function logProductionRun(jobId, data, loggedBy) {
    // Verify job exists and is in a valid state for logging runs
    const job = await repo.getJobRaw(jobId);
    if (!job) {
        throw new NotFoundError('Job', jobId);
    }
    if (job.status === 'Completed' || job.status === 'Cancelled') {
        throw new ValidationError(`Cannot log a production run against a ${job.status === 'Completed' ? 'Completed' : 'Cancelled'} job.`);
    }
    // Execute everything inside a single transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create production run + materials
        const run = await repo.createProductionRun(tx, {
            jobId,
            loggedBy,
            quantityProduced: data.quantityProduced,
            materialsConsumed: data.materialsConsumed,
        });
        // 2. For each material consumed: call InventoryService.recordMovement
        //    with negative quantity (consumption) — INSIDE the transaction
        for (const mat of data.materialsConsumed) {
            await recordMovement(mat.itemId, 'consumption', -Math.abs(mat.quantity), // Ensure negative for consumption
            'production_run', run.id, loggedBy, undefined, tx // Pass transaction client
            );
        }
        // 3. If quantityProduced > 0 AND the job has a finished good,
        //    record a receipt movement for the finished good
        if (data.quantityProduced > 0 && job.finishedGoodId) {
            await recordMovement(job.finishedGoodId, 'receipt', data.quantityProduced, // Positive for receipt
            'production_run', run.id, loggedBy, undefined, tx // Pass transaction client
            );
        }
        // 4. Auto-transition job to 'In Progress' if still 'Pending'
        if (job.status === 'Pending') {
            await tx.job.update({
                where: { id: jobId },
                data: { status: 'InProgress' },
            });
        }
        return run;
    });
    return result;
}
/**
 * ProductionService.getJobStatus — read-only, for Orders module.
 */
export async function getJobStatus(jobId) {
    const job = await repo.findJobById(jobId);
    if (!job)
        return null;
    return {
        status: job.status,
        quantityProduced: job.producedQuantity,
        targetQuantity: job.targetQuantity,
    };
}
//# sourceMappingURL=service.js.map