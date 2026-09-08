import { apiFetch } from './client';
import type { SyncJob } from '../types';

export interface ApiSyncJob {
  id: string;
  device: string;
  status: SyncJob['status'];
  progress: number;
  filesQueued: number;
  lastSync: string;
}

interface ListJobsResponse {
  jobs: ApiSyncJob[];
  total: number;
}

interface JobResponse {
  job: ApiSyncJob;
}

export function mapApiJob(j: ApiSyncJob): SyncJob {
  return {
    id: j.id,
    device: j.device,
    status: j.status,
    progress: j.progress,
    filesQueued: j.filesQueued,
    lastSync: j.lastSync,
  };
}

export async function listSyncJobs(): Promise<SyncJob[]> {
  const data = await apiFetch<ListJobsResponse>('/api/sync/jobs');
  return data.jobs.map(mapApiJob);
}

export async function createSyncJob(input?: {
  device?: string;
  filesQueued?: number;
}): Promise<SyncJob> {
  const data = await apiFetch<JobResponse>('/api/sync/jobs', {
    method: 'POST',
    body: JSON.stringify(input || {}),
  });
  return mapApiJob(data.job);
}

export async function updateSyncJobStatus(
  id: string,
  status: 'paused' | 'running' | 'idle',
): Promise<SyncJob> {
  const data = await apiFetch<JobResponse>(`/api/sync/jobs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return mapApiJob(data.job);
}
