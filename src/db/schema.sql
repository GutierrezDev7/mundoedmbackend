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
