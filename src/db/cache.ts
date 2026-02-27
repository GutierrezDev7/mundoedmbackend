import { pool } from "./pool.js";

const DEFAULT_TTL_HOURS = 6;

export async function getCached<T>(key: string): Promise<T | null> {
  const { rows } = await pool.query(
    "SELECT data FROM yt_cache WHERE cache_key = $1 AND expires_at > NOW()",
    [key],
  );
  if (rows.length === 0) return null;
  return rows[0].data as T;
}

export async function setCache<T>(key: string, data: T, ttlHours = DEFAULT_TTL_HOURS): Promise<void> {
  await pool.query(
    `INSERT INTO yt_cache (cache_key, data, fetched_at, expires_at)
     VALUES ($1, $2, NOW(), NOW() + INTERVAL '1 hour' * $3)
     ON CONFLICT (cache_key) DO UPDATE
       SET data = EXCLUDED.data,
           fetched_at = EXCLUDED.fetched_at,
           expires_at = EXCLUDED.expires_at`,
    [key, JSON.stringify(data), ttlHours],
  );
}

export async function clearCache(keyPattern?: string): Promise<number> {
  if (keyPattern) {
    const { rowCount } = await pool.query(
      "DELETE FROM yt_cache WHERE cache_key LIKE $1",
      [`%${keyPattern}%`],
    );
    return rowCount ?? 0;
  }
  const { rowCount } = await pool.query("DELETE FROM yt_cache");
  return rowCount ?? 0;
}

export async function cleanExpiredCache(): Promise<number> {
  const { rowCount } = await pool.query("DELETE FROM yt_cache WHERE expires_at <= NOW()");
  return rowCount ?? 0;
}
