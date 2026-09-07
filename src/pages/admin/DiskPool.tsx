import { useCallback, useEffect, useState } from 'react';
import { HardDrive, Plus, Usb } from 'lucide-react';
import { createDisk, listDisks, updateDiskStatus } from '../../api/disksApi';
import { ApiError } from '../../api/client';
import type { DiskVolume } from '../../types';

export function DiskPool() {
  const [disks, setDisks] = useState<DiskVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    const list = await listDisks();
    setDisks(list);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        await reload();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Nie udało się pobrać dysków');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const addDisk = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await createDisk({
        label: `USB Dysk ${disks.length + 1}`,
        interface: 'USB',
        capacityGb: 500,
      });
      setDisks((prev) => [...prev, created]);

      await new Promise((r) => setTimeout(r, 1500));
      const activated = await updateDiskStatus(created.id, 'active');
      setDisks((prev) => prev.map((d) => (d.id === activated.id ? activated : d)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Błąd dodawania dysku');
    } finally {
      setBusy(false);
    }
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
          <p className="subtitle">
            UC-POOL — wykrycie USB/SATA i dołączenie do logicznej przestrzeni (MergerFS)
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void addDisk()}
          disabled={busy || loading}
        >
          <Plus size={16} />
          {busy ? 'Dodawanie…' : 'Symuluj podłączenie dysku'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--danger, #c0392b)' }}>{error}</p>}
      {loading && <p>Ładowanie dysków…</p>}

      {!loading && (
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
              <span
                className={`badge ${
                  disk.status === 'active'
                    ? 'success'
                    : disk.status === 'pending'
                      ? 'warning'
                      : 'danger'
                }`}
              >
                {statusLabel[disk.status]}
              </span>
              {disk.status === 'active' && disk.capacityGb > 0 && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, Math.round((disk.usedGb / disk.capacityGb) * 100))}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card info-card">
        <h3>Przepływ (udev + MergerFS)</h3>
        <ol>
          <li>System Linux wykrywa nowy nośnik (udev)</li>
          <li>Administrator potwierdza dołączenie do puli</li>
          <li>MergerFS scala wolumeny w jedną logiczną przestrzeń</li>
          <li>Istniejące dane pozostają nienaruszone (F1)</li>
        </ol>
        <p className="subtitle" style={{ marginTop: '0.75rem' }}>
          Faza 5a: dyski są symulowane katalogami + API. Prawdziwy MergerFS = Faza 5b.
        </p>
      </div>
    </div>
  );
}
