import { pool } from "./pool.js";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS selections (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) NOT NULL,
  video_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section, video_id)
);

CREATE TABLE IF NOT EXISTS social_links (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  href TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'whatsapp')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yt_cache (
  cache_key VARCHAR(100) PRIMARY KEY,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_selections_section ON selections(section);
CREATE INDEX IF NOT EXISTS idx_yt_cache_expires ON yt_cache(expires_at);
`;

export async function initDatabase(): Promise<void> {
  await pool.query(SCHEMA);
  console.log("Database schema initialized");

  const { rows } = await pool.query("SELECT COUNT(*) FROM social_links");
  if (Number(rows[0].count) === 0) {
    await pool.query(`
      INSERT INTO social_links (id, name, href, platform, sort_order) VALUES
        ('soc-1', 'Instagram', 'https://www.instagram.com/mundoedmoficial/', 'instagram', 1),
        ('soc-2', 'TikTok', 'https://www.tiktok.com/@mundoedm', 'tiktok', 2),
        ('soc-3', 'YouTube', 'https://www.youtube.com/@mundoedmoficial', 'youtube', 3),
        ('soc-4', 'WhatsApp', 'https://wa.me/?text=Oi!%20Quero%20fazer%20parte%20do%20Mundo%20EDM.', 'whatsapp', 4)
      ON CONFLICT (id) DO NOTHING
    `);
    console.log("Default social links seeded");
  }

  const { rows: userRows } = await pool.query("SELECT COUNT(*) FROM admin_users");
  if (Number(userRows[0].count) === 0) {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("04021991", 10);
    await pool.query(
      "INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)",
      ["mundoedm", hash],
    );
    console.log("Admin user seeded (mundoedm)");
  }
}
