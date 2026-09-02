import type { CloudFile, DiskVolume, ShareLink, SyncJob, SystemMetrics } from '../types';

export const mockFiles: CloudFile[] = [
  { id: '1', name: 'Dokumenty', type: 'folder', size: '—', modified: '2026-06-08', synced: true },
  { id: '2', name: 'Zdjęcia', type: 'folder', size: '—', modified: '2026-06-09', synced: true },
  { id: '3', name: 'wakacje_2025.jpg', type: 'image', size: '4.2 MB', modified: '2026-06-07', synced: true },
  { id: '4', name: 'prezentacja_dyplom.pdf', type: 'document', size: '1.8 MB', modified: '2026-06-10', synced: false },
  { id: '5', name: 'nagranie_konferencji.mp4', type: 'video', size: '820 MB', modified: '2026-06-05', synced: true },
  { id: '6', name: 'backup_telefon.zip', type: 'archive', size: '12.4 GB', modified: '2026-06-01', synced: true },
  { id: '7', name: 'stare_zdjecie.png', type: 'image', size: '2.1 MB', modified: '2026-05-20', synced: true, inTrash: true },
];

export const mockMedia = mockFiles.filter((f) => f.type === 'image' || f.type === 'video');

export const mockShares: ShareLink[] = [
  {
    id: 's1',
    fileName: 'prezentacja_dyplom.pdf',
    url: 'https://cloud.local/s/a8f3c2',
    password: 'dyplom2026',
    expiresAt: '2026-07-01',
    downloads: 3,
  },
  {
    id: 's2',
    fileName: 'wakacje_2025.jpg',
    url: 'https://cloud.local/s/b7e1d9',
    expiresAt: '2026-06-20',
    downloads: 12,
  },
];

export const mockDisks: DiskVolume[] = [
  { id: 'd1', label: 'SSD Systemowy', interface: 'SATA', capacityGb: 500, usedGb: 312, status: 'active' },
  { id: 'd2', label: 'HDD Archiwum', interface: 'SATA', capacityGb: 2000, usedGb: 1450, status: 'active' },
  { id: 'd3', label: 'USB Backup', interface: 'USB', capacityGb: 1000, usedGb: 0, status: 'pending' },
];

export const mockSyncJobs: SyncJob[] = [
  { id: 'j1', device: 'Telefon Android', status: 'running', progress: 67, filesQueued: 14, lastSync: '2 min temu' },
  { id: 'j2', device: 'Laptop domowy', status: 'idle', progress: 100, filesQueued: 0, lastSync: '15 min temu' },
  { id: 'j3', device: 'Tablet', status: 'paused', progress: 23, filesQueued: 48, lastSync: 'wczoraj' },
];

export const mockMetrics: SystemMetrics = {
  cpuPercent: 34,
  ramUsedGb: 5.2,
  ramTotalGb: 16,
  uptime: '12 dni 4 h',
  activeConnections: 3,
};
