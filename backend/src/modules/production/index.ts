// Production module — public barrel export
export {
  listJobs,
  getJob,
  createJob,
  updateJob,
  logProductionRun,
  getJobStatus,
} from './service.js';

export type { JobResponse, ProductionRunResponse, MaterialConsumedResponse } from './types.js';
