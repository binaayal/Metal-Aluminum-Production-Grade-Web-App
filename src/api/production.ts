import { apiGet, apiPost, apiPatch } from './client';
import type { Job, ProductionRun } from '../types/domain';
import type { CreateJobInput, LogProductionRunInput, UpdateJobInput } from '../schemas/validation';

export async function getJobs(params?: { status?: string; search?: string }): Promise<{ items: Job[]; total: number }> {
  return apiGet<{ items: Job[]; total: number }>('/api/production/jobs', {
    status: params?.status,
    // The backend doesn't have a 'search' param — map it if needed or omit
  });
}

export async function getJob(id: string): Promise<Job> {
  return apiGet<Job>(`/api/production/jobs/${id}`);
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  return apiPost<Job>('/api/production/jobs', input);
}

export async function updateJob(id: string, input: UpdateJobInput): Promise<Job> {
  return apiPatch<Job>(`/api/production/jobs/${id}`, input);
}

export async function logProductionRun(jobId: string, input: LogProductionRunInput): Promise<ProductionRun> {
  return apiPost<ProductionRun>(`/api/production/jobs/${jobId}/runs`, input);
}
