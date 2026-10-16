import { registerPlugin, Capacitor } from '@capacitor/core';

export interface VlcSource {
  name: string;
  url: string;
}

export interface VlcPlayerOptions {
  url: string;
  title: string;
  quality?: string;
  positionMs?: number;
  sourcesJson?: string;
}

export interface VlcPlayerResult {
  positionMs: number;
  durationMs: number;
  completed: boolean;
}

export interface FluxVlcPlayerPlugin {
  play(options: VlcPlayerOptions): Promise<VlcPlayerResult>;
}

export const FluxVlcPlayer = registerPlugin<FluxVlcPlayerPlugin>('FluxVlcPlayer');

export const isNativeVlcSupported = (): boolean => {
  return Capacitor.isNativePlatform();
};

export async function launchNativeVlc(
  url: string,
  title: string,
  quality: string = 'HD',
  positionMs: number = 0,
  sources: VlcSource[] = []
): Promise<VlcPlayerResult> {
  if (!isNativeVlcSupported()) {
    throw new Error('Native VLC is only available on Android platform.');
  }

  const sourcesJson = sources.length > 0 ? JSON.stringify(sources) : '';

  return await FluxVlcPlayer.play({
    url,
    title,
    quality,
    positionMs,
    sourcesJson
  });
}
