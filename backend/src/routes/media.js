/**
 * Multimedia — Faza 6 / F3 (UC-MEDIA). Direct stream (bez FFmpeg na MVP).
 */
const express = require('express');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const STORAGE_BASE = path.resolve(
  process.env.STORAGE_ROOT || path.join(__dirname, '../../../storage/data'),
);

function guessFileType(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.mkv', '.avi', '.mov'].includes(ext)) return 'video';
  if (mimeType && mimeType.startsWith('image/')) return 'image';
  if (mimeType && mimeType.startsWith('video/')) return 'video';
  return 'document';
}

function rowToMedia(row) {
  const type = guessFileType(row.name, row.mime_type);
  return {
    id: row.id,
    name: row.name,
    type,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    modifiedAt: row.updated_at,
  };
}

function resolveUserFromReq(req) {
  if (req.user) return req.user;

  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const q = typeof req.query.access_token === 'string' ? req.query.access_token : null;
  const token = bearer || q;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return { id: payload.sub, email: payload.email, role: payload.role, name: payload.name };
  } catch {
    return null;
  }
}

// GET /api/media
router.get('/', (req, res, next) => {
  try {
    const rows = db
      .prepare(`
        SELECT * FROM files
        WHERE user_id = ? AND in_trash = 0 AND is_folder = 0
        ORDER BY updated_at DESC
      `)
      .all(req.user.id);

    const media = rows.map(rowToMedia).filter((m) => m.type === 'image' || m.type === 'video');
    res.json({ media, total: media.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/media/:id/stream — Bearer lub ?access_token= (dla <video src>)
router.get('/:id/stream', (req, res, next) => {
  try {
    const user = resolveUserFromReq(req);
    if (!user) {
      return res.status(401).json({ error: 'Brak tokena autoryzacji' });
    }

    const row = db
      .prepare('SELECT * FROM files WHERE id = ? AND user_id = ? AND in_trash = 0')
      .get(req.params.id, user.id);
    if (!row) {
      return res.status(404).json({ error: 'Plik nie istnieje' });
    }

    const type = guessFileType(row.name, row.mime_type);
    if (type !== 'image' && type !== 'video') {
      return res.status(400).json({ error: 'Plik nie jest multimedium' });
    }

    const absolutePath = path.join(STORAGE_BASE, user.id, row.storage_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Plik nie istnieje na dysku' });
    }

    const stat = fs.statSync(absolutePath);
    const mime = row.mime_type || 'application/octet-stream';
    const range = req.headers.range;

    if (range && type === 'video') {
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

    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
    });
    fs.createReadStream(absolutePath).pipe(res);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
