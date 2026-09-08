/**
 * Synchronizacja — Faza 6 / F2 (UC-SYNC).
 * Worker in-process (bez Redis) — wystarczy na demo dyplomowe.
 */
const express = require('express');
const crypto = require('crypto');
const { db } = require('../db');

const router = express.Router();

function rowToJson(row) {
  return {
    id: row.id,
    device: row.device,
    status: row.status,
    progress: row.progress,
    filesQueued: row.files_queued,
    lastSync: row.last_sync ? row.last_sync.slice(0, 16).replace('T', ' ') : '—',
  };
}

// GET /api/sync/jobs
router.get('/jobs', (req, res, next) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM sync_jobs WHERE user_id = ? ORDER BY created_at DESC`)
      .all(req.user.id);
    res.json({ jobs: rows.map(rowToJson), total: rows.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/sync/jobs — { device?, filesQueued? }
router.post('/jobs', (req, res, next) => {
  try {
    const device = (req.body && req.body.device) || `Urządzenie ${new Date().toLocaleTimeString('pl-PL')}`;
    const filesQueued = Number(req.body?.filesQueued) > 0 ? Number(req.body.filesQueued) : 8;
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO sync_jobs (id, user_id, device, status, progress, files_queued, last_sync, created_at, updated_at)
      VALUES (?, ?, ?, 'running', 0, ?, ?, ?, ?)
    `).run(id, req.user.id, String(device).slice(0, 80), filesQueued, now, now, now);

    const row = db.prepare('SELECT * FROM sync_jobs WHERE id = ?').get(id);
    res.status(201).json({ job: rowToJson(row) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/sync/jobs/:id — { status: 'paused' | 'running' }
router.patch('/jobs/:id', (req, res, next) => {
  try {
    const row = db
      .prepare('SELECT * FROM sync_jobs WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!row) {
      return res.status(404).json({ error: 'Zadanie nie istnieje' });
    }

    const { status } = req.body || {};
    if (!['paused', 'running', 'idle'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    const now = new Date().toISOString();
    let progress = row.progress;
    let filesQueued = row.files_queued;
    if (status === 'idle') {
      progress = 100;
      filesQueued = 0;
    }
    if (status === 'running' && (row.status === 'idle' || row.progress >= 100)) {
      progress = 0;
      filesQueued = Math.max(filesQueued, 5);
    }

    db.prepare(`
      UPDATE sync_jobs
      SET status = ?, progress = ?, files_queued = ?, last_sync = ?, updated_at = ?
      WHERE id = ?
    `).run(status, progress, filesQueued, now, now, row.id);

    const updated = db.prepare('SELECT * FROM sync_jobs WHERE id = ?').get(row.id);
    res.json({ job: rowToJson(updated) });
  } catch (err) {
    next(err);
  }
});

/**
 * Prosty worker: co 2s zwiększa progress zadań running.
 */
function startSyncWorker() {
  setInterval(() => {
    try {
      const running = db.prepare(`SELECT * FROM sync_jobs WHERE status = 'running'`).all();
      const now = new Date().toISOString();
      for (const job of running) {
        const next = Math.min(100, job.progress + 5 + Math.floor(Math.random() * 8));
        const filesLeft = next >= 100 ? 0 : Math.max(0, job.files_queued - 1);
        const status = next >= 100 ? 'idle' : 'running';
        db.prepare(`
          UPDATE sync_jobs
          SET progress = ?, files_queued = ?, status = ?, last_sync = ?, updated_at = ?
          WHERE id = ?
        `).run(next, filesLeft, status, now, now, job.id);
      }
    } catch (err) {
      console.error('[sync-worker]', err.message);
    }
  }, 2000);
  console.log('[sync-worker] In-process worker uruchomiony (bez Redis)');
}

module.exports = { router, startSyncWorker };
