/**
 * Pula dyskowa — Faza 5a (symulacja, bez MergerFS).
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db } = require('../db');

const router = express.Router();

const DISKS_ROOT = path.resolve(
  process.env.DISKS_ROOT || path.join(__dirname, '../../../storage/disks'),
);

if (!fs.existsSync(DISKS_ROOT)) {
  fs.mkdirSync(DISKS_ROOT, { recursive: true });
}

function gbToBytes(gb) {
  return Math.round(Number(gb) * 1e9);
}

function bytesToGb(bytes) {
  return Math.round((Number(bytes) / 1e9) * 100) / 100;
}

function dirUsedBytes(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) total += dirUsedBytes(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

function absoluteMount(mountPath) {
  const resolved = path.resolve(DISKS_ROOT, mountPath);
  if (!resolved.startsWith(DISKS_ROOT)) {
    const err = new Error('Nieprawidłowa ścieżka montowania');
    err.status = 400;
    throw err;
  }
  return resolved;
}

function rowToJson(row) {
  const abs = absoluteMount(row.mount_path);
  let usedBytes = row.used_bytes;
  if (row.status === 'active') {
    usedBytes = dirUsedBytes(abs);
    db.prepare('UPDATE disks SET used_bytes = ? WHERE id = ?').run(usedBytes, row.id);
  }

  return {
    id: row.id,
    label: row.label,
    interface: row.interface,
    capacityGb: bytesToGb(row.capacity_bytes),
    usedGb: bytesToGb(usedBytes),
    status: row.status,
    mountPath: abs,
    addedAt: row.added_at,
  };
}

// GET /api/admin/disks
router.get('/', (req, res, next) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM disks WHERE status != 'offline' ORDER BY added_at ASC`)
      .all();
    res.json({ disks: rows.map(rowToJson), total: rows.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/disks
router.post('/', (req, res, next) => {
  try {
    const { label, interface: iface, capacityGb } = req.body || {};
    if (!label || typeof label !== 'string') {
      return res.status(400).json({ error: 'Wymagane pole label' });
    }
    if (!['USB', 'SATA'].includes(iface)) {
      return res.status(400).json({ error: 'interface musi być USB lub SATA' });
    }
    const cap = Number(capacityGb);
    if (!Number.isFinite(cap) || cap <= 0) {
      return res.status(400).json({ error: 'capacityGb musi być liczbą > 0' });
    }

    const id = crypto.randomUUID();
    const mountPath = `disk-${id}`;
    const abs = absoluteMount(mountPath);
    fs.mkdirSync(abs, { recursive: true });

    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO disks (id, label, interface, mount_path, capacity_bytes, used_bytes, status, added_at)
      VALUES (?, ?, ?, ?, ?, 0, 'pending', ?)
    `).run(id, label.trim(), iface, mountPath, gbToBytes(cap), now);

    const row = db.prepare('SELECT * FROM disks WHERE id = ?').get(id);
    res.status(201).json({ disk: rowToJson(row) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/disks/:id
router.patch('/:id', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM disks WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Dysk nie znaleziony' });

    const { status } = req.body || {};
    if (!['pending', 'active', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status' });
    }

    db.prepare('UPDATE disks SET status = ? WHERE id = ?').run(status, row.id);
    const updated = db.prepare('SELECT * FROM disks WHERE id = ?').get(row.id);
    res.json({ disk: rowToJson(updated) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/disks/:id — soft offline
router.delete('/:id', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM disks WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Dysk nie znaleziony' });

    db.prepare(`UPDATE disks SET status = 'offline' WHERE id = ?`).run(row.id);
    res.json({ message: 'Dysk odpięty (soft)', id: row.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;