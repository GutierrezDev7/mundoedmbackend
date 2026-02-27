import { pool } from "../db/pool.js";
import type { SocialLink } from "../types.js";

// ── Selections (timeline, legends, memories) ──

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

// ── Social Links ──

export async function getSocialLinks(): Promise<SocialLink[]> {
  const { rows } = await pool.query(
    "SELECT id, name, href, platform FROM social_links ORDER BY sort_order, created_at",
  );
  return rows as SocialLink[];
}

export async function addSocialLink(item: Omit<SocialLink, "id">): Promise<SocialLink> {
  const id = `soc-${Date.now()}`;
  const { rows } = await pool.query(
    "INSERT INTO social_links (id, name, href, platform) VALUES ($1, $2, $3, $4) RETURNING id, name, href, platform",
    [id, item.name, item.href, item.platform],
  );
  return rows[0] as SocialLink;
}

export async function updateSocialLink(id: string, patch: Partial<SocialLink>): Promise<SocialLink | null> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  if (patch.name !== undefined) { sets.push(`name = $${idx++}`); vals.push(patch.name); }
  if (patch.href !== undefined) { sets.push(`href = $${idx++}`); vals.push(patch.href); }
  if (patch.platform !== undefined) { sets.push(`platform = $${idx++}`); vals.push(patch.platform); }

  if (sets.length === 0) return null;

  vals.push(id);
  const { rows } = await pool.query(
    `UPDATE social_links SET ${sets.join(", ")} WHERE id = $${idx} RETURNING id, name, href, platform`,
    vals,
  );
  return rows.length > 0 ? (rows[0] as SocialLink) : null;
}

export async function deleteSocialLink(id: string): Promise<boolean> {
  const { rowCount } = await pool.query("DELETE FROM social_links WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}
