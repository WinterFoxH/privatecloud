import { useCallback, useEffect, useState } from 'react';
import { Pause, Play, RefreshCw, Smartphone } from 'lucide-react';
import { createSyncJob, listSyncJobs, updateSyncJobStatus } from '../api/syncApi';
import { ApiError } from '../api/client';
import type { SyncJob } from '../types';

const statusLabel = {
  running: 'Synchronizacja',
  idle: 'Gotowy',
  paused: 'Wstrzymany',
  error: 'Błąd',
};

export function Sync() {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const list = await listSyncJobs();
    setJobs(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        await reload();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Błąd synchronizacji');
        }
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [reload]);

  const startSync = async () => {
    setBusy(true);
    try {
      await createSyncJob({ device: 'Symulator — ten komputer', filesQueued: 10 });
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Nie udało się uruchomić sync');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (job: SyncJob) => {
    try {
      if (job.status === 'running') {
        await updateSyncJobStatus(job.id, 'paused');
      } else {
        await updateSyncJobStatus(job.id, 'running');
      }
      await reload();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Błąd zmiany statusu');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Synchronizacja w tle</h2>
          <p className="subtitle">UC-SYNC — worker in-process (demo bez Redis)</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => void startSync()} disabled={busy}>
          <RefreshCw size={16} />
          Synchronizuj teraz
        </button>
      </div>

      {error && <p style={{ color: 'var(--danger, #c0392b)' }}>{error}</p>}

      <div className="sync-grid">
        {jobs.map((job) => (
          <div key={job.id} className="card sync-card">
            <div className="sync-card-header">
              <Smartphone size={22} />
              <div>
                <strong>{job.device}</strong>
                <span
                  className={`badge ${
                    job.status === 'running' ? 'info' : job.status === 'error' ? 'danger' : 'neutral'
                  }`}
                >
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
              {job.status === 'paused' || job.status === 'idle' ? (
                <button type="button" className="btn-secondary" onClick={() => void toggle(job)}>
                  <Play size={14} /> {job.status === 'idle' ? 'Uruchom ponownie' : 'Wznów'}
                </button>
              ) : (
                <button type="button" className="btn-ghost" onClick={() => void toggle(job)}>
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
          <li>Demo: worker w procesie Node co 2 s zwiększa postęp</li>
          <li>Redis/BullMQ — opcjonalne później (produkcja)</li>
          <li>Klient mobilny nie jest wymagany na dyplom — wystarczy ten symulator</li>
        </ul>
      </div>
    </div>
  );
}
