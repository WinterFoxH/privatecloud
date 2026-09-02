import { useCallback, useEffect, useRef, useState } from 'react';
import { Archive, FileText, Folder, Image, Trash2, Upload, Video } from 'lucide-react';
import { deleteFile, listFiles, uploadFile } from '../api/filesApi';
import { ApiError } from '../api/client';
import type { CloudFile } from '../types';

const iconMap = {
  folder: Folder,
  image: Image,
  video: Video,
  document: FileText,
  archive: Archive,
};

export function Files() {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listFiles();
      setFiles(data.filter((f) => !f.inTrash));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `${err.message} (HTTP ${err.status})`
          : err instanceof Error
            ? err.message
            : 'Nie udało się pobrać listy plików';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setUploading(true);
    setError(null);
    try {
      const created = await uploadFile(selected);
      setFiles((prev) => [created, ...prev]);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `${err.message} (HTTP ${err.status})`
          : 'Upload nie powiódł się';
      setError(message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeFile = async (id: string) => {
    setError(null);
    try {
      await deleteFile(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      const message =
        err instanceof ApiError
          ? `${err.message} (HTTP ${err.status})`
          : 'Usunięcie nie powiodło się';
      setError(message);
    }
  };

  const renderRow = (file: CloudFile) => {
    const Icon = iconMap[file.type];
    return (
      <tr key={file.id}>
        <td>
          <span className="file-name">
            <Icon size={18} />
            {file.name}
          </span>
        </td>
        <td>{file.size}</td>
        <td>{file.modified}</td>
        <td>
          <span className={`badge ${file.synced ? 'success' : 'warning'}`}>
            {file.synced ? 'Zsynchronizowany' : 'Oczekuje'}
          </span>
        </td>
        <td>
          <button
            type="button"
            className="icon-btn danger"
            onClick={() => void removeFile(file.id)}
            title="Usuń"
          >
            <Trash2 size={16} />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Zarządzanie plikami</h2>
          <p className="subtitle">UC-FILE — lista, upload i usuwanie (Faza 2 — live API)</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={handleUploadClick}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? 'Wysyłanie…' : 'Prześlij plik'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={(e) => void handleFileSelected(e)}
        />
      </div>

      {error && (
        <div className="card" style={{ marginBottom: '1rem', color: 'var(--danger, #c0392b)' }}>
          <p>{error}</p>
          <button type="button" className="btn-secondary" onClick={() => void loadFiles()}>
            Spróbuj ponownie
          </button>
        </div>
      )}

      <div className="card table-card">
        {loading ? (
          <p>Ładowanie plików…</p>
        ) : files.length === 0 ? (
          <p>Brak plików — użyj „Prześlij plik”, aby dodać pierwszy.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Rozmiar</th>
                <th>Modyfikacja</th>
                <th>Sync</th>
                <th></th>
              </tr>
            </thead>
            <tbody>{files.map(renderRow)}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
