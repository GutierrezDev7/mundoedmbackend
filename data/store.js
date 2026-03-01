const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const FILES = {
  timeline: "timeline.json",
  legends: "legends.json",
  memories: "memories.json",
  playlists: "playlists.json",
  social: "social.json",
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getPath(key) {
  return path.join(DATA_DIR, FILES[key] || `${key}.json`);
}

function read(key) {
  ensureDataDir();
  const filePath = getPath(key);
  if (!fs.existsSync(filePath)) {
    const defaultData = key === "social" ? [] : [];
    write(key, defaultData);
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return key === "social" ? [] : [];
  }
}

function write(key, data) {
  ensureDataDir();
  const filePath = getPath(key);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = { read, write, ensureDataDir };
