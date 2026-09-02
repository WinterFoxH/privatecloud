import { useState } from 'react';
import { HardDrive, Plus, Usb } from 'lucide-react';
import { mockDisks } from '../../data/mockData';
import type { DiskVolume } from '../../types';

export function DiskPool() {
  const [disks, setDisks] = useState(mockDisks);

  const addDisk = () => {
    const newDisk: DiskVolume = {
      id: crypto.randomUUID(),
      label: `USB Dysk ${disks.length + 1}`,
      interface: 'USB',
      capacityGb: 500,
      usedGb: 0,
      status: 'pending',
    };
    setDisks([...disks, newDisk]);

    setTimeout(() => {
      setDisks((current) =>
        current.map((d) => (d.id === newDisk.id ? { ...d, status: 'active' as const } : d)),
      );
    }, 2000);
  };

  const statusLabel = {
    active: 'Aktywny',
    pending: 'Wykrywanie…',
    offline: 'Offline',
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Rozszerzenie puli dyskowej</h2>
          <p className="subtitle">UC-POOL — wykrycie USB/SATA i dołączenie do logicznej przestrzeni (MergerFS)</p>
        </div>
        <button type="button" className="btn-primary" onClick={addDisk}>
          <Plus size={16} />
          Symuluj podłączenie dysku
        </button>
      </div>

      <div className="disk-grid">
        {disks.map((disk) => (
          <div key={disk.id} className={`card disk-card status-${disk.status}`}>
            <div className="disk-icon">
              {disk.interface === 'USB' ? <Usb size={28} /> : <HardDrive size={28} />}
            </div>
            <h3>{disk.label}</h3>
            <p className="mono">
              {disk.interface} · {disk.capacityGb} GB
            </p>
            <span className={`badge ${disk.status === 'active' ? 'success' : disk.status === 'pending' ? 'warning' : 'danger'}`}>
              {statusLabel[disk.status]}
            </span>
            {disk.status === 'active' && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.round((disk.usedGb / disk.capacityGb) * 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card info-card">
        <h3>Przepływ (udev + MergerFS)</h3>
        <ol>
          <li>System Linux wykrywa nowy nośnik (udev)</li>
          <li>Administrator potwierdza dołączenie do puli</li>
          <li>MergerFS scala wolumeny w jedną logiczną przestrzeń</li>
          <li>Istniejące dane pozostają nienaruszone (F1)</li>
        </ol>
      </div>
    </div>
  );
}
