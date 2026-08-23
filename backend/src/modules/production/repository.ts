import prisma, { Prisma } from '../../lib/prisma.js';
import type { JobStatus } from '@prisma/client';
import type { JobResponse, ProductionRunResponse } from './types.js';

type TxClient = Prisma.TransactionClient;

// Map Prisma JobStatus enum to display strings
const statusDisplayMap: Record<string, string> = {
  'Pending': 'Pending',
  'InProgress': 'In Progress',
  'OnHold': 'On Hold',
  'Completed': 'Completed',
  'Cancelled': 'Cancelled',
};

// Map display strings back to Prisma enum
const statusToEnum: Record<string, JobStatus> = {
  'Pending': 'Pending',
  'In Progress': 'InProgress',
  'On Hold': 'OnHold',
  'Completed': 'Completed',
  'Cancelled': 'Cancelled',
};

function formatJobStatus(status: JobStatus): string {
  return statusDisplayMap[status] || status;
}

export function parseJobStatus(status: string): JobStatus {
  return statusToEnum[status] || (status as JobStatus);
}

async function computeProducedQuantity(jobId: string, tx?: TxClient): Promise<number> {
  const client = tx || prisma;
  const result = await client.productionRun.aggregate({
    where: { jobId },
    _sum: { quantityProduced: true },
  });
  return result._sum.quantityProduced || 0;
}

async function toJobResponse(
  job: any,
  includeRuns = false,
  tx?: TxClient
): Promise<JobResponse> {
  const producedQuantity = await computeProducedQuantity(job.id, tx);

  const response: JobResponse = {
    id: job.id,
    description: job.description,
    targetQuantity: job.targetQuantity,
    producedQuantity,
    status: formatJobStatus(job.status),
    version: job.version,
    targetCompletionDate: job.targetCompletionDate instanceof Date
      ? job.targetCompletionDate.toISOString().split('T')[0]
      : job.targetCompletionDate,
    orderId: job.orderId || null,
    customerName: job.order?.customer?.name || null,
    finishedGoodId: job.finishedGoodId || null,
    finishedGoodName: job.finishedGood?.name || null,
    createdBy: job.createdBy,
    createdByName: job.creator?.name || '',
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };

  if (includeRuns && job.productionRuns) {
    response.productionRuns = job.productionRuns.map((run: any) => ({
      id: run.id,
      jobId: run.jobId,
      loggedBy: run.loggedBy,
      loggedByName: run.logger?.name || '',
      quantityProduced: run.quantityProduced,
      runDate: run.runDate.toISOString(),
      materialsConsumed: (run.materials || []).map((mat: any) => ({
        id: mat.id,
        productionRunId: mat.productionRunId,
        itemId: mat.itemId,
        itemName: mat.item?.name || '',
        unitOfMeasure: mat.item?.unitOfMeasure || '',
        quantityConsumed: Number(mat.quantityConsumed),
      })),
    }));
  }

  return response;
}

const jobIncludeBase = {
  creator: { select: { name: true } },
  order: { include: { customer: { select: { name: true } } } },
  finishedGood: { select: { name: true } },
};

const jobIncludeDetail = {
  ...jobIncludeBase,
  productionRuns: {
    include: {
      logger: { select: { name: true } },
      materials: {
        include: {
          item: { select: { name: true, unitOfMeasure: true } },
        },
      },
    },
    orderBy: { runDate: 'desc' as const },
  },
};

export async function findAllJobs(params: {
  status?: string;
  orderId?: string;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
}): Promise<{ items: JobResponse[]; total: number }> {
  const where: Prisma.JobWhereInput = {};

  if (params.status) {
    where.status = parseJobStatus(params.status);
  }
  if (params.orderId) {
    where.orderId = params.orderId;
  }
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) where.createdAt.lte = new Date(params.to);
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: jobIncludeBase,
      orderBy: { createdAt: 'desc' },
      take: params.limit,
      skip: params.offset,
    }),
    prisma.job.count({ where }),
  ]);

  const items = await Promise.all(jobs.map((job) => toJobResponse(job)));
  return { items, total };
}

export async function findJobById(id: string): Promise<JobResponse | null> {
  const job = await prisma.job.findUnique({
    where: { id },
    include: jobIncludeDetail,
  });

  if (!job) return null;
  return toJobResponse(job, true);
}

export async function createJob(data: {
  description: string;
  targetQuantity: number;
  orderId?: string | null;
  finishedGoodId?: string | null;
  targetCompletionDate: string;
  createdBy: string;
}): Promise<JobResponse> {
  const job = await prisma.job.create({
    data: {
      description: data.description,
      targetQuantity: data.targetQuantity,
      status: 'Pending',
      orderId: data.orderId || null,
      finishedGoodId: data.finishedGoodId || null,
      targetCompletionDate: new Date(data.targetCompletionDate),
      createdBy: data.createdBy,
    },
    include: jobIncludeBase,
  });

  return toJobResponse(job);
}

/**
 * Update job with optimistic locking (NFR-4.1).
 * Returns null if version conflict (0 rows affected).
 */
export async function updateJob(
  id: string,
  data: { status?: string; description?: string; targetCompletionDate?: string },
  expectedVersion: number
): Promise<JobResponse | null> {
  const updateData: Prisma.JobUpdateInput = {
    version: { increment: 1 },
  };

  if (data.status) {
    updateData.status = parseJobStatus(data.status);
  }
  if (data.description) {
    updateData.description = data.description;
  }
  if (data.targetCompletionDate) {
    updateData.targetCompletionDate = new Date(data.targetCompletionDate);
  }

  try {
    const job = await prisma.job.update({
      where: { id, version: expectedVersion },
      data: updateData,
      include: jobIncludeBase,
    });
    return toJobResponse(job);
  } catch (err: any) {
    // Prisma P2025: record not found (version mismatch = conflict)
    if (err.code === 'P2025') {
      return null;
    }
    throw err;
  }
}

/**
 * Create a production run and its materials inside a transaction.
 * Returns the run data; the service layer handles inventory movements.
 */
export async function createProductionRun(
  tx: TxClient,
  data: {
    jobId: string;
    loggedBy: string;
    quantityProduced: number;
    materialsConsumed: Array<{ itemId: string; quantity: number }>;
  }
): Promise<ProductionRunResponse> {
  // Create the production run
  const run = await tx.productionRun.create({
    data: {
      jobId: data.jobId,
      loggedBy: data.loggedBy,
      quantityProduced: data.quantityProduced,
    },
    include: {
      logger: { select: { name: true } },
    },
  });

  // Bulk create materials
  const materials = [];
  for (const mat of data.materialsConsumed) {
    const created = await tx.productionRunMaterial.create({
      data: {
        productionRunId: run.id,
        itemId: mat.itemId,
        quantityConsumed: mat.quantity,
      },
      include: {
        item: { select: { name: true, unitOfMeasure: true } },
      },
    });
    materials.push(created);
  }

  return {
    id: run.id,
    jobId: run.jobId,
    loggedBy: run.loggedBy,
    loggedByName: run.logger.name,
    quantityProduced: run.quantityProduced,
    runDate: run.runDate.toISOString(),
    materialsConsumed: materials.map((mat) => ({
      id: mat.id,
      productionRunId: mat.productionRunId,
      itemId: mat.itemId,
      itemName: mat.item.name,
      unitOfMeasure: mat.item.unitOfMeasure,
      quantityConsumed: Number(mat.quantityConsumed),
    })),
  };
}

export async function getJobRaw(id: string, tx?: TxClient) {
  const client = tx || prisma;
  return client.job.findUnique({
    where: { id },
    include: { finishedGood: { select: { id: true, name: true } } },
  });
}
