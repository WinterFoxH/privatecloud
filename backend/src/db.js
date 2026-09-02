/**
 * Moduł bazy danych SQLite — Faza 3 (+ users, user_id w files).
 */
const Database = require('better-sqlite3');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/cloud.db');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function columnExists(table, column) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  return cols.some((c) => c.name === column);
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name          TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'user',
      created_at    TEXT NOT NULL
    );

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

  if (!columnExists('files', 'user_id')) {
    db.exec('ALTER TABLE files ADD COLUMN user_id TEXT REFERENCES users(id)');
    console.log('[db] Dodano kolumnę files.user_id');
  }

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_files_user_trash ON files(user_id, in_trash);
  `);

  migrateLegacyFileOwnership();
  console.log('[db] Schemat SQLite gotowy:', dbPath);
}

function migrateLegacyFileOwnership() {
  const orphanCount = db.prepare('SELECT COUNT(*) AS c FROM files WHERE user_id IS NULL').get().c;
  if (orphanCount === 0) return;

  const jan = findUserByEmail('jan@dom.local');
  if (!jan) return;

  db.prepare('UPDATE files SET user_id = ? WHERE user_id IS NULL').run(jan.id);
  console.log(`[db] Przypisano ${orphanCount} starych plików do ${jan.email}`);
}

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    crypto.randomUUID(),
    'jan@dom.local',
    bcrypt.hashSync('demo1234', 10),
    'Jan Kowalski',
    'user',
    now,
  );

  insert.run(
    crypto.randomUUID(),
    'admin@cloud.local',
    bcrypt.hashSync('admin1234', 10),
    'Admin Serwera',
    'admin',
    now,
  );

  console.log('[db] Seed użytkowników demo: jan@dom.local / demo1234, admin@cloud.local / admin1234');
}

function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function getUserByEmail(email) {
  return findUserByEmail(email);
}

function findUserById(id) {
  return db.prepare(
    'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
  ).get(id);
}

function userToPublic(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
}

module.exports = {
  db,
  initDb,
  seedUsers,
  getUserByEmail,
  findUserByEmail,
  findUserById,
  userToPublic,
};
