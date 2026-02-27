export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  publishedAt: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  itemCount: number;
}

export interface SocialLink {
  id: string;
  name: string;
  href: string;
  platform: "instagram" | "tiktok" | "youtube" | "whatsapp";
}
