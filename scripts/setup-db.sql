-- Execute este script como superusuário (postgres) para criar o banco
-- psql -U postgres -f scripts/setup-db.sql

CREATE DATABASE mundoedm;

\c mundoedm

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

CREATE INDEX IF NOT EXISTS idx_selections_section ON selections(section);

INSERT INTO social_links (id, name, href, platform, sort_order) VALUES
  ('soc-1', 'Instagram', 'https://www.instagram.com/mundoedm', 'instagram', 1),
  ('soc-2', 'TikTok', 'https://www.tiktok.com/@mundoedm', 'tiktok', 2),
  ('soc-3', 'YouTube', 'https://www.youtube.com/@mundoedmoficial', 'youtube', 3),
  ('soc-4', 'WhatsApp', 'https://wa.me/?text=Oi!%20Quero%20fazer%20parte%20do%20Mundo%20EDM.', 'whatsapp', 4)
ON CONFLICT (id) DO NOTHING;
