import { apiFetch, API_BASE } from './client';
import type { ShareLink } from '../types';

export interface ApiShare {
  id: string;
  fileName: string;
  url: string;
  password?: string;
  hasPassword?: boolean;
  expiresAt: string;
  downloads: number;
  token: string;
  fileId: string;
}

interface ListSharesResponse {
  shares: ApiShare[];
  total: number;
}

interface ShareResponse {
  share: ApiShare;
}

export function mapApiShare(s: ApiShare): ShareLink {
  return {
    id: s.id,
    fileName: s.fileName,
    url: s.url,
    password: s.hasPassword ? '••••' : undefined,
    expiresAt: s.expiresAt,
    downloads: s.downloads,
  };
}

export async function listShares(): Promise<ShareLink[]> {
  const data = await apiFetch<ListSharesResponse>('/api/shares');
  return data.shares.map(mapApiShare);
}

export async function createShare(input: {
  fileId: string;
  password?: string;
  expiresInDays?: number;
}): Promise<ShareLink> {
  const data = await apiFetch<ShareResponse>('/api/shares', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return mapApiShare(data.share);
}

export async function deleteShare(id: string): Promise<void> {
  await apiFetch(`/api/shares/${id}`, { method: 'DELETE' });
}

export async function fetchPublicShareMeta(token: string): Promise<{
  fileName: string;
  expiresAt: string;
  hasPassword: boolean;
  downloads: number;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'video' | 'pdf' | 'document';
}> {
  const base = API_BASE || '';
  const res = await fetch(`${base}/api/s/${token}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || 'Link niedostępny');
  }
  return body as {
    fileName: string;
    expiresAt: string;
    hasPassword: boolean;
    downloads: number;
    mimeType: string;
    sizeBytes: number;
    kind: 'image' | 'video' | 'pdf' | 'document';
  };
}

export function publicDownloadUrl(token: string, password?: string): string {
  const base = API_BASE || window.location.origin;
  const url = new URL(`${base}/api/s/${token}/download`);
  if (password) url.searchParams.set('password', password);
  return url.toString();
}

export function publicPreviewUrl(token: string, password?: string): string {
  const base = API_BASE || window.location.origin;
  const url = new URL(`${base}/api/s/${token}/preview`);
  if (password) url.searchParams.set('password', password);
  return url.toString();
}
