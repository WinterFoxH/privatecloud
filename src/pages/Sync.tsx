import { Pause, Play, RefreshCw, Smartphone } from 'lucide-react';
import { mockSyncJobs } from '../data/mockData';

const statusLabel = {
  running: 'Synchronizacja',
  idle: 'Gotowy',
  paused: 'Wstrzymany',
  error: 'Błąd',
};

export function Sync() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Synchronizacja w tle</h2>
          <p className="subtitle">UC-SYNC — automatyczny transfer w sieci Wi-Fi</p>
        </div>
        <button type="button" className="btn-primary">
          <RefreshCw size={16} />
          Synchronizuj teraz
        </button>
      </div>

      <div className="sync-grid">
        {mockSyncJobs.map((job) => (
          <div key={job.id} className="card sync-card">
            <div className="sync-card-header">
              <Smartphone size={22} />
              <div>
                <strong>{job.device}</strong>
                <span className={`badge ${job.status === 'running' ? 'info' : job.status === 'error' ? 'danger' : 'neutral'}`}>
                  {statusLabel[job.status]}
                </span>
              </div>
            </div>

            <div className="progress-bar large">
              <div className="progress-fill" style={{ width: `${job.progress}%` }} />
            </div>
            <div className="sync-meta">
              <span>{job.progress}%</span>
              <span>{job.filesQueued} plików w kolejce</span>
              <span>Ostatnia sync: {job.lastSync}</span>
            </div>

            <div className="sync-actions">
              {job.status === 'paused' ? (
                <button type="button" className="btn-secondary">
                  <Play size={14} /> Wznów
                </button>
              ) : (
                <button type="button" className="btn-ghost">
                  <Pause size={14} /> Wstrzymaj
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card info-card">
        <h3>Polityka synchronizacji</h3>
        <ul>
          <li>Tylko w sieci Wi-Fi (F2)</li>
          <li>Nowe pliki z folderu „Zdjęcia” i „Dokumenty”</li>
          <li>WebSocket — powiadomienia o postępie w czasie rzeczywistym</li>
        </ul>
      </div>
    </div>
  );
}
