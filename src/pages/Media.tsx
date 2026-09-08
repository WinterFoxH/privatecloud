import { useCallback, useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { listMedia, mediaStreamUrl } from '../api/mediaApi';
import { ApiError } from '../api/client';
import type { CloudFile } from '../types';

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
];

export function Media() {
  const [items, setItems] = useState<CloudFile[]>([]);
  const [selected, setSelected] = useState<CloudFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const media = await listMedia();
    setItems(media);
    setSelected((prev) => {
      if (prev && media.some((m) => m.id === prev.id)) return prev;
      return media.find((m) => m.type === 'video') || media[0] || null;
    });
  }, []);

  useEffect(() => {
    void reload()
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Błąd multimediów'))
      .finally(() => setLoading(false));
  }, [reload]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Przeglądarka multimediów</h2>
          <p className="subtitle">UC-MEDIA — obrazy i wideo z Twojego storage (stream Range)</p>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger, #c0392b)' }}>{error}</p>}
      {loading && <p>Ładowanie…</p>}

      {!loading && items.length === 0 && (
        <p className="subtitle">Brak obrazów/wideo — wgraj pliki na stronie Pliki.</p>
      )}

      <div className="media-grid">
        {items.map((item, i) => (
          <article
            key={item.id}
            className="media-card"
            role="button"
            tabIndex={0}
            onClick={() => setSelected(item)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setSelected(item);
            }}
          >
            <div
              className="media-thumb"
              style={
                item.type === 'image'
                  ? {
                      backgroundImage: `url(${mediaStreamUrl(item.id)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : { background: gradients[i % gradients.length] }
              }
            >
              {item.type === 'video' && (
                <span className="play-overlay">
                  <Play size={32} fill="white" />
                </span>
              )}
            </div>
            <div className="media-info">
              <strong>{item.name}</strong>
              <span>{item.size}</span>
              <span className="badge success">{item.type === 'video' ? 'Stream' : 'Obraz'}</span>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="card player-mock">
          <h3>{selected.name}</h3>
          {selected.type === 'video' ? (
            <video
              key={selected.id}
              controls
              style={{ width: '100%', maxHeight: 420, background: '#111' }}
              src={mediaStreamUrl(selected.id)}
            >
              Twoja przeglądarka nie obsługuje wideo HTML5.
            </video>
          ) : (
            <img
              src={mediaStreamUrl(selected.id)}
              alt={selected.name}
              style={{ maxWidth: '100%', maxHeight: 420, objectFit: 'contain' }}
            />
          )}
        </div>
      )}
    </div>
  );
}
