import { Capacitor, registerPlugin } from '@capacitor/core';

interface DownloadStatus {
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
  downloadedBytes: number;
  totalBytes: number;
  localUri?: string;
  reason?: string;
}

interface FluxDownloadsPlugin {
  start(options: { url: string; title: string; location: 'downloads' | 'movies'; folderName?: string }): Promise<{ downloadId: number; folderPath: string }>;
  status(options: { downloadId: number }): Promise<DownloadStatus>;
}

export const FluxDownloads = registerPlugin<FluxDownloadsPlugin>('FluxDownloads');

export const isNativeDownloadsSupported = () => Capacitor.isNativePlatform();
