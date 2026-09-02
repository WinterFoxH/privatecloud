/**
 * Trasy REST dla operacji na plikach — Faza 3 (izolacja per user).
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db, findUserByEmail } = require('../db');

const router = express.Router();

const STORAGE_BASE = path.resolve(
  process.env.STORAGE_ROOT || path.join(__dirname, '../../../storage/data'),
);

function getUserStorageRoot(userId) {
  const dir = path.join(STORAGE_BASE, userId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function migrateLegacyStorage() {
  const legacyDir = path.join(STORAGE_BASE, 'default');
  if (!fs.existsSync(legacyDir)) return;

  const jan = findUserByEmail('jan@dom.local');
  if (!jan) return;

  const userDir = getUserStorageRoot(jan.id);
  let moved = 0;

  for (const file of fs.readdirSync(legacyDir)) {
    const src = path.join(legacyDir, file);
    if (!fs.statSync(src).isFile()) continue;

    const dest = path.join(userDir, file);
    if (!fs.existsSync(dest)) {
      fs.renameSync(src, dest);
      moved++;
    }
  }

  if (moved > 0) {
    console.log(`[files] Przeniesiono ${moved} plików z default/ do ${jan.id}/`);
  }
}

migrateLegacyStorage();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

function sanitizeFilename(name) {
  const base = path.basename(name);
  return base.replace(/[^\w.\-() ]+/g, '_') || 'unnamed';
}

function guessFileType(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.mkv', '.avi', '.mov'].includes(ext)) return 'video';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return 'archive';
  if (mimeType && mimeType.startsWith('image/')) return 'image';
  if (mimeType && mimeType.startsWith('video/')) return 'video';
  return 'document';
}

function rowToJson(row) {
  return {
    id: row.id,
    name: row.name,
    type: guessFileType(row.name, row.mime_type),
    sizeBytes: row.size_bytes,
    modifiedAt: row.updated_at,
    synced: row.synced === 1,
    inTrash: row.in_trash === 1,
    path: '/',
  };
}

router.get('/', (req, res, next) => {
  try {
    const rows = db
      .prepare(`
        SELECT * FROM files
        WHERE user_id = ? AND in_trash = 0 AND is_folder = 0
        ORDER BY updated_at DESC
      `)
      .all(req.user.id);
    const files = rows.map(rowToJson);
    res.json({ files, total: files.length });
  } catch (err) {
    next(err);
  }
});

router.post('/upload', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku w polu "file"' });
    }

    const userId = req.user.id;
    const storageRoot = getUserStorageRoot(userId);
    const id = uuidv4();
    const safeName = sanitizeFilename(req.file.originalname);
    const diskFilename = `${id}_${safeName}`;
    const storagePath = diskFilename;
    const absolutePath = path.join(storageRoot, storagePath);

    fs.writeFileSync(absolutePath, req.file.buffer);

    const now = new Date().toISOString();
    const mimeType = req.file.mimetype || 'application/octet-stream';

    db.prepare(`
      INSERT INTO files (id, user_id, name, mime_type, size_bytes, storage_path, is_folder, in_trash, synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?)
    `).run(id, userId, safeName, mimeType, req.file.size, storagePath, now, now);

    const row = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    res.status(201).json({ file: rowToJson(row) });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/download', (req, res, next) => {
  try {
    const row = db
      .prepare('SELECT * FROM files WHERE id = ? AND user_id = ? AND in_trash = 0')
      .get(req.params.id, req.user.id);
    if (!row) {
      return res.status(404).json({ error: 'Plik nie istnieje' });
    }

    const absolutePath = path.join(getUserStorageRoot(req.user.id), row.storage_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Plik nie istnieje na dysku' });
    }

    res.download(absolutePath, row.name);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const row = db
      .prepare('SELECT * FROM files WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);
    if (!row) {
      return res.status(404).json({ error: 'Plik nie istnieje' });
    }

    const absolutePath = path.join(getUserStorageRoot(req.user.id), row.storage_path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Plik usunięty', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
