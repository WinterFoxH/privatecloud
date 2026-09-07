import { apiFetch } from './client';
import type { DiskVolume } from '../types';

export interface ApiDisk {
  id: string;
  label: string;
  interface: 'USB' | 'SATA';
  capacityGb: number;
  usedGb: number;
  status: 'active' | 'pending' | 'offline';
  mountPath?: string;
  addedAt?: string;
}

interface ListDisksResponse {
  disks: ApiDisk[];
  total: number;
}

interface DiskResponse {
  disk: ApiDisk;
}

export function mapApiDisk(d: ApiDisk): DiskVolume {
  return {
    id: d.id,
    label: d.label,
    interface: d.interface,
    capacityGb: d.capacityGb,
    usedGb: d.usedGb,
    status: d.status,
  };
}

export async function listDisks(): Promise<DiskVolume[]> {
  const data = await apiFetch<ListDisksResponse>('/api/admin/disks');
  return data.disks.map(mapApiDisk);
}

export async function createDisk(input: {
  label: string;
  interface: 'USB' | 'SATA';
  capacityGb: number;
}): Promise<DiskVolume> {
  const data = await apiFetch<DiskResponse>('/api/admin/disks', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return mapApiDisk(data.disk);
}

export async function updateDiskStatus(
  id: string,
  status: DiskVolume['status'],
): Promise<DiskVolume> {
  const data = await apiFetch<DiskResponse>(`/api/admin/disks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return mapApiDisk(data.disk);
}

export async function detachDisk(id: string): Promise<void> {
  await apiFetch(`/api/admin/disks/${id}`, { method: 'DELETE' });
}
