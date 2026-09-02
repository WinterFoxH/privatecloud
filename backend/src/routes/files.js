/**
 * Trasy REST dla operacji na plikach — Faza 1 MVP.
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

const router = express.Router();

// --- Konfiguracja storage ---
const STORAGE_ROOT = path.resolve(
  process.env.STORAGE_ROOT || path.join(__dirname, '../../../storage/data/default')
);

if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

// --- Multer: zapis pliku tymczasowo w pamięci, potem przenosimy na dysk ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // max 100 MB na Fazę 1
});

/**
 * Sanityzacja nazwy pliku — usuwa path traversal i znaki niebezpieczne.
 */
function sanitizeFilename(name) {
  const base = path.basename(name);
  return base.replace(/[^\w.\-() ]+/g, '_') || 'unnamed';
}

/**
 * Heurystyka typu pliku dla frontendu (zgodna z CloudFile.type).
 */
function guessFileType(filename, mimeType) {
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
  if (['.mp4', '.webm', '.mkv', '.avi', '.mov'].includes(ext)) return 'video';
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return 'archive';
  if (mimeType && mimeType.startsWith('image/')) return 'image';
  if (mimeType && mimeType.startsWith('video/')) return 'video';
  return 'document';
}

/**
 * Mapuje wiersz z bazy na obiekt JSON dla API.
 */
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

// --- GET /api/files — lista plików ---
router.get('/', (req, res, next) => {
  try {
    const rows = db
      .prepare('SELECT * FROM files WHERE in_trash = 0 AND is_folder = 0 ORDER BY updated_at DESC')
      .all();
    const files = rows.map(rowToJson);
    res.json({ files, total: files.length });
  } catch (err) {
    next(err);
  }
});

// --- POST /api/files/upload — upload multipart ---
router.post('/upload', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Brak pliku w polu "file"' });
    }

    const id = uuidv4();
    const safeName = sanitizeFilename(req.file.originalname);
    const diskFilename = `${id}_${safeName}`;
    const storagePath = diskFilename; // względem STORAGE_ROOT
    const absolutePath = path.join(STORAGE_ROOT, storagePath);

    // Zapis binarny na dysk
    fs.writeFileSync(absolutePath, req.file.buffer);

    const now = new Date().toISOString();
    const mimeType = req.file.mimetype || 'application/octet-stream';

    db.prepare(`
      INSERT INTO files (id, name, mime_type, size_bytes, storage_path, is_folder, in_trash, synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, 0, 1, ?, ?)
    `).run(id, safeName, mimeType, req.file.size, storagePath, now, now);

    const row = db.prepare('SELECT * FROM files WHERE id = ?').get(id);
    res.status(201).json({ file: rowToJson(row) });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/files/:id/download — pobieranie pliku ---
router.get('/:id/download', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM files WHERE id = ? AND in_trash = 0').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Plik nie istnieje' });
    }

    const absolutePath = path.join(STORAGE_ROOT, row.storage_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Plik nie istnieje na dysku' });
    }

    res.download(absolutePath, row.name);
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/files/:id — usunięcie pliku ---
router.delete('/:id', (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM files WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ error: 'Plik nie istnieje' });
    }

    const absolutePath = path.join(STORAGE_ROOT, row.storage_path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    db.prepare('DELETE FROM files WHERE id = ?').run(req.params.id);

    res.json({ message: 'Plik usunięty', id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
