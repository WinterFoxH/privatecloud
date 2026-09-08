/**
 * Udostępnianie linkami — Faza 6 / F6 (UC-SHR).
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { db } = require('../db');

const router = express.Router();

const STORAGE_BASE = path.resolve(
  process.env.STORAGE_ROOT || path.join(__dirname, '../../../storage/data'),
);

const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:5173';

function shareToJson(row, fileName) {
  return {
    id: row.id,
    fileName: fileName || row.file_name || 'plik',
    url: `${PUBLIC_BASE.replace(/\/$/, '')}/s/${row.token}`,
    password: row.password_hash ? '***' : undefined,
    hasPassword: Boolean(row.password_hash),
    expiresAt: row.expires_at.slice(0, 10),
    downloads: row.download_count,
    token: row.token,
    fileId: row.file_id,
  };
}

// GET /api/shares
router.get('/', (req, res, next) => {
  try {
    const rows = db
      .prepare(`
        SELECT s.*, f.name AS file_name
        FROM shares s
        JOIN files f ON f.id = s.file_id
        WHERE s.owner_id = ?
        ORDER BY s.created_at DESC
      `)
      .all(req.user.id);
    res.json({ shares: rows.map((r) => shareToJson(r, r.file_name)), total: rows.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/shares — { fileId, password?, expiresInDays? }
router.post('/', (req, res, next) => {
  try {
    const { fileId, password, expiresInDays } = req.body || {};
    if (!fileId) {
      return res.status(400).json({ error: 'Wymagane pole fileId' });
    }

    const file = db
      .prepare('SELECT * FROM files WHERE id = ? AND user_id = ? AND in_trash = 0')
      .get(fileId, req.user.id);
    if (!file) {
      return res.status(404).json({ error: 'Plik nie istnieje' });
    }

    const days = Number(expiresInDays) > 0 ? Number(expiresInDays) : 7;
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const id = crypto.randomUUID();
    const token = crypto.randomBytes(16).toString('hex');
    const passwordHash = password ? bcrypt.hashSync(String(password), 10) : null;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO shares (id, token, file_id, owner_id, password_hash, expires_at, download_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, token, fileId, req.user.id, passwordHash, expires, now);

    const row = db.prepare('SELECT * FROM shares WHERE id = ?').get(id);
    res.status(201).json({ share: shareToJson(row, file.name) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/shares/:id
router.delete('/:id', (req, res, next) => {
  try {
    const row = db
      .prepare('SELECT * FROM shares WHERE id = ? AND owner_id = ?')
      .get(req.params.id, req.user.id);
    if (!row) {
      return res.status(404).json({ error: 'Link nie istnieje' });
    }
    db.prepare('DELETE FROM shares WHERE id = ?').run(row.id);
    res.json({ message: 'Link usunięty', id: row.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
