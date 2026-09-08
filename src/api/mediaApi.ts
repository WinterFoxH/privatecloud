import { apiFetch } from './client';
import { getAccessToken } from './tokenStorage';
import { API_BASE } from './client';
import { formatFileSize, formatModifiedDate } from '../utils/format';
import type { CloudFile } from '../types';

export interface ApiMedia {
  id: string;
  name: string;
  type: 'image' | 'video';
  mimeType: string;
  sizeBytes: number;
  modifiedAt: string;
}

interface ListMediaResponse {
  media: ApiMedia[];
  total: number;
}

export function mapApiMedia(m: ApiMedia): CloudFile {
  return {
    id: m.id,
    name: m.name,
    type: m.type,
    size: formatFileSize(m.sizeBytes),
    modified: formatModifiedDate(m.modifiedAt),
    synced: true,
  };
}

export async function listMedia(): Promise<CloudFile[]> {
  const data = await apiFetch<ListMediaResponse>('/api/media');
  return data.media.map(mapApiMedia);
}

/** URL do <video>/<img> — token w query (nagłówki nie działają w src). */
export function mediaStreamUrl(id: string): string {
  const base = API_BASE || '';
  const token = getAccessToken() || '';
  const url = new URL(`${base}/api/media/${id}/stream`, window.location.origin);
  if (token) url.searchParams.set('access_token', token);
  return url.toString();
}
