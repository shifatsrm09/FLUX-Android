import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { FluxSyncplay } from '../services/syncplayService';
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
  trending: [] as SearchResult[],
  isTrendingLoading: false,
  topPicksFirst: loadStored<boolean>(STORAGE_KEYS.TOP_PICKS_FIRST, false),
  history: loadStored<HistoryItem[]>(STORAGE_KEYS.HISTORY, []),
  bookmarks: loadStored<BookmarkItem[]>(STORAGE_KEYS.BOOKMARKS, []),
  downloads: loadStored<DownloadItem[]>(STORAGE_KEYS.DOWNLOADS, []),
  localMedia: loadStored<SearchResult[]>(STORAGE_KEYS.LOCAL_MEDIA, []),
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
      posterUrl: existing?.posterUrl
    };

    if (existingIdx >= 0) {
      store.history.splice(existingIdx, 1);
    }
    store.history.unshift(newEntry);
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

  addDownload(url: string, title: string, isPack: boolean) {
    const id = 'dl_' + Math.random().toString(36).substring(2, 9);
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
      startedAt: Date.now()
    };
    store.downloads.unshift(newDl);
    saveStored(STORAGE_KEYS.DOWNLOADS, store.downloads);
    emitChange();

    // Trigger browser native download or simulated download
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = title;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('Native download link trigger fallback', e);
    }

    // Simulate progress completion
    let curProgress = 0;
    const interval = setInterval(() => {
      curProgress += 15;
      if (curProgress >= 100) {
        curProgress = 100;
        clearInterval(interval);
        newDl.status = 'completed';
        newDl.progress = 100;
        newDl.speed = 'Finished';
      } else {
        newDl.progress = curProgress;
        newDl.downloadedBytes = Math.round((curProgress / 100) * newDl.totalBytes);
        newDl.speed = '4.2 MB/s';
      }
      saveStored(STORAGE_KEYS.DOWNLOADS, store.downloads);
      emitChange();
    }, 600);
  },

  addLocalFile(file: File) {
    const blobUrl = URL.createObjectURL(file);
    const item: SearchResult = {
      title: file.name,
      formattedSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      isFolder: false,
      playUrl: blobUrl,
      rawHref: blobUrl,
      extension: file.name.split('.').pop() || 'mp4',
      libraryName: 'Local Storage',
      group: 'My Videos',
      localPath: file.name
    };
    store.localMedia.unshift(item);
    saveStored(STORAGE_KEYS.LOCAL_MEDIA, store.localMedia);
    emitChange();
  },

  removeLocalMedia(url: string) {
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
