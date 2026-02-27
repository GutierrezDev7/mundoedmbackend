import { Router } from "express";
import { getVideos, getShorts, getPlaylists } from "../services/youtube.js";
import { clearCache } from "../db/cache.js";

export const youtubeRouter = Router();

youtubeRouter.get("/videos", async (_req, res) => {
  try {
    const videos = await getVideos(200);
    res.json(videos);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

youtubeRouter.get("/shorts", async (_req, res) => {
  try {
    const shorts = await getShorts(200);
    res.json(shorts);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

youtubeRouter.get("/playlists", async (_req, res) => {
  try {
    const playlists = await getPlaylists(50);
    res.json(playlists);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});

youtubeRouter.delete("/cache", async (_req, res) => {
  try {
    const deleted = await clearCache();
    res.json({ success: true, deletedEntries: deleted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: message });
  }
});
