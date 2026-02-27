CREATE TABLE IF NOT EXISTS selections (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) NOT NULL,
  video_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section, video_id)
);

CREATE INDEX IF NOT EXISTS idx_selections_section ON selections(section);
