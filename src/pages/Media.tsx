import { Play } from 'lucide-react';
import { mockMedia } from '../data/mockData';

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
];

export function Media() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Przeglądarka multimediów</h2>
          <p className="subtitle">UC-MEDIA — miniatury i streaming bez pełnego pobierania</p>
        </div>
      </div>

      <div className="media-grid">
        {mockMedia.map((item, i) => (
          <article key={item.id} className="media-card">
            <div
              className="media-thumb"
              style={{ background: gradients[i % gradients.length] }}
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
              <span className="badge success">Stream ready</span>
            </div>
          </article>
        ))}
      </div>

      <div className="card player-mock">
        <h3>Podgląd wideo (mock HTML5)</h3>
        <div className="video-placeholder">
          <Play size={48} />
          <p>nagranie_konferencji.mp4 — 820 MB</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '35%' }} />
          </div>
          <span className="time">12:04 / 34:20</span>
        </div>
      </div>
    </div>
  );
}
