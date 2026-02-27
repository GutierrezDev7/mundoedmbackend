import { Router } from "express";
import {
  getSelectedIds,
  saveSelectedIds,
  getSocialLinks,
  addSocialLink,
  updateSocialLink,
  deleteSocialLink,
} from "../store/store.js";
import { getVideos, getShorts, getPlaylists } from "../services/youtube.js";

export const contentRouter = Router();

// ── Timeline (checkbox-selected regular videos) ──

contentRouter.get("/timeline", async (_req, res) => {
  try {
    const ids = await getSelectedIds("timeline");
    if (ids.length === 0) return res.json([]);
    const videos = await getVideos(200);
    const selected = videos.filter((v) => ids.includes(v.id));
    res.json(selected);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

contentRouter.post("/timeline", async (req, res) => {
  try {
    const { videoIds } = req.body as { videoIds: string[] };
    if (!Array.isArray(videoIds)) {
      return res.status(400).json({ error: "videoIds must be an array" });
    }
    await saveSelectedIds("timeline", videoIds);
    res.json({ success: true, count: videoIds.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// ── Legends (checkbox-selected regular videos) ──

contentRouter.get("/legends", async (_req, res) => {
  try {
    const ids = await getSelectedIds("legends");
    if (ids.length === 0) return res.json([]);
    const videos = await getVideos(200);
    const selected = videos.filter((v) => ids.includes(v.id));
    res.json(selected);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

contentRouter.post("/legends", async (req, res) => {
  try {
    const { videoIds } = req.body as { videoIds: string[] };
    if (!Array.isArray(videoIds)) {
      return res.status(400).json({ error: "videoIds must be an array" });
    }
    await saveSelectedIds("legends", videoIds);
    res.json({ success: true, count: videoIds.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// ── Memories (checkbox-selected shorts) ──

contentRouter.get("/memories", async (_req, res) => {
  try {
    const ids = await getSelectedIds("memories");
    if (ids.length === 0) return res.json([]);
    const shorts = await getShorts(200);
    const selected = shorts.filter((s) => ids.includes(s.id));
    res.json(selected);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

contentRouter.post("/memories", async (req, res) => {
  try {
    const { videoIds } = req.body as { videoIds: string[] };
    if (!Array.isArray(videoIds)) {
      return res.status(400).json({ error: "videoIds must be an array" });
    }
    await saveSelectedIds("memories", videoIds);
    res.json({ success: true, count: videoIds.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// ── Playlists (checkbox-selected playlists) ──

contentRouter.get("/playlists", async (_req, res) => {
  try {
    const ids = await getSelectedIds("playlists");
    if (ids.length === 0) return res.json([]);
    const playlists = await getPlaylists(50);
    const selected = playlists.filter((p) => ids.includes(p.id));
    res.json(selected);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

contentRouter.post("/playlists", async (req, res) => {
  try {
    const { videoIds } = req.body as { videoIds: string[] };
    if (!Array.isArray(videoIds)) {
      return res.status(400).json({ error: "videoIds must be an array" });
    }
    await saveSelectedIds("playlists", videoIds);
    res.json({ success: true, count: videoIds.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

// ── Social (CRUD with PostgreSQL) ──

contentRouter.get("/social", async (_req, res) => {
  try {
    const links = await getSocialLinks();
    res.json(links);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

contentRouter.post("/social", async (req, res) => {
  try {
    const { name, href, platform } = req.body;
    const created = await addSocialLink({ name, href, platform });
    res.status(201).json(created);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

contentRouter.put("/social/:id", async (req, res) => {
  try {
    const updated = await updateSocialLink(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

contentRouter.delete("/social/:id", async (req, res) => {
  try {
    const deleted = await deleteSocialLink(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
