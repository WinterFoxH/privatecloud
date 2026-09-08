import { apiFetch } from './client';
import type { DiskVolume, SystemMetrics } from '../types';

export interface MetricsResponse {
  metrics: SystemMetrics;
  pool: {
    totalCapacityGb: number;
    totalUsedGb: number;
    disks: Array<{
      id: string;
      label: string;
      capacityGb: number;
      usedGb: number;
      status: string;
    }>;
  };
}

export async function fetchAdminMetrics(): Promise<{
  metrics: SystemMetrics;
  disks: DiskVolume[];
}> {
  const data = await apiFetch<MetricsResponse>('/api/admin/metrics');
  return {
    metrics: data.metrics,
    disks: data.pool.disks.map((d) => ({
      id: d.id,
      label: d.label,
      interface: 'SATA' as const,
      capacityGb: d.capacityGb,
      usedGb: d.usedGb,
      status: (d.status as DiskVolume['status']) || 'active',
    })),
  };
}
