import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FluxSyncplay } from '../services/syncplayService';
import { FluxDownloads, isNativeDownloadsSupported } from '../services/fluxDownloadService';
import type {
  SearchResult,
  HistoryItem,
  BookmarkItem,
  DownloadItem,
  AppSettings,
  MediaRoot
} from '../types';
import mediaLibraryRaw from '../data/media_library.json';
import iccLibraryRaw from '../data/icc_library.json';

const STORAGE_KEYS = {
  HISTORY: 'flux_history_v1',
  BOOKMARKS: 'flux_bookmarks_v1',
  SETTINGS: 'flux_settings_v1',
  DOWNLOADS: 'flux_downloads_v1',
  LOCAL_MEDIA: 'flux_local_media_v1',
  SELECTED_CATEGORIES_DHAKA: 'flux_sel_cat_dhaka',
  SELECTED_CATEGORIES_ICC: 'flux_sel_cat_icc',
  TOP_PICKS_FIRST: 'flux_top_picks_first',
  ONBOARDING_SEEN: 'flux_onboarding_seen_v1',
};

const defaultSettings: AppSettings = {
  activeServer: 1, // 1 = Dhaka Flix, 2 = ICC FTP
  iccftpUrl: 'http://10.16.100.244',
  iccSession: 'b1bdfdae1f7e206b628274ef7eafadcd6094e07c46cd85b157c595174a369f96',
  autoplayNext: true,
  resumePlayback: true,
  proxyMode: 'auto',
  customProxyUrl: '',
  volume: 100,
  muted: false,
  downloadLocation: undefined,
};

// Global reactive state
let stateListeners: Array<() => void> = [];

function loadStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

// Global store singleton
const store = {
  currentPage: 'search' as 'search' | 'library' | 'player',
  pageBeforePlayer: 'search' as 'search' | 'library',
  activeServer: 1 as 1 | 2,
  selectedCategoryIds: ['english_movies'] as string[],
  isAllSelected: false,
  searchQuery: '',
  searchResults: [] as SearchResult[],
  isSearching: false,
  statusMessage: '',
  errorMessage: '',
  lastSearchAt: 0,
  lastSuccessfulSearchAt: 0,
  trending: [] as SearchResult[],
  isTrendingLoading: false,
  topPicksFirst: loadStored<boolean>(STORAGE_KEYS.TOP_PICKS_FIRST, false),
  history: loadStored<HistoryItem[]>(STORAGE_KEYS.HISTORY, []),
  bookmarks: loadStored<BookmarkItem[]>(STORAGE_KEYS.BOOKMARKS, []),
  downloads: loadStored<DownloadItem[]>(STORAGE_KEYS.DOWNLOADS, []),
  pendingDownload: null as { url: string; title: string; isPack: boolean; posterUrl?: string; group?: string; parentPath?: string } | null,
  localMedia: loadStored<SearchResult[]>(STORAGE_KEYS.LOCAL_MEDIA, []),
  // SearchPage is unmounted while the native player is open. Keep the active
  // folder in the shared store so returning from playback restores context.
  browsingFolder: null as SearchResult | null,
  folderItems: [] as SearchResult[],
  playQueue: [] as SearchResult[],
  currentPlaying: null as {
    url: string;
    title: string;
    directUrl: string;
    isLocal?: boolean;
    fileObject?: File;
    embedUrl?: string;
    trailerUrl?: string;
    sources?: Array<{ name: string; url: string; type: 'embed' | 'video' | 'hls' }>;
  } | null,
  teleparty: {
    state: 'idle' as 'idle' | 'connecting' | 'joined' | 'reconnecting',
    sessionCode: '',
    isHost: false,
    membersCount: 1,
    statusText: 'Teleparty'
  },
  settings: {
    ...defaultSettings,
    ...loadStored<Partial<AppSettings>>(STORAGE_KEYS.SETTINGS, {})
  }
};

function emitChange() {
  stateListeners.forEach((listener) => listener());
}

export const FluxStore = {
  getState() {
    return store;
  },

  getDhakaRoots(): MediaRoot[] {
    return mediaLibraryRaw as MediaRoot[];
  },

  getIccRoots(): MediaRoot[] {
    return iccLibraryRaw as MediaRoot[];
  },

  getCurrentRoots(): MediaRoot[] {
    return store.activeServer === 2 ? FluxStore.getIccRoots() : FluxStore.getDhakaRoots();
  },

  setPage(page: 'search' | 'library' | 'player') {
    if (store.currentPage !== 'player' && page === 'player') {
      store.pageBeforePlayer = store.currentPage;
    }
    store.currentPage = page;
    emitChange();
  },

  setBrowsingFolder(folder: SearchResult | null) {
    store.browsingFolder = folder;
    if (!folder) {
      store.folderItems = [];
    }
    emitChange();
  },

  setFolderItems(items: SearchResult[]) {
    store.folderItems = items;
    emitChange();
  },

  setActiveServer(server: 1 | 2) {
    if (store.activeServer === server) return;
    store.activeServer = server;
    store.settings.activeServer = server;
    saveStored(STORAGE_KEYS.SETTINGS, store.settings);

    // Restore categories for active server
    const savedKey = server === 2 ? STORAGE_KEYS.SELECTED_CATEGORIES_ICC : STORAGE_KEYS.SELECTED_CATEGORIES_DHAKA;
    const defaultCat = server === 2 ? ['icc_eng_movies'] : ['english_movies'];
    store.selectedCategoryIds = loadStored<string[]>(savedKey, defaultCat);
    store.isAllSelected = store.selectedCategoryIds.length === FluxStore.getCurrentRoots().length;

    store.searchResults = [];
    store.statusMessage = '';
    store.errorMessage = '';
    emitChange();
  },

  selectCategory(id: string) {
    if (id === 'all') {
      store.isAllSelected = true;
      store.selectedCategoryIds = FluxStore.getCurrentRoots().map((r) => r.id);
    } else {
      store.isAllSelected = false;
      store.selectedCategoryIds = [id];
    }
    const savedKey = store.activeServer === 2 ? STORAGE_KEYS.SELECTED_CATEGORIES_ICC : STORAGE_KEYS.SELECTED_CATEGORIES_DHAKA;
    saveStored(savedKey, store.selectedCategoryIds);
    emitChange();
  },

  toggleCategory(id: string) {
    if (store.selectedCategoryIds.includes(id)) {
      store.selectedCategoryIds = store.selectedCategoryIds.filter((x) => x !== id);
    } else {
      store.selectedCategoryIds.push(id);
    }
    const allRoots = FluxStore.getCurrentRoots();
    store.isAllSelected = store.selectedCategoryIds.length === allRoots.length;
    const savedKey = store.activeServer === 2 ? STORAGE_KEYS.SELECTED_CATEGORIES_ICC : STORAGE_KEYS.SELECTED_CATEGORIES_DHAKA;
    saveStored(savedKey, store.selectedCategoryIds);
    emitChange();
  },

  setSearchQuery(q: string) {
    store.searchQuery = q;
    emitChange();
  },

  setSearchResults(results: SearchResult[]) {
    store.searchResults = results;
    store.isSearching = false;
    store.errorMessage = '';
    store.lastSearchAt = Date.now();
    store.lastSuccessfulSearchAt = store.lastSearchAt;
    emitChange();
  },

  setSearchError(message: string) {
    store.isSearching = false;
    store.errorMessage = message;
    store.lastSearchAt = Date.now();
    emitChange();
  },

  setIsSearching(val: boolean, status: string = '') {
    store.isSearching = val;
    store.statusMessage = status;
    emitChange();
  },

  setTrending(trending: SearchResult[]) {
    store.trending = trending;
    store.isTrendingLoading = false;
    emitChange();
  },

  toggleTopPicksFirst() {
    store.topPicksFirst = !store.topPicksFirst;
    saveStored(STORAGE_KEYS.TOP_PICKS_FIRST, store.topPicksFirst);
    emitChange();
  },

  playMedia(
    url: string,
    title: string,
    directUrl?: string,
    isLocal?: boolean,
    fileObject?: File,
    embedUrl?: string,
    trailerUrl?: string,
    sources?: Array<{ name: string; url: string; type: 'embed' | 'video' | 'hls' }>
  ) {
    const finalDirectUrl = directUrl || url;
    store.currentPlaying = {
      url,
      title,
      directUrl: finalDirectUrl,
      isLocal,
      fileObject,
      embedUrl,
      trailerUrl,
      sources
    };
    if (store.currentPage !== 'player') {
      store.pageBeforePlayer = store.currentPage;
    }
    store.currentPage = 'player';

    // Update history note start
    const existingIdx = store.history.findIndex((h) => h.url === url);
    const existing = existingIdx >= 0 ? store.history[existingIdx] : null;
    const newEntry: HistoryItem = {
      url,
      title,
      playbackUrl: finalDirectUrl,
      timestampMs: existing ? existing.timestampMs : 0,
      durationMs: existing ? existing.durationMs : 0,
      progressFraction: existing ? existing.progressFraction : 0,
      updatedAt: Date.now(),
      posterUrl: existing?.posterUrl,
      sources
    };

    if (existingIdx >= 0) {
      store.history.splice(existingIdx, 1);
    }
    store.history.unshift(newEntry);
    saveStored(STORAGE_KEYS.HISTORY, store.history);

    emitChange();
  },

  setPlayQueue(items: SearchResult[]) {
    store.playQueue = items.filter((item) => !item.isFolder);
    emitChange();
  },

  restoreHistory(item: HistoryItem) {
    store.history = [item, ...store.history.filter((h) => h.url !== item.url)].slice(0, 100);
    saveStored(STORAGE_KEYS.HISTORY, store.history);
    emitChange();
  },

  updateProgress(url: string, timestampMs: number, durationMs: number) {
    const item = store.history.find((h) => h.url === url);
    if (!item) return;
    item.timestampMs = timestampMs;
    item.durationMs = durationMs;
    item.progressFraction = durationMs > 0 ? timestampMs / durationMs : 0;
    item.updatedAt = Date.now();
    saveStored(STORAGE_KEYS.HISTORY, store.history);
    emitChange();
  },

  removeFromHistory(url: string) {
    store.history = store.history.filter((h) => h.url !== url);
    saveStored(STORAGE_KEYS.HISTORY, store.history);
    emitChange();
  },

  toggleBookmark(item: SearchResult) {
    const exists = store.bookmarks.some((b) => b.url === item.playUrl);
    if (exists) {
      store.bookmarks = store.bookmarks.filter((b) => b.url !== item.playUrl);
    } else {
      store.bookmarks.unshift({
        url: item.playUrl,
        title: item.title,
        isFolder: item.isFolder,
        libraryName: item.libraryName,
        group: item.group,
        addedAt: Date.now(),
        posterUrl: item.posterUrl
      });
    }
    saveStored(STORAGE_KEYS.BOOKMARKS, store.bookmarks);
    emitChange();
  },

  isBookmarked(url: string): boolean {
    return store.bookmarks.some((b) => b.url === url);
  },

  addDownload(url: string, title: string, isPack: boolean, posterUrl?: string, group?: string, parentPath?: string) {
    if (isNativeDownloadsSupported() && !store.settings.downloadLocation) {
      store.pendingDownload = { url, title, isPack, posterUrl, group, parentPath };
      emitChange();
      return;
    }

    const id = 'dl_' + Math.random().toString(36).substring(2, 9);
    const folderName = parentPath || (isPack ? title : (/^(.*?)(?:\s+S\d{1,2}|\s+Season\s+\d+)/i.exec(title)?.[1] || ''));
    const newDl: DownloadItem = {
      id,
      url,
      title,
      isPack,
      progress: 0,
      downloadedBytes: 0,
      totalBytes: isPack ? 1024 * 1024 * 1024 * 5 : 1024 * 1024 * 700,
      speed: 'Calculating...',
      status: 'downloading',
      startedAt: Date.now(),
      posterUrl,
      group,
      folderPath: folderName
    };
    store.downloads.unshift(newDl);
    saveStored(STORAGE_KEYS.DOWNLOADS, store.downloads);
    emitChange();

    if (isNativeDownloadsSupported()) {
      FluxDownloads.start({
        url,
        title,
        location: store.settings.downloadLocation || 'downloads',
        folderName
      }).then(({ downloadId, folderPath }) => {
        newDl.nativeDownloadId = downloadId;
        newDl.folderPath = folderPath;
        saveStored(STORAGE_KEYS.DOWNLOADS, store.downloads);
        emitChange();
        const poll = window.setInterval(async () => {
          try {
            const status = await FluxDownloads.status({ downloadId });
            newDl.status = status.status === 'completed' ? 'completed' : status.status === 'failed' ? 'error' : status.status === 'paused' ? 'queued' : status.status;
            newDl.downloadedBytes = status.downloadedBytes;
            newDl.totalBytes = status.totalBytes > 0 ? status.totalBytes : newDl.totalBytes;
            newDl.progress = newDl.totalBytes > 0 ? Math.round((newDl.downloadedBytes / newDl.totalBytes) * 100) : 0;
            newDl.speed = newDl.status === 'completed' ? 'Finished' : `${newDl.progress}%`;
            if (status.localUri) newDl.localUri = status.localUri;
            if (newDl.status === 'completed' || newDl.status === 'error') window.clearInterval(poll);
            saveStored(STORAGE_KEYS.DOWNLOADS, store.downloads);
            emitChange();
          } catch (error) {
            console.warn('Download status update failed', error);
          }
        }, 1000);
      }).catch((error) => {
        newDl.status = 'error';
        newDl.error = error?.message || 'Unable to start download';
        saveStored(STORAGE_KEYS.DOWNLOADS, store.downloads);
        emitChange();
      });
    } else {
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = title;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        newDl.status = 'completed';
        newDl.progress = 100;
        newDl.speed = 'Browser download started';
        saveStored(STORAGE_KEYS.DOWNLOADS, store.downloads);
        emitChange();
      } catch (error: any) {
        newDl.status = 'error';
        newDl.error = error?.message || 'Unable to start download';
        saveStored(STORAGE_KEYS.DOWNLOADS, store.downloads);
        emitChange();
      }
    }
  },

  setDownloadLocation(location: 'downloads' | 'movies') {
    store.settings = { ...store.settings, downloadLocation: location };
    saveStored(STORAGE_KEYS.SETTINGS, store.settings);
    const pending = store.pendingDownload;
    store.pendingDownload = null;
    emitChange();
    if (pending) {
      FluxStore.addDownload(pending.url, pending.title, pending.isPack, pending.posterUrl, pending.group, pending.parentPath);
    }
  },

  async addLocalFile(file: File) {
    let playableUrl = '';
    let persistentPath = file.name;

    if (Capacitor.isNativePlatform()) {
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const result = await Filesystem.writeFile({
        path: `media/${safeName}`,
        data,
        directory: Directory.Data,
        recursive: true
      });
      persistentPath = `media/${safeName}`;
      playableUrl = Capacitor.convertFileSrc(result.uri);
    } else {
      playableUrl = URL.createObjectURL(file);
    }

    const item: SearchResult = {
      title: file.name,
      formattedSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      isFolder: false,
      playUrl: playableUrl,
      rawHref: playableUrl,
      extension: file.name.split('.').pop() || 'mp4',
      libraryName: 'Local Storage',
      group: 'My Videos',
      localPath: persistentPath
    };
    store.localMedia.unshift(item);
    saveStored(STORAGE_KEYS.LOCAL_MEDIA, store.localMedia);
    emitChange();
  },

  async removeLocalMedia(url: string) {
    const item = store.localMedia.find((m) => m.playUrl === url);
    if (item?.localPath && Capacitor.isNativePlatform() && item.localPath.startsWith('media/')) {
      try { await Filesystem.deleteFile({ path: item.localPath, directory: Directory.Data }); } catch { /* already removed */ }
    }
    store.localMedia = store.localMedia.filter((m) => m.playUrl !== url);
    saveStored(STORAGE_KEYS.LOCAL_MEDIA, store.localMedia);
    emitChange();
  },

  updateSettings(partial: Partial<AppSettings>) {
    store.settings = { ...store.settings, ...partial };
    saveStored(STORAGE_KEYS.SETTINGS, store.settings);
    emitChange();
  },

  // Teleparty management
  async hostTeleparty() {
    store.teleparty = {
      state: 'connecting',
      sessionCode: '...',
      isHost: true,
      membersCount: 1,
      statusText: 'Connecting to Syncplay...'
    };
    emitChange();

    try {
      if (Capacitor.isNativePlatform()) {
        const res = await FluxSyncplay.hostSession();
        store.teleparty = {
          state: 'joined',
          sessionCode: res.code,
          isHost: true,
          membersCount: 1,
          statusText: `Teleparty: ${res.code}`
        };
      } else {
        const num = Math.floor(10000 + Math.random() * 90000).toString();
        store.teleparty = {
          state: 'joined',
          sessionCode: num,
          isHost: true,
          membersCount: 1,
          statusText: `Teleparty: ${num}`
        };
      }
    } catch (e: any) {
      console.error('Failed to host Teleparty session:', e);
      store.teleparty = {
        state: 'idle',
        sessionCode: '',
        isHost: false,
        membersCount: 1,
        statusText: 'Teleparty'
      };
    }
    emitChange();
  },

  async joinTeleparty(code: string) {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    store.teleparty = {
      state: 'connecting',
      sessionCode: cleanCode,
      isHost: false,
      membersCount: 1,
      statusText: 'Connecting to Syncplay...'
    };
    emitChange();

    try {
      if (Capacitor.isNativePlatform()) {
        const res = await FluxSyncplay.joinSession({ code: cleanCode });
        store.teleparty = {
          state: 'joined',
          sessionCode: res.code,
          isHost: false,
          membersCount: 1,
          statusText: `Teleparty: ${res.code}`
        };
      } else {
        store.teleparty = {
          state: 'joined',
          sessionCode: cleanCode,
          isHost: false,
          membersCount: 2,
          statusText: `Teleparty: ${cleanCode}`
        };
      }
    } catch (e: any) {
      console.error('Failed to join Teleparty session:', e);
      store.teleparty = {
        state: 'idle',
        sessionCode: '',
        isHost: false,
        membersCount: 1,
        statusText: 'Teleparty'
      };
    }
    emitChange();
  },

  async leaveTeleparty() {
    try {
      if (Capacitor.isNativePlatform()) {
        await FluxSyncplay.leaveSession();
      }
    } catch (ignored) {}
    store.teleparty = {
      state: 'idle',
      sessionCode: '',
      isHost: false,
      membersCount: 1,
      statusText: 'Teleparty'
    };
    emitChange();
  }
};

// Register listeners once on native platforms
if (Capacitor.isNativePlatform()) {
  FluxSyncplay.addListener('memberJoined', () => {
    store.teleparty.membersCount++;
    emitChange();
  });
  FluxSyncplay.addListener('memberLeft', () => {
    if (store.teleparty.membersCount > 1) {
      store.teleparty.membersCount--;
      emitChange();
    }
  });
  FluxSyncplay.addListener('disconnected', () => {
    if (store.teleparty.state !== 'idle') {
      store.teleparty = {
        state: 'idle',
        sessionCode: '',
        isHost: false,
        membersCount: 1,
        statusText: 'Teleparty'
      };
      emitChange();
    }
  });
}

export function useFlux() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    stateListeners.push(listener);
    return () => {
      stateListeners = stateListeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    state: store,
    ...FluxStore
  };
}
