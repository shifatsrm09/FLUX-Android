export interface MediaRoot {
  id: string;
  name: string;
  group: string;
  url: string;
  serverOrigin: string;
  href: string;
}

export interface VideoSource {
  name: string;
  url: string;
  type: 'embed' | 'video' | 'hls';
}

export interface SearchResult {
  title: string;
  parentPath?: string;
  isFolder: boolean;
  formattedSize: string;
  playUrl: string;
  extension: string;
  rawHref: string;
  libraryName: string;
  group: string;
  posterUrl?: string;
  matchScore?: number;
  localPath?: string;
  imdbId?: string;
  embedUrl?: string;
  trailerUrl?: string;
  sources?: VideoSource[];
}

export interface HistoryItem {
  url: string;
  title: string;
  playbackUrl?: string;
  timestampMs: number;
  durationMs: number;
  progressFraction: number; // 0..1
  updatedAt: number;
  posterUrl?: string;
  isFolder?: boolean;
  embedUrl?: string;
  trailerUrl?: string;
}

export interface BookmarkItem {
  url: string;
  title: string;
  isFolder: boolean;
  libraryName: string;
  group: string;
  addedAt: number;
  posterUrl?: string;
  embedUrl?: string;
  trailerUrl?: string;
}

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  isPack: boolean;
  progress: number; // 0..100
  downloadedBytes: number;
  totalBytes: number;
  speed: string;
  status: 'queued' | 'downloading' | 'completed' | 'error';
  error?: string;
  startedAt: number;
}

export interface AppSettings {
  activeServer: 1 | 2; // 1 = Dhaka Flix, 2 = ICC FTP
  iccftpUrl: string;
  iccSession: string;
  autoplayNext: boolean;
  resumePlayback: boolean;
  proxyMode: 'auto' | 'direct' | 'corsproxy' | 'custom';
  customProxyUrl: string;
  volume: number; // 0..100
  muted: boolean;
}

export interface TelepartyMessage {
  type: 'join' | 'sync' | 'play' | 'pause' | 'seek' | 'open';
  userId: string;
  userName: string;
  url?: string;
  title?: string;
  timeMs?: number;
  paused?: boolean;
  timestamp: number;
}
