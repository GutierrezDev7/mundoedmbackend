const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const BASE = "https://www.googleapis.com/youtube/v3";

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (body?.error?.errors?.[0]?.reason === "quotaExceeded") {
      throw new Error("Cota da API do YouTube excedida");
    }
    throw new Error(body?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

function mapSearchResult(item) {
  const vid = item.id?.videoId;
  const snippet = item.snippet || {};
  const thumb = snippet.thumbnails?.medium || snippet.thumbnails?.default || {};
  return {
    id: vid,
    title: snippet.title || "",
    thumbnailUrl: thumb.url || "",
    youtubeUrl: vid ? `https://www.youtube.com/watch?v=${vid}` : "",
    publishedAt: snippet.publishedAt,
  };
}

function mapPlaylist(item) {
  const snippet = item.snippet || {};
  const thumb = snippet.thumbnails?.medium || snippet.thumbnails?.default || {};
  return {
    id: item.id,
    title: snippet.title || "",
    thumbnailUrl: thumb.url || "",
    youtubeUrl: `https://www.youtube.com/playlist?list=${item.id}`,
    itemCount: item.contentDetails?.itemCount ?? 0,
  };
}

/**
 * Busca vídeos do canal com uma duração (long, medium ou short).
 * Pagina até ter até maxItems ou acabar.
 */
async function searchByDuration(videoDuration, maxItems = 100) {
  const all = [];
  let nextPageToken = "";
  do {
    const params = new URLSearchParams({
      part: "snippet",
      channelId: YOUTUBE_CHANNEL_ID,
      type: "video",
      videoDuration,
      order: "date",
      maxResults: "50",
      key: YOUTUBE_API_KEY,
    });
    if (nextPageToken) params.set("pageToken", nextPageToken);
    const data = await fetchJson(`${BASE}/search?${params}`);
    const items = (data.items || []).filter((i) => i.id?.videoId).map(mapSearchResult);
    for (const it of items) {
      if (all.length >= maxItems) break;
      all.push(it);
    }
    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken && all.length < maxItems);
  return all;
}

/**
 * TIMELINE e LENDAS: todos os vídeos do canal EXCETO shorts.
 * API: videoDuration=long (>20min) + videoDuration=medium (4-20min).
 */
async function getVideos() {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    throw new Error("YOUTUBE_API_KEY e YOUTUBE_CHANNEL_ID devem estar configurados no .env");
  }
  const [longVideos, mediumVideos] = await Promise.all([
    searchByDuration("long"),
    searchByDuration("medium"),
  ]);
  const byId = new Map();
  for (const v of [...longVideos, ...mediumVideos]) {
    if (!byId.has(v.id)) byId.set(v.id, v);
  }
  const merged = Array.from(byId.values());
  merged.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  return merged;
}

/**
 * MEMÓRIAS: todos os shorts do canal (vídeos com duração "short" < 4min na API).
 */
async function getShorts() {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    throw new Error("YOUTUBE_API_KEY e YOUTUBE_CHANNEL_ID devem estar configurados no .env");
  }
  const items = await searchByDuration("short");
  items.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  return items;
}

/**
 * PLAYLIST: todas as playlists do canal Mundo EDM.
 */
async function getPlaylists() {
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    throw new Error("YOUTUBE_API_KEY e YOUTUBE_CHANNEL_ID devem estar configurados no .env");
  }
  const all = [];
  let nextPageToken = "";
  do {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      channelId: YOUTUBE_CHANNEL_ID,
      maxResults: "50",
      key: YOUTUBE_API_KEY,
    });
    if (nextPageToken) params.set("pageToken", nextPageToken);
    const data = await fetchJson(`${BASE}/playlists?${params}`);
    const list = (data.items || []).map(mapPlaylist);
    all.push(...list);
    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken);
  return all;
}

async function getVideoDetails(videoIds) {
  if (!YOUTUBE_API_KEY || !videoIds.length) return [];
  const ids = videoIds.slice(0, 50).join(",");
  const url = `${BASE}/videos?part=snippet&id=${ids}&key=${YOUTUBE_API_KEY}`;
  const data = await fetchJson(url);
  return (data.items || []).map((item) => {
    const snippet = item.snippet || {};
    const thumb = snippet.thumbnails?.medium || snippet.thumbnails?.default || {};
    return {
      id: item.id,
      title: snippet.title || "",
      thumbnailUrl: thumb.url || "",
      youtubeUrl: `https://www.youtube.com/watch?v=${item.id}`,
      publishedAt: snippet.publishedAt,
    };
  });
}

async function getPlaylistDetails(playlistIds) {
  if (!YOUTUBE_API_KEY || !playlistIds.length) return [];
  const ids = playlistIds.slice(0, 50).join(",");
  const url = `${BASE}/playlists?part=snippet,contentDetails&id=${ids}&key=${YOUTUBE_API_KEY}`;
  const data = await fetchJson(url);
  return (data.items || []).map((item) => {
    const snippet = item.snippet || {};
    const thumb = snippet.thumbnails?.medium || snippet.thumbnails?.default || {};
    return {
      id: item.id,
      title: snippet.title || "",
      thumbnailUrl: thumb.url || "",
      youtubeUrl: `https://www.youtube.com/playlist?list=${item.id}`,
      itemCount: item.contentDetails?.itemCount ?? 0,
    };
  });
}

module.exports = { getVideos, getShorts, getPlaylists, getVideoDetails, getPlaylistDetails };
