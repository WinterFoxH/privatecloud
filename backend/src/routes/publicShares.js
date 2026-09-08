/**
 * Publiczny dostęp do udostępnionych plików — GET /s/:token (bez JWT).
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { db } = require('../db');

const router = express.Router();

const STORAGE_BASE = path.resolve(
  process.env.STORAGE_ROOT || path.join(__dirname, '../../../storage/data'),
);

function guessKind(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.mkv', '.avi', '.mov'].includes(ext)) return 'video';
  if (ext === '.pdf' || mimeType === 'application/pdf') return 'pdf';
  if (mimeType && mimeType.startsWith('image/')) return 'image';
  if (mimeType && mimeType.startsWith('video/')) return 'video';
  return 'document';
}

function findShare(token) {
  return db
    .prepare(`
      SELECT s.*, f.name AS file_name, f.storage_path, f.mime_type, f.size_bytes,
             f.user_id AS file_owner_id
      FROM shares s
      JOIN files f ON f.id = s.file_id
      WHERE s.token = ?
    `)
    .get(token);
}

function assertShareAccessible(row, password) {
  if (!row) {
    const err = new Error('Link nie istnieje');
    err.status = 404;
    throw err;
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    const err = new Error('Link wygasł');
    err.status = 410;
    throw err;
  }
  if (row.password_hash) {
    if (!password || !bcrypt.compareSync(String(password), row.password_hash)) {
      const err = new Error('Wymagane prawidłowe hasło');
      err.status = 401;
      throw err;
    }
  }
}

function absoluteFilePath(row) {
  return path.join(STORAGE_BASE, row.file_owner_id, row.storage_path);
}

// GET /s/:token — metadane
router.get('/:token', (req, res, next) => {
  try {
    const row = findShare(req.params.token);
    if (!row) {
      return res.status(404).json({ error: 'Link nie istnieje' });
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return res.status(410).json({ error: 'Link wygasł' });
    }

    res.json({
      fileName: row.file_name,
      expiresAt: row.expires_at.slice(0, 10),
      hasPassword: Boolean(row.password_hash),
      downloads: row.download_count,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      kind: guessKind(row.file_name, row.mime_type),
    });
  } catch (err) {
    next(err);
  }
});

// GET /s/:token/preview — podgląd inline (bez zwiększania licznika pobrań)
router.get('/:token/preview', (req, res, next) => {
  try {
    const row = findShare(req.params.token);
    const password = req.query.password || req.headers['x-share-password'];
    assertShareAccessible(row, password);

    const absolutePath = absoluteFilePath(row);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Plik nie istnieje na dysku' });
    }

    const kind = guessKind(row.file_name, row.mime_type);
    if (!['image', 'video', 'pdf'].includes(kind)) {
      return res.status(415).json({ error: 'Podgląd niedostępny dla tego typu pliku' });
    }

    const mime = row.mime_type || 'application/octet-stream';
    const stat = fs.statSync(absolutePath);
    const range = req.headers.range;

    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(row.file_name)}"`);
    res.setHeader('Cache-Control', 'private, max-age=60');

    if (range && kind === 'video') {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime,
      });
      fs.createReadStream(absolutePath, { start, end }).pipe(res);
      return;
    }

    res.setHeader('Content-Length', stat.size);
    res.setHeader('Accept-Ranges', 'bytes');
    fs.createReadStream(absolutePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

// GET /s/:token/download?password=
router.get('/:token/download', (req, res, next) => {
  try {
    const row = findShare(req.params.token);
    const password = req.query.password || req.headers['x-share-password'];
    assertShareAccessible(row, password);

    const absolutePath = absoluteFilePath(row);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Plik nie istnieje na dysku' });
    }

    db.prepare('UPDATE shares SET download_count = download_count + 1 WHERE id = ?').run(row.id);
    res.download(absolutePath, row.file_name);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
