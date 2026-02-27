import type { YouTubeVideo, YouTubePlaylist } from "../types.js";
export declare function getChannelId(): Promise<string>;
export declare function getVideos(maxResults?: number): Promise<YouTubeVideo[]>;
export declare function getShorts(maxResults?: number): Promise<YouTubeVideo[]>;
export declare function getPlaylists(maxResults?: number): Promise<YouTubePlaylist[]>;
