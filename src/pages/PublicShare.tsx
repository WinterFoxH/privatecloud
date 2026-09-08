import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Eye, FileText, Lock } from 'lucide-react';
import {
  fetchPublicShareMeta,
  publicDownloadUrl,
  publicPreviewUrl,
} from '../api/sharesApi';
import { formatFileSize } from '../utils/format';

type ShareMeta = {
  fileName: string;
  expiresAt: string;
  hasPassword: boolean;
  downloads: number;
  mimeType: string;
  sizeBytes: number;
  kind: 'image' | 'video' | 'pdf' | 'document';
};

export function PublicShare() {
  const { token = '' } = useParams();
  const [meta, setMeta] = useState<ShareMeta | null>(null);
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void fetchPublicShareMeta(token)
      .then((data) => {
        setMeta(data);
        if (!data.hasPassword) setUnlocked(true);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  const previewSrc = useMemo(() => {
    if (!token || !unlocked || !meta) return null;
    if (!['image', 'video', 'pdf'].includes(meta.kind)) return null;
    return publicPreviewUrl(token, password || undefined);
  }, [token, unlocked, meta, password]);

  const unlockPreview = () => {
    setError(null);
    setPreviewError(null);
    if (!meta?.hasPassword) {
      setUnlocked(true);
      return;
    }
    if (!password.trim()) {
      setError('Podaj hasło, aby zobaczyć podgląd');
      return;
    }
    void fetch(publicPreviewUrl(token, password), {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    })
      .then(async (res) => {
        // 206 = video range OK; 415 = typ bez podglądu, ale hasło poprawne
        if (!res.ok && res.status !== 206 && res.status !== 415) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error || 'Nieprawidłowe hasło');
        }
        setUnlocked(true);
      })
      .catch((e: Error) => setError(e.message));
  };

  const onDownload = () => {
    if (!token) return;
    window.location.href = publicDownloadUrl(token, password || undefined);
  };

  return (
    <div className="login-page">
      <div className="login-card share-public-card">
        <div className="login-header">
          <Eye size={36} />
          <h1>Udostępniony plik</h1>
          <p>Podgląd przed pobraniem</p>
        </div>

        {error && <p className="form-error">{error}</p>}

        {meta && (
          <div className="login-form">
            <div className="share-meta-block">
              <strong>{meta.fileName}</strong>
              <p className="subtitle">
                {formatFileSize(meta.sizeBytes)} · wygasa {meta.expiresAt} · pobrania:{' '}
                {meta.downloads}
              </p>
            </div>

            {meta.hasPassword && !unlocked && (
              <>
                <label>
                  Hasło
                  <div className="input-wrap">
                    <Lock size={16} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Hasło do linku"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') unlockPreview();
                      }}
                    />
                  </div>
                </label>
                <button type="button" className="btn-primary full" onClick={unlockPreview}>
                  <Eye size={16} />
                  Pokaż podgląd
                </button>
              </>
            )}

            {unlocked && (
              <>
                <div className="share-preview">
                  {previewError && <p className="form-error">{previewError}</p>}

                  {meta.kind === 'image' && previewSrc && (
                    <img
                      src={previewSrc}
                      alt={meta.fileName}
                      className="share-preview-media"
                      onError={() => setPreviewError('Nie udało się wczytać podglądu')}
                    />
                  )}

                  {meta.kind === 'video' && previewSrc && (
                    <video
                      key={previewSrc}
                      controls
                      className="share-preview-media"
                      src={previewSrc}
                      onError={() => setPreviewError('Nie udało się odtworzyć wideo')}
                    >
                      Podgląd wideo niedostępny
                    </video>
                  )}

                  {meta.kind === 'pdf' && previewSrc && (
                    <iframe
                      title={meta.fileName}
                      src={previewSrc}
                      className="share-preview-frame"
                    />
                  )}

                  {meta.kind === 'document' && (
                    <div className="share-preview-fallback">
                      <FileText size={40} />
                      <p>Podgląd niedostępny dla tego typu pliku — możesz go pobrać.</p>
                    </div>
                  )}
                </div>

                {meta.hasPassword && (
                  <p className="subtitle">Hasło zostało zweryfikowane — możesz pobrać plik.</p>
                )}

                <button type="button" className="btn-primary full" onClick={onDownload}>
                  <Download size={16} />
                  Pobierz
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
