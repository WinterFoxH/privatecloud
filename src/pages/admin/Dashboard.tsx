import { Activity, Cpu, MemoryStick, Users } from 'lucide-react';
import { mockDisks, mockMetrics } from '../../data/mockData';

export function Dashboard() {
  const totalCapacity = mockDisks.reduce((s, d) => s + d.capacityGb, 0);
  const totalUsed = mockDisks.reduce((s, d) => s + d.usedGb, 0);
  const usagePercent = Math.round((totalUsed / totalCapacity) * 100);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Dashboard stanu systemu</h2>
          <p className="subtitle">UC-DASH — zużycie zasobów i dysków (WebSocket)</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Cpu size={24} />
          <div>
            <span>CPU</span>
            <strong>{mockMetrics.cpuPercent}%</strong>
          </div>
          <div className="mini-bar">
            <div style={{ width: `${mockMetrics.cpuPercent}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <MemoryStick size={24} />
          <div>
            <span>RAM</span>
            <strong>
              {mockMetrics.ramUsedGb} / {mockMetrics.ramTotalGb} GB
            </strong>
          </div>
          <div className="mini-bar">
            <div style={{ width: `${(mockMetrics.ramUsedGb / mockMetrics.ramTotalGb) * 100}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <Users size={24} />
          <div>
            <span>Aktywne połączenia</span>
            <strong>{mockMetrics.activeConnections}</strong>
          </div>
        </div>

        <div className="stat-card">
          <Activity size={24} />
          <div>
            <span>Uptime</span>
            <strong>{mockMetrics.uptime}</strong>
          </div>
        </div>
      </div>

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
          {mockDisks.map((disk) => {
            const pct = Math.round((disk.usedGb / disk.capacityGb) * 100);
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
