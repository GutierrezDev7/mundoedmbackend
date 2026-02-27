import type { YouTubeVideo, YouTubePlaylist } from "../types.js";
import { getCached, setCache } from "../db/cache.js";

const API_BASE = "https://www.googleapis.com/youtube/v3";
const CHANNEL_HANDLE = "@mundoedmoficial";
const CACHE_TTL_HOURS = 6;

function apiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || key === "YOUR_KEY_HERE") {
    throw new Error("YOUTUBE_API_KEY not configured");
  }
  return key;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

interface ChannelListResponse {
  items?: Array<{ id: string }>;
}

let cachedChannelId: string | null = null;

export async function getChannelId(): Promise<string> {
  if (cachedChannelId) return cachedChannelId;

  const dbCached = await getCached<string>("channel_id");
  if (dbCached) {
    cachedChannelId = dbCached;
    return dbCached;
  }

  const url = `${API_BASE}/channels?part=id&forHandle=${CHANNEL_HANDLE}&key=${apiKey()}`;
  const data = await fetchJson<ChannelListResponse>(url);

  if (!data.items?.length) {
    throw new Error(`Channel not found for handle ${CHANNEL_HANDLE}`);
  }

  cachedChannelId = data.items[0].id;
  await setCache("channel_id", cachedChannelId, 24 * 7);
  return cachedChannelId;
}

interface SearchItem {
  id: { videoId?: string };
  snippet: {
    title: string;
    publishedAt: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
}
interface SearchResponse {
  items?: SearchItem[];
  nextPageToken?: string;
}

function bestThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

function mapSearchToVideo(item: SearchItem): YouTubeVideo | null {
  const videoId = item.id.videoId;
  if (!videoId) return null;
  return {
    id: videoId,
    title: item.snippet.title,
    thumbnailUrl: bestThumbnail(videoId),
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    publishedAt: item.snippet.publishedAt,
  };
}

async function searchVideos(
  channelId: string,
  maxResults: number,
  extraParams = "",
): Promise<YouTubeVideo[]> {
  const all: YouTubeVideo[] = [];
  let pageToken = "";

  do {
    const url =
      `${API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date` +
      extraParams +
      `&maxResults=${Math.min(maxResults - all.length, 50)}` +
      (pageToken ? `&pageToken=${pageToken}` : "") +
      `&key=${apiKey()}`;

    const data = await fetchJson<SearchResponse>(url);
    if (data.items) {
      for (const item of data.items) {
        const v = mapSearchToVideo(item);
        if (v) all.push(v);
      }
    }
    pageToken = data.nextPageToken ?? "";
  } while (pageToken && all.length < maxResults);

  return all;
}

export async function getVideos(maxResults = 200): Promise<YouTubeVideo[]> {
  const cacheKey = `videos_${maxResults}`;
  const cached = await getCached<YouTubeVideo[]>(cacheKey);
  if (cached) {
    console.log(`[cache hit] ${cacheKey} — ${cached.length} videos`);
    return cached;
  }

  console.log(`[cache miss] ${cacheKey} — fetching from YouTube API...`);
  const channelId = await getChannelId();

  const [medium, long] = await Promise.all([
    searchVideos(channelId, maxResults, "&videoDuration=medium"),
    searchVideos(channelId, maxResults, "&videoDuration=long"),
  ]);

  const seen = new Set<string>();
  const all: YouTubeVideo[] = [];
  for (const v of [...medium, ...long]) {
    if (!seen.has(v.id)) {
      seen.add(v.id);
      all.push(v);
    }
  }

  all.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const result = all.slice(0, maxResults);

  await setCache(cacheKey, result, CACHE_TTL_HOURS);
  return result;
}

export async function getShorts(maxResults = 200): Promise<YouTubeVideo[]> {
  const cacheKey = `shorts_${maxResults}`;
  const cached = await getCached<YouTubeVideo[]>(cacheKey);
  if (cached) {
    console.log(`[cache hit] ${cacheKey} — ${cached.length} shorts`);
    return cached;
  }

  console.log(`[cache miss] ${cacheKey} — fetching from YouTube API...`);
  const channelId = await getChannelId();
  const result = await searchVideos(channelId, maxResults, "&videoDuration=short");

  await setCache(cacheKey, result, CACHE_TTL_HOURS);
  return result;
}

interface PlaylistItem {
  id: string;
  snippet: {
    title: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
  contentDetails?: { itemCount?: number };
}
interface PlaylistListResponse {
  items?: PlaylistItem[];
  nextPageToken?: string;
}

export async function getPlaylists(maxResults = 50): Promise<YouTubePlaylist[]> {
  const cacheKey = `playlists_${maxResults}`;
  const cached = await getCached<YouTubePlaylist[]>(cacheKey);
  if (cached) {
    console.log(`[cache hit] ${cacheKey} — ${cached.length} playlists`);
    return cached;
  }

  console.log(`[cache miss] ${cacheKey} — fetching from YouTube API...`);
  const channelId = await getChannelId();
  const all: YouTubePlaylist[] = [];
  let pageToken = "";

  do {
    const url =
      `${API_BASE}/playlists?part=snippet,contentDetails&channelId=${channelId}` +
      `&maxResults=${Math.min(maxResults, 50)}` +
      (pageToken ? `&pageToken=${pageToken}` : "") +
      `&key=${apiKey()}`;

    const data = await fetchJson<PlaylistListResponse>(url);
    if (data.items) {
      for (const item of data.items) {
        const thumb =
          item.snippet.thumbnails.high?.url ??
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.default?.url ??
          "";
        all.push({
          id: item.id,
          title: item.snippet.title,
          thumbnailUrl: thumb,
          youtubeUrl: `https://www.youtube.com/playlist?list=${item.id}`,
          itemCount: item.contentDetails?.itemCount ?? 0,
        });
      }
    }
    pageToken = data.nextPageToken ?? "";
  } while (pageToken && all.length < maxResults);

  await setCache(cacheKey, all, CACHE_TTL_HOURS);
  return all;
}
