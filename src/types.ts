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
