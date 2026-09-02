import { apiFetch } from './client';
import type { CloudFile } from '../types';
import { formatFileSize, formatModifiedDate } from '../utils/format';

/** Kształt pojedynczego pliku z backendu (rowToJson). */
export interface ApiFile {
  id: string;
  name: string;
  type: 'folder' | 'image' | 'video' | 'document' | 'archive';
  sizeBytes: number;
  modifiedAt: string;
  synced: boolean;
  inTrash: boolean;
  path: string;
}

interface ListFilesResponse {
  files: ApiFile[];
  total: number;
}

interface UploadFileResponse {
  file: ApiFile;
}

interface DeleteFileResponse {
  message: string;
  id: string;
}

/** Mapuje JSON API → CloudFile używany w komponentach React. */
export function mapApiFileToCloudFile(row: ApiFile): CloudFile {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: formatFileSize(row.sizeBytes),
    modified: formatModifiedDate(row.modifiedAt),
    synced: row.synced,
    inTrash: row.inTrash,
  };
}

export async function listFiles(): Promise<CloudFile[]> {
  const data = await apiFetch<ListFilesResponse>('/api/files');
  return data.files.map(mapApiFileToCloudFile);
}

export async function uploadFile(file: File): Promise<CloudFile> {
  const formData = new FormData();
  // WAŻNE: nazwa pola musi być "file" — multer upload.single('file')
  formData.append('file', file);

  const data = await apiFetch<UploadFileResponse>('/api/files/upload', {
    method: 'POST',
    body: formData,
  });

  return mapApiFileToCloudFile(data.file);
}

export async function deleteFile(id: string): Promise<void> {
  await apiFetch<DeleteFileResponse>(`/api/files/${id}`, {
    method: 'DELETE',
  });
}
