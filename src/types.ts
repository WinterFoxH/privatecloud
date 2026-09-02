export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface CloudFile {
  id: string;
  name: string;
  type: 'folder' | 'image' | 'video' | 'document' | 'archive';
  size: string;
  modified: string;
  synced: boolean;
  inTrash?: boolean;
}

export interface ShareLink {
  id: string;
  fileName: string;
  url: string;
  password?: string;
  expiresAt: string;
  downloads: number;
}

export interface DiskVolume {
  id: string;
  label: string;
  interface: 'USB' | 'SATA';
  capacityGb: number;
  usedGb: number;
  status: 'active' | 'pending' | 'offline';
}

export interface SyncJob {
  id: string;
  device: string;
  status: 'running' | 'idle' | 'paused' | 'error';
  progress: number;
  filesQueued: number;
  lastSync: string;
}

export interface SystemMetrics {
  cpuPercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  uptime: string;
  activeConnections: number;
}
