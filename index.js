require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const db = require("./db");
const youtube = require("./youtube");

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

app.use(cors());
app.use(express.json());

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token ausente" });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const admin = db.getAdminByUsername(username);
  if (!admin || !db.verifyPassword(admin.password_hash, password)) {
    return res.status(401).json({ error: "Usuário ou senha inválidos" });
  }
  const token = jwt.sign(
    { sub: admin.username },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
  return res.json({ token });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  res.json({ user: req.user.sub });
});

app.get("/api/content/timeline", (req, res) => {
  const data = db.readContent("timeline");
  res.json(Array.isArray(data) ? data : []);
});

app.post("/api/content/timeline", async (req, res) => {
  const { videoIds } = req.body || {};
  if (!Array.isArray(videoIds)) {
    return res.status(400).json({ error: "videoIds deve ser um array" });
  }
  const current = db.readContent("timeline");
  const byId = new Map(current.map((c) => [c.id, c]));
  const missing = videoIds.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    try {
      const details = await youtube.getVideoDetails(missing);
      details.forEach((d) => byId.set(d.id, d));
    } catch (_) {}
  }
  const ordered = videoIds.map((id) => byId.get(id)).filter(Boolean);
  db.writeContent("timeline", ordered);
  res.json(ordered);
});

app.get("/api/content/legends", (req, res) => {
  const data = db.readContent("legends");
  res.json(Array.isArray(data) ? data : []);
});

app.post("/api/content/legends", async (req, res) => {
  const { videoIds } = req.body || {};
  if (!Array.isArray(videoIds)) {
    return res.status(400).json({ error: "videoIds deve ser um array" });
  }
  const current = db.readContent("legends");
  const byId = new Map(current.map((c) => [c.id, c]));
  const missing = videoIds.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    try {
      const details = await youtube.getVideoDetails(missing);
      details.forEach((d) => byId.set(d.id, d));
    } catch (_) {}
  }
  const ordered = videoIds.map((id) => byId.get(id)).filter(Boolean);
  db.writeContent("legends", ordered);
  res.json(ordered);
});

app.get("/api/content/memories", (req, res) => {
  const data = db.readContent("memories");
  res.json(Array.isArray(data) ? data : []);
});

app.post("/api/content/memories", async (req, res) => {
  const { videoIds } = req.body || {};
  if (!Array.isArray(videoIds)) {
    return res.status(400).json({ error: "videoIds deve ser um array" });
  }
  const current = db.readContent("memories");
  const byId = new Map(current.map((c) => [c.id, c]));
  const missing = videoIds.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    try {
      const details = await youtube.getVideoDetails(missing);
      details.forEach((d) => byId.set(d.id, d));
    } catch (_) {}
  }
  const ordered = videoIds.map((id) => byId.get(id)).filter(Boolean);
  db.writeContent("memories", ordered);
  res.json(ordered);
});

app.get("/api/content/playlists", (req, res) => {
  const data = db.readContent("playlists");
  res.json(Array.isArray(data) ? data : []);
});

app.post("/api/content/playlists", async (req, res) => {
  const { videoIds } = req.body || {};
  if (!Array.isArray(videoIds)) {
    return res.status(400).json({ error: "videoIds (playlistIds) deve ser um array" });
  }
  const current = db.readContent("playlists");
  const byId = new Map(current.map((c) => [c.id, c]));
  const missing = videoIds.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    try {
      const details = await youtube.getPlaylistDetails(missing);
      details.forEach((d) => byId.set(d.id, d));
    } catch (_) {}
  }
  const ordered = videoIds.map((id) => byId.get(id)).filter(Boolean);
  db.writeContent("playlists", ordered);
  res.json(ordered);
});

app.get("/api/content/social", (req, res) => {
  const data = db.readContent("social");
  res.json(Array.isArray(data) ? data : []);
});

app.post("/api/content/social", (req, res) => {
  const body = req.body || {};
  const { name, href, platform } = body;
  if (!name || !href || !platform) {
    return res.status(400).json({ error: "name, href e platform são obrigatórios" });
  }
  const list = db.readContent("social");
  const id = "social-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  const item = { id, name, href, platform };
  list.push(item);
  db.writeContent("social", list);
  res.status(201).json(item);
});

app.put("/api/content/social/:id", (req, res) => {
  const { id } = req.params;
  const list = db.readContent("social");
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Não encontrado" });
  const { name, href, platform } = req.body || {};
  if (name !== undefined) list[idx].name = name;
  if (href !== undefined) list[idx].href = href;
  if (platform !== undefined) list[idx].platform = platform;
  db.writeContent("social", list);
  res.json(list[idx]);
});

app.delete("/api/content/social/:id", (req, res) => {
  const { id } = req.params;
  const list = db.readContent("social");
  const filtered = list.filter((s) => s.id !== id);
  if (filtered.length === list.length) return res.status(404).json({ error: "Não encontrado" });
  db.writeContent("social", filtered);
  res.status(204).end();
});

app.get("/api/youtube/videos", async (req, res) => {
  try {
    const cached = db.getYoutubeCache("youtube_videos");
    if (cached) return res.json(cached);
    const items = await youtube.getVideos();
    db.setYoutubeCache("youtube_videos", items);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/youtube/shorts", async (req, res) => {
  try {
    const cached = db.getYoutubeCache("youtube_shorts");
    if (cached) return res.json(cached);
    const items = await youtube.getShorts();
    db.setYoutubeCache("youtube_shorts", items);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/youtube/playlists", async (req, res) => {
  try {
    const cached = db.getYoutubeCache("youtube_playlists");
    if (cached) return res.json(cached);
    const items = await youtube.getPlaylists();
    db.setYoutubeCache("youtube_playlists", items);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

db.getDb();

app.listen(PORT, () => {
  console.log(`Backend Mundo EDM rodando em http://localhost:${PORT}`);
});
