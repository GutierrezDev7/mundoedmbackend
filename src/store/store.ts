import { pool } from "../db/pool.js";

// ── Selections (timeline, legends, memories, playlists) ──

export async function getSelectedIds(section: string): Promise<string[]> {
  const { rows } = await pool.query(
    "SELECT video_id FROM selections WHERE section = $1 ORDER BY created_at",
    [section],
  );
  return rows.map((r) => r.video_id);
}

export async function saveSelectedIds(section: string, videoIds: string[]): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM selections WHERE section = $1", [section]);
    if (videoIds.length > 0) {
      const values = videoIds.map((id, i) => `($1, $${i + 2})`).join(", ");
      await client.query(
        `INSERT INTO selections (section, video_id) VALUES ${values}`,
        [section, ...videoIds],
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
