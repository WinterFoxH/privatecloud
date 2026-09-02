import { useState } from 'react';
import { Copy, Link2, Plus } from 'lucide-react';
import { mockShares } from '../data/mockData';

export function Sharing() {
  const [shares, setShares] = useState(mockShares);
  const [copied, setCopied] = useState<string | null>(null);

  const copyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const createShare = () => {
    setShares([
      {
        id: crypto.randomUUID(),
        fileName: 'nowy_plik.pdf',
        url: `https://cloud.local/s/${Math.random().toString(36).slice(2, 8)}`,
        password: 'temp123',
        expiresAt: '2026-06-30',
        downloads: 0,
      },
      ...shares,
    ]);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Udostępnianie linkami</h2>
          <p className="subtitle">UC-SHR — linki publiczne z hasłem i TTL</p>
        </div>
        <button type="button" className="btn-primary" onClick={createShare}>
          <Plus size={16} />
          Nowy link
        </button>
      </div>

      <div className="card table-card">
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
                <td className="mono">{share.url}</td>
                <td>{share.password ?? '—'}</td>
                <td>{share.expiresAt}</td>
                <td>{share.downloads}</td>
                <td>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => copyLink(share.id, share.url)}
                    title="Kopiuj link"
                  >
                    <Copy size={16} />
                  </button>
                  {copied === share.id && <span className="copied-toast">Skopiowano!</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card info-card">
        <Link2 size={20} />
        <p>
          Tokeny UUID przechowywane w Redis/SQL z czasem życia (TTL). Link wygasa automatycznie po dacie
          wygaśnięcia.
        </p>
      </div>
    </div>
  );
}
