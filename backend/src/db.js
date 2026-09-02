/**
 * Moduł bazy danych SQLite.
 * better-sqlite3 działa synchronicznie — nie potrzebujesz async/await.
 */
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ścieżka do pliku .db z zmiennej środowiskowej lub domyślna
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/cloud.db');

// Upewnij się, że folder data/ istnieje
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// WAL = szybsze równoległe odczyty (opcjonalne, dobre na start)
db.pragma('journal_mode = WAL');

/**
 * Tworzy tabelę files, jeśli jeszcze nie istnieje.
 * Wywołaj raz przy starcie serwera.
 */
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      mime_type    TEXT NOT NULL DEFAULT 'application/octet-stream',
      size_bytes   INTEGER NOT NULL DEFAULT 0,
      storage_path TEXT NOT NULL,
      is_folder    INTEGER NOT NULL DEFAULT 0,
      in_trash     INTEGER NOT NULL DEFAULT 0,
      synced       INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_files_in_trash ON files(in_trash);
  `);
  console.log('[db] Schemat SQLite gotowy:', dbPath);
}

module.exports = { db, initDb };
