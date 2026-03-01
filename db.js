const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "mundoedm.db");

let db;

function getDb() {
  if (db) return db;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS content_store (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS youtube_cache (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const row = db.prepare("SELECT COUNT(*) as n FROM admin_users").get();
  if (row.n === 0) {
    const hash = bcrypt.hashSync("04021991", 10);
    db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run("mundoedm", hash);
  }

  return db;
}

function readContent(key) {
  const row = getDb().prepare("SELECT data FROM content_store WHERE key = ?").get(key);
  if (!row) return key === "social" ? [] : [];
  try {
    return JSON.parse(row.data);
  } catch {
    return key === "social" ? [] : [];
  }
}

function writeContent(key, data) {
  getDb().prepare("INSERT INTO content_store (key, data) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data").run(key, JSON.stringify(data));
}

function getAdminByUsername(username) {
  return getDb().prepare("SELECT id, username, password_hash FROM admin_users WHERE username = ?").get(username);
}

function verifyPassword(passwordHash, password) {
  return bcrypt.compareSync(password, passwordHash);
}

const YOUTUBE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function getYoutubeCache(key) {
  const row = getDb().prepare("SELECT data, updated_at FROM youtube_cache WHERE key = ?").get(key);
  if (!row) return null;
  const age = Date.now() - row.updated_at * 1000;
  if (age > YOUTUBE_CACHE_TTL_MS) return null;
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

function setYoutubeCache(key, data) {
  const updatedAt = Math.floor(Date.now() / 1000);
  getDb().prepare("INSERT INTO youtube_cache (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at").run(key, JSON.stringify(data), updatedAt);
}

module.exports = {
  getDb,
  readContent,
  writeContent,
  getAdminByUsername,
  verifyPassword,
  getYoutubeCache,
  setYoutubeCache,
};
