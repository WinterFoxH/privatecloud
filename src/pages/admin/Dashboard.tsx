import { useCallback, useEffect, useState } from 'react';
import { Activity, Cpu, MemoryStick, Users } from 'lucide-react';
import { fetchAdminMetrics } from '../../api/adminMetricsApi';
import { ApiError } from '../../api/client';
import type { DiskVolume, SystemMetrics } from '../../types';

export function Dashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [disks, setDisks] = useState<DiskVolume[]>([]);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const data = await fetchAdminMetrics();
    setMetrics(data.metrics);
    setDisks(data.disks);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        await reload();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Nie udało się pobrać metryk');
        }
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [reload]);

  const totalCapacity = disks.reduce((s, d) => s + d.capacityGb, 0) || 1;
  const totalUsed = disks.reduce((s, d) => s + d.usedGb, 0);
  const usagePercent = Math.round((totalUsed / totalCapacity) * 100);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Dashboard stanu systemu</h2>
          <p className="subtitle">UC-DASH — metryki hosta (polling co 3 s) + pula dysków</p>
        </div>
      </div>

      {error && <p style={{ color: 'var(--danger, #c0392b)' }}>{error}</p>}

      {metrics && (
        <div className="stats-grid">
          <div className="stat-card">
            <Cpu size={24} />
            <div>
              <span>CPU</span>
              <strong>{metrics.cpuPercent}%</strong>
            </div>
            <div className="mini-bar">
              <div style={{ width: `${metrics.cpuPercent}%` }} />
            </div>
          </div>

          <div className="stat-card">
            <MemoryStick size={24} />
            <div>
              <span>RAM</span>
              <strong>
                {metrics.ramUsedGb} / {metrics.ramTotalGb} GB
              </strong>
            </div>
            <div className="mini-bar">
              <div
                style={{
                  width: `${(metrics.ramUsedGb / Math.max(metrics.ramTotalGb, 0.1)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="stat-card">
            <Users size={24} />
            <div>
              <span>Aktywne połączenia</span>
              <strong>{metrics.activeConnections}</strong>
            </div>
          </div>

          <div className="stat-card">
            <Activity size={24} />
            <div>
              <span>Uptime</span>
              <strong>{metrics.uptime}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Pula logiczna — wykorzystanie</h3>
        <div className="pool-summary">
          <div className="progress-bar large">
            <div className="progress-fill" style={{ width: `${usagePercent}%` }} />
          </div>
          <p>
            {totalUsed} GB / {totalCapacity} GB ({usagePercent}%)
          </p>
        </div>

        <div className="disk-bars">
          {disks.length === 0 && <p className="subtitle">Brak aktywnych dysków w puli</p>}
          {disks.map((disk) => {
            const pct =
              disk.capacityGb > 0
                ? Math.min(100, Math.round((disk.usedGb / disk.capacityGb) * 100))
                : 0;
            return (
              <div key={disk.id} className="disk-bar-row">
                <span>{disk.label}</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="mono">
                  {disk.usedGb}/{disk.capacityGb} GB
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
