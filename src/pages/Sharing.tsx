import { useCallback, useEffect, useState } from 'react';
import { Copy, FileText, KeyRound, Link2, Plus, Timer, Trash2 } from 'lucide-react';
import { createShare, deleteShare, listShares } from '../api/sharesApi';
import { listFiles } from '../api/filesApi';
import { ApiError } from '../api/client';
import type { CloudFile, ShareLink } from '../types';

export function Sharing() {
  const [shares, setShares] = useState<ShareLink[]>([]);
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [fileId, setFileId] = useState('');
  const [password, setPassword] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const [shareList, fileList] = await Promise.all([listShares(), listFiles()]);
    setShares(shareList);
    setFiles(fileList);
    setFileId((current) => current || fileList[0]?.id || '');
  }, []);

  useEffect(() => {
    void reload().catch((e) => {
      setError(e instanceof ApiError ? e.message : 'Błąd ładowania');
    });
  }, [reload]);

  const copyLink = (id: string, url: string) => {
    void navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const onCreate = async () => {
    if (!fileId) {
      setError('Wybierz plik');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createShare({
        fileId,
        password: password.trim() || undefined,
        expiresInDays,
      });
      setPassword('');
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Nie udało się utworzyć linku');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    setBusy(true);
    try {
      await deleteShare(id);
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Nie udało się usunąć linku');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Udostępnianie linkami</h2>
          <p className="subtitle">UC-SHR — linki publiczne z hasłem i TTL</p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void onCreate()}
          disabled={busy || !fileId}
        >
          <Plus size={16} />
          {busy ? 'Tworzenie…' : 'Utwórz link'}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="card share-form-card">
        <h3>Nowy link</h3>
        <div className="share-form">
          <label className="share-field">
            <span>Plik</span>
            <div className="input-wrap">
              <FileText size={16} />
              <select value={fileId} onChange={(e) => setFileId(e.target.value)}>
                {files.length === 0 && <option value="">Brak plików — wgraj coś w Pliki</option>}
                {files.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="share-field">
            <span>Hasło (opcjonalne)</span>
            <div className="input-wrap">
              <KeyRound size={16} />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="puste = bez hasła"
              />
            </div>
          </label>

          <label className="share-field share-field-ttl">
            <span>TTL (dni)</span>
            <div className="input-wrap">
              <Timer size={16} />
              <input
                type="number"
                min={1}
                max={365}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value) || 7)}
              />
            </div>
          </label>
        </div>
      </div>

      <div className="card table-card">
        {shares.length === 0 ? (
          <p className="empty-hint">Brak linków — wybierz plik powyżej i utwórz pierwszy.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Plik</th>
                <th>Link</th>
                <th>Hasło</th>
                <th>Wygasa</th>
                <th>Pobrania</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shares.map((share) => (
                <tr key={share.id}>
                  <td>{share.fileName}</td>
                  <td className="mono share-url-cell">{share.url}</td>
                  <td>{share.password ?? '—'}</td>
                  <td>{share.expiresAt}</td>
                  <td>{share.downloads}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => copyLink(share.id, share.url)}
                        title="Kopiuj link"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => void onDelete(share.id)}
                        title="Usuń"
                      >
                        <Trash2 size={16} />
                      </button>
                      {copied === share.id && <span className="copied-toast">Skopiowano!</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card info-card">
        <Link2 size={20} />
        <p>
          Tokeny w SQLite z datą wygaśnięcia. Publiczna strona: <code>/s/:token</code>, pobieranie przez
          API <code>/api/s/:token/download</code>.
        </p>
      </div>
    </div>
  );
}
