import "dotenv/config";
import express from "express";
import cors from "cors";
import { youtubeRouter } from "./routes/youtube.js";
import { contentRouter } from "./routes/content.js";
import { authRouter } from "./routes/auth.js";
import { initDatabase } from "./db/init.js";
import { cleanExpiredCache } from "./db/cache.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const corsOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
  : ["http://localhost:3000", "http://127.0.0.1:3000"];
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.use("/api/youtube", youtubeRouter);
app.use("/api/content", contentRouter);
app.use("/api/auth", authRouter);

app.get("/", (_req, res) => {
  res.redirect(302, "/api/health");
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  await initDatabase();

  setInterval(async () => {
    const n = await cleanExpiredCache();
    if (n > 0) console.log(`[cache] cleaned ${n} expired entries`);
  }, 60 * 60 * 1000);

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
