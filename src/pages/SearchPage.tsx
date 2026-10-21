import React, { useState, useEffect, useRef } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { SearchResultCard } from '../components/SearchResultCard';
import { CategoryFilterSection } from '../components/CategoryFilterSection';
import { FluxIcon } from '../components/FluxIcon';
import { TOP_PICKS } from '../data/topPicks';
import { executeSearch, fetchTrending, fetchFolderItems, fetchCategoryItems } from '../services/searchService';
import type { SearchResult, HistoryItem } from '../types';

interface SearchPageProps {
  isSearchActiveTab?: boolean;
}

export const SearchPage: React.FC<SearchPageProps> = ({ isSearchActiveTab = false }) => {
  const {
    state,
    setActiveServer,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    setTrending,
    removeFromHistory,
    restoreHistory,
    setPlayQueue,
    setSearchError,
    setBrowsingFolder,
    setFolderItems,
  } = useFlux();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const continueScrollRef = useRef<HTMLDivElement>(null);
  const topPicksScrollRef = useRef<HTMLDivElement>(null);
  const trendingScrollRef = useRef<HTMLDivElement>(null);

  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const browsingFolder = state.browsingFolder;
  const folderItems = state.folderItems;
  const [isFolderLoading, setIsFolderLoading] = useState(false);
  const [historySort, setHistorySort] = useState<'recent' | 'progress' | 'title'>('recent');
  const [historySortOpen, setHistorySortOpen] = useState(false);
  const [removedHistory, setRemovedHistory] = useState<HistoryItem | null>(null);
  const searchRequestRef = useRef(0);

  // Focus search input when navigating to Search tab
  useEffect(() => {
    if (isSearchActiveTab && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActiveTab]);

  // Load trending media on mount or when server changes
  useEffect(() => {
    const cacheKey = `flux_trending_${state.activeServer}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { savedAt: number; data: SearchResult[] };
        if (Date.now() - parsed.savedAt < 10 * 60 * 1000) {
          setTrending(parsed.data);
          return;
        }
      } catch { /* refresh below */ }
    }
    fetchTrending(state.activeServer).then((data) => {
      setTrending(data);
      localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), data }));
    }).catch(() => {});
  }, [state.activeServer]);

  const loadCategoryResults = () => {
    setIsSearching(true, 'Loading category...');
    fetchCategoryItems(
      state.activeServer,
      state.selectedCategoryIds,
      state.isAllSelected,
      state.settings.proxyMode,
      state.settings.customProxyUrl
    ).then((items) => {
      setSearchResults(items);
      setIsSearching(false);
    }).catch((error: Error) => {
      setSearchError(error.message || 'The server could not be reached.');
    });
  };

  // Debounced Search Execution
  useEffect(() => {
    const q = state.searchQuery.trim();
    const requestId = ++searchRequestRef.current;
    if (!q) {
      if (isSearchMode) {
        loadCategoryResults();
      } else {
        setSearchResults([]);
      }
      return;
    }

    setIsSearching(true, `Searching for "${q}"...`);
    const timer = setTimeout(() => {
      executeSearch(
        q,
        state.activeServer,
        state.selectedCategoryIds,
        state.isAllSelected,
        state.settings.proxyMode,
        state.settings.customProxyUrl
      ).then((results) => {
        if (requestId !== searchRequestRef.current) return;
        setSearchResults(results);
        setIsSearching(false);
      }).catch((error: Error) => {
        if (requestId !== searchRequestRef.current) return;
        setSearchError(error.message || 'The server could not be reached.');
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [state.searchQuery, state.activeServer, state.selectedCategoryIds, state.isAllSelected, isSearchActiveTab]);

  const handleSelectFolder = async (folder: SearchResult) => {
    setBrowsingFolder(folder);
    setFolderItems([]);
    setIsFolderLoading(true);
    const items = await fetchFolderItems(
      folder,
      state.settings.proxyMode,
      state.settings.customProxyUrl
    );
    setPlayQueue(items);
    setFolderItems(items);
    setIsFolderLoading(false);
  };

  const handleBackToSearchResults = () => {
    setBrowsingFolder(null);
    setPlayQueue([]);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = state.searchQuery.trim();
    if (q) {
      setCategoriesExpanded(false);
      setIsSearching(true, `Searching for "${q}"...`);
      executeSearch(
        q,
        state.activeServer,
        state.selectedCategoryIds,
        state.isAllSelected,
        state.settings.proxyMode,
        state.settings.customProxyUrl
      ).then((results) => {
        setSearchResults(results);
        setIsSearching(false);
      }).catch((error: Error) => {
        setSearchError(error.message || 'The server could not be reached.');
      });
    } else {
      loadCategoryResults();
    }
  };

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = ref.current.clientWidth * 0.75;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  function watchedTimeLabel(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `Watched ${hours}h ${minutes}m`;
    if (totalMinutes === 0) return `Watched ${totalSeconds} sec`;
    return `Watched ${totalMinutes} min`;
  }

  const isSearchMode = isSearchActiveTab || state.searchQuery.trim().length > 0;
  const continueWatching = state.history
    .filter((h) => !h.isFolder && h.timestampMs > 1000)
    .sort((a, b) => historySort === 'progress'
      ? b.progressFraction - a.progressFraction
      : historySort === 'title'
        ? a.title.localeCompare(b.title)
        : b.updatedAt - a.updatedAt);
  const trendingList = state.trending || [];

  return (
    <div className="min-h-screen pt-2 pb-12 px-3 sm:px-6 md:px-10 max-w-[1400px] mx-auto select-none">
      {/* =========================================================================
          VIEW A: Folder Browser View
         ========================================================================= */}
      {browsingFolder ? (
        <div className="space-y-6 pt-2 animate-fadeIn">
          {/* Breadcrumb Header */}
          <div className="flex items-center space-x-3 text-sm text-[#949BA4]">
            <button
              onClick={handleBackToSearchResults}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
            >
              <FluxIcon name="back" size={16} color="#FFFFFF" />
              <span>Back</span>
            </button>
            <span className="text-[#80848E]">›</span>
            <span className="text-white font-semibold line-clamp-1">{browsingFolder.title}</span>
          </div>

          <div className="flex items-center justify-between border-b border-[#2B2D31] pb-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">{browsingFolder.title}</h2>
            <span className="text-xs text-[#949BA4]">
              {isFolderLoading ? 'Loading items...' : `${folderItems.length} items`}
            </span>
          </div>

          {isFolderLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[1/1.5] rounded-xl bg-[#313338] animate-shimmer" />
              ))}
            </div>
          ) : folderItems.length === 0 ? (
            <div className="py-20 text-center text-[#949BA4] text-sm">
              This folder appears to be empty.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
              {folderItems.map((item, idx) => (
                <SearchResultCard
                  key={idx}
                  item={item}
                  libraryName={browsingFolder.libraryName}
                  onSelectFolder={handleSelectFolder}
                />
              ))}
            </div>
          )}
        </div>
      ) : isSearchMode ? (
        /* =========================================================================
           VIEW B: 1:1 MATCH OF NATIVE WINDOWS FLUX SEARCH PAGE (Screenshot Match)
           ========================================================================= */
        <div className="space-y-6 pt-3 animate-fadeIn">
          {/* 1. Server Selector Pill Centered matching SearchPage.qml lines 953-1114 */}
          <div className="flex justify-center pt-1">
            <div className="inline-flex h-[42px] p-1 rounded-full bg-[#313338] border border-[#2B2D31] shadow-lg items-center">
              {/* Server 1 (Dhaka Flix) */}
              <button
                onClick={() => {
                  setActiveServer(1);
                  setCategoriesExpanded(true);
                }}
                className={`flex items-center space-x-2 h-[34px] px-5 rounded-full text-[13px] transition-all cursor-pointer ${
                  state.activeServer === 1
                    ? 'bg-[#5865F2] text-white font-bold shadow-md'
                    : 'text-[#949BA4] hover:text-white font-normal'
                }`}
              >
                {state.activeServer === 1 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}
                <span>Server 1 (Dhaka Flix)</span>
              </button>

              {/* Server 2 (ICC FTP) */}
              <button
                onClick={() => {
                  setActiveServer(2);
                  setCategoriesExpanded(true);
                }}
                className={`flex items-center space-x-2 h-[34px] px-5 rounded-full text-[13px] transition-all cursor-pointer ${
                  state.activeServer === 2
                    ? 'bg-[#5865F2] text-white font-bold shadow-md'
                    : 'text-[#949BA4] hover:text-white font-normal'
                }`}
              >
                {state.activeServer === 2 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}
                <span>Server 2 (ICC FTP)</span>
              </button>
            </div>
          </div>

          {/* 2. Compact Search Input Bar + Blue "Search" Button Centered matching QML lines 1117-1210 */}
          <form onSubmit={handleSearchSubmit} className="flex justify-center">
            <div className="flex items-center space-x-2.5 w-full max-w-2xl">
              {/* Input container */}
              <div className="relative grow h-13 rounded-2xl bg-[#313338] border border-[#2B2D31] focus-within:border-[#5865F2] focus-within:ring-1 focus-within:ring-[#5865F2] shadow-md flex items-center transition-all">
                <div className="absolute left-4 pointer-events-none">
                  <FluxIcon name="search" size={18} color="#80848E" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={state.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies, shows, episodes..."
                  className="w-full pl-12 pr-10 h-full bg-transparent text-sm text-white placeholder-[#80848E] focus:outline-none"
                />
                {state.searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setCategoriesExpanded(true);
                    }}
                    className="absolute right-3.5 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Blue "Search" Pill Button matching FluxButton text="Search" implicitHeight: 44 */}
              <button
                type="submit"
                className="h-13 px-7 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] text-white text-sm font-bold tracking-wide transition-all cursor-pointer shadow-lg shadow-[#5865F2]/25 shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* 3. CategoryFilterSection matching native CategoryFilterSection.qml */}
          <div className="w-full">
            <CategoryFilterSection
              isExpanded={categoriesExpanded}
              onToggleExpanded={() => setCategoriesExpanded(!categoriesExpanded)}
              onSelectionChanged={() => {
                if (state.searchQuery.trim()) {
                  handleSearchSubmit();
                } else {
                  loadCategoryResults();
                }
              }}
            />
          </div>

          {/* 4. Center Idle State Icon matching SearchPage.qml lines 1230-1250 */}
          {!state.isSearching && state.searchResults.length === 0 && !state.searchQuery.trim() && (
            <div className="pt-16 pb-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-[#313338] border border-[#2B2D31] flex items-center justify-center shadow-lg">
                <FluxIcon name="search" size={28} color="#5865F2" />
              </div>
            </div>
          )}

          {/* 5. Search Results Header & Grid */}
          {(state.isSearching || state.searchResults.length > 0 || state.errorMessage) && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-[#2B2D31] pb-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  {state.isSearching
                    ? state.searchQuery.trim()
                      ? `Searching for "${state.searchQuery}"...`
                      : 'Loading category items...'
                    : state.errorMessage
                    ? 'Search unavailable'
                    : state.searchQuery.trim()
                    ? `${state.searchResults.length} results found for "${state.searchQuery}"`
                    : `${state.searchResults.length} items in category`}
                </h2>
              </div>

              {state.isSearching ? (
                /* Shimmer Skeletons */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-[1/1.5] rounded-xl bg-[#313338] animate-shimmer" />
                  ))}
                </div>
              ) : state.errorMessage ? (
                <div className="py-12 text-center space-y-3 rounded-xl bg-[#F0B232]/10 border border-[#F0B232]/25">
                  <p className="text-sm font-semibold text-[#F0B232]">{state.errorMessage}</p>
                  <p className="text-xs text-[#949BA4]">Last successful search: {state.lastSuccessfulSearchAt ? new Date(state.lastSuccessfulSearchAt).toLocaleTimeString() : 'none yet'}</p>
                  <button onClick={() => handleSearchSubmit()} className="px-4 py-2 rounded-full bg-[#5865F2] text-xs font-bold text-white">Retry</button>
                </div>
              ) : state.searchResults.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <p className="text-sm text-[#949BA4]">
                    {state.searchQuery.trim()
                      ? `No matching results found for "${state.searchQuery}".`
                      : 'No items found in this category.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                  {state.searchResults.map((item, idx) => (
                    <SearchResultCard
                      key={idx}
                      item={item}
                      onSelectFolder={handleSelectFolder}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
           VIEW C: Home (3 Sections: Continue watching, Top Picks, Trending Right now)
           ========================================================================= */
        <div className="space-y-8 sm:space-y-10 pt-1 pb-10 animate-fadeIn">
          {/* =====================================================================
              SECTION 1: Continue watching (1 Row, Horizontally Scrollable)
             ===================================================================== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg sm:text-[20px] font-bold text-white tracking-[-0.2px]">
                  Continue watching
                </h2>
                {continueWatching.length > 0 && (
                  <span className="text-[11px] font-semibold text-[#5865F2] bg-[#5865F2]/15 border border-[#5865F2]/40 px-2 py-0.5 rounded-full">
                    {continueWatching.length}
                  </span>
                )}
              </div>

              {continueWatching.length > 0 && (
                <div className="flex items-center space-x-1.5">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setHistorySortOpen((open) => !open)}
                      aria-haspopup="menu"
                      aria-expanded={historySortOpen}
                      className="h-7 min-w-[76px] px-2.5 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] text-[11px] font-semibold text-[#DBDEE1] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>{historySort === 'recent' ? 'Recent' : historySort === 'progress' ? 'Progress' : 'Title'}</span>
                      <span className={`text-[#949BA4] transition-transform ${historySortOpen ? 'rotate-180' : ''}`}>⌄</span>
                    </button>
                    {historySortOpen && (
                      <div role="menu" className="absolute right-0 top-9 z-30 w-32 overflow-hidden rounded-xl bg-[#2B2D31] border border-[#4E5058] shadow-2xl p-1 animate-fadeIn">
                        {(['recent', 'progress', 'title'] as const).map((option) => (
                          <button
                            key={option}
                            role="menuitemradio"
                            aria-checked={historySort === option}
                            onClick={() => { setHistorySort(option); setHistorySortOpen(false); }}
                            className={`w-full px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors ${historySort === option ? 'bg-[#5865F2] text-white' : 'text-[#DBDEE1] hover:bg-white/10'}`}
                          >
                            {option === 'recent' ? 'Recently watched' : option === 'progress' ? 'Most watched' : 'Title A–Z'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => scrollRow(continueScrollRef, 'left')}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] flex items-center justify-center text-white transition-colors cursor-pointer"
                    title="Scroll left"
                  >
                    <FluxIcon name="chevronLeft" size={14} color="#FFFFFF" />
                  </button>
                  <button
                    onClick={() => scrollRow(continueScrollRef, 'right')}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] flex items-center justify-center text-white transition-colors cursor-pointer"
                    title="Scroll right"
                  >
                    <FluxIcon name="chevronRight" size={14} color="#FFFFFF" />
                  </button>
                </div>
              )}
            </div>

            {/* Horizontal Slider: 3 to 4 cards in a row */}
            {continueWatching.length > 0 ? (
              <div
                ref={continueScrollRef}
                className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar scroll-smooth"
              >
                {continueWatching.map((item) => (
                  <div
                    key={item.url}
                    className="w-[105px] min-w-[105px] sm:w-[135px] sm:min-w-[135px] md:w-[160px] md:min-w-[160px] shrink-0"
                  >
                    <SearchResultCard
                      item={{
                        title: item.title,
                        formattedSize: '',
                        isFolder: false,
                        playUrl: item.url,
                        extension: 'mkv',
                        rawHref: item.url,
                        libraryName: 'Continue',
                        group: 'Watching',
                        posterUrl: item.posterUrl,
                        embedUrl: item.embedUrl, trailerUrl: item.trailerUrl, sources: item.sources
                      }}
                      progress={item.progressFraction}
                      extraInfo={watchedTimeLabel(item.timestampMs)}
                      showRemove={true}
                      onRemove={() => {
                        removeFromHistory(item.url);
                        setRemovedHistory(item);
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-[#2B2D31]/40 border border-[#2B2D31]/70 text-[#949BA4]">
                <div className="w-8 h-8 rounded-full bg-[#313338] border border-[#2B2D31] flex items-center justify-center shrink-0">
                  <FluxIcon name="play" size={14} color="#5865F2" />
                </div>
                <div className="text-xs">
                  <p className="font-semibold text-white/90">No watched media yet</p>
                  <p className="text-[11px] text-[#80848E]">
                    Start watching movies or series to easily pick up where you left off.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* =====================================================================
              SECTION 2: Top Picks (1 Row, Horizontally Scrollable)
             ===================================================================== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <h2 className="text-lg sm:text-[20px] font-bold text-white tracking-[-0.2px]">
                  Top Picks
                </h2>
                <div className="h-5 px-2 rounded-full bg-[#5865F2]/15 border border-[#5865F2]/50 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[#5865F2]">
                    {state.activeServer === 2 ? 'ICC FTP' : 'Dhaka Flix'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#949BA4] hidden xs:inline">
                  {TOP_PICKS.length} items
                </span>
                <button
                  onClick={() => scrollRow(topPicksScrollRef, 'left')}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="Scroll left"
                >
                  <FluxIcon name="chevronLeft" size={14} color="#FFFFFF" />
                </button>
                <button
                  onClick={() => scrollRow(topPicksScrollRef, 'right')}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] flex items-center justify-center text-white transition-colors cursor-pointer"
                  title="Scroll right"
                >
                  <FluxIcon name="chevronRight" size={14} color="#FFFFFF" />
                </button>
              </div>
            </div>

            {/* Horizontal Slider: 3 to 4 cards in a row */}
            <div
              ref={topPicksScrollRef}
              className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar scroll-smooth"
            >
              {TOP_PICKS.map((pick, idx) => {
                const preferIcc = state.activeServer === 2 && Boolean(pick.altUrl);
                const effectiveUrl = preferIcc ? pick.altUrl : pick.url;

                return (
                  <div
                    key={idx}
                    className="w-[105px] min-w-[105px] sm:w-[135px] sm:min-w-[135px] md:w-[160px] md:min-w-[160px] shrink-0"
                  >
                    <SearchResultCard
                      item={{
                        title: pick.title,
                        playUrl: effectiveUrl,
                        posterUrl: pick.posterUrl,
                        formattedSize: '',
                        isFolder: false,
                        extension: 'mkv',
                        rawHref: effectiveUrl,
                        libraryName: preferIcc ? 'ICC FTP' : 'DHAKA FLIX',
                        group: 'Top Pick'
                      }}
                      libraryName={preferIcc ? 'ICC FTP' : 'DHAKA FLIX'}
                      extraInfo={pick.extraInfo}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {/* =====================================================================
              SECTION 3: Trending Right now (1 Row default, Multiple Rows with See More)
             ===================================================================== */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 shrink-0">
                <h2 className="text-base sm:text-lg md:text-[20px] font-bold text-white tracking-[-0.2px] whitespace-nowrap">
                  Trending Right now
                </h2>
                <div className="h-4 sm:h-5 px-1.5 sm:px-2 rounded-full bg-[#5865F2]/15 border border-[#5865F2]/50 flex items-center justify-center shrink-0">
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#5865F2]">{state.activeServer === 2 ? 'ICC FTP' : 'Dhaka Flix'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {/* See More / See Less Toggle Button */}
                <button
                  onClick={() => setShowAllTrending(!showAllTrending)}
                  className="h-7 px-2.5 sm:px-3 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] hover:border-[#5865F2] flex items-center space-x-1 text-white font-semibold text-[11px] sm:text-xs transition-all cursor-pointer shadow"
                >
                  <span>{showAllTrending ? 'See Less' : 'See More'}</span>
                  <FluxIcon
                    name={showAllTrending ? 'chevronUp' : 'chevronDown'}
                    size={11}
                    color="#949BA4"
                  />
                </button>

                {/* Left/Right scroll buttons visible on sm+ screens */}
                {!showAllTrending && (
                  <div className="hidden sm:flex items-center space-x-1.5">
                    <button
                      onClick={() => scrollRow(trendingScrollRef, 'left')}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] flex items-center justify-center text-white transition-colors cursor-pointer"
                      title="Scroll left"
                    >
                      <FluxIcon name="chevronLeft" size={14} color="#FFFFFF" />
                    </button>
                    <button
                      onClick={() => scrollRow(trendingScrollRef, 'right')}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] flex items-center justify-center text-white transition-colors cursor-pointer"
                      title="Scroll right"
                    >
                      <FluxIcon name="chevronRight" size={14} color="#FFFFFF" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Trending Content: 1 Row (Horizontally Scrollable) OR Multiple Rows Grid */}
            {state.isTrendingLoading && trendingList.length === 0 ? (
              <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-[105px] min-w-[105px] sm:w-[135px] sm:min-w-[135px] md:w-[160px] md:min-w-[160px] aspect-[1/1.5] rounded-xl bg-[#313338] animate-shimmer shrink-0"
                  />
                ))}
              </div>
            ) : showAllTrending ? (
              /* MULTIPLE ROWS GRID (When See More is active) */
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3.5">
                  {trendingList.map((item, idx) => (
                    <SearchResultCard
                      key={idx}
                      item={item}
                      libraryName={state.activeServer === 2 ? 'ICC FTP' : 'Dhaka Flix'}
                      onSelectFolder={handleSelectFolder}
                    />
                  ))}
                </div>

                {/* Bottom See Less Button */}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => {
                      setShowAllTrending(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="h-9 px-5 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] hover:border-[#5865F2] flex items-center space-x-1.5 text-white font-semibold text-xs tracking-wide transition-all cursor-pointer shadow"
                  >
                    <span>See Less</span>
                    <FluxIcon name="chevronUp" size={14} color="#949BA4" />
                  </button>
                </div>
              </div>
            ) : (
              /* 1 ROW HORIZONTALLY SCROLLABLE (Default: 3-4 cards visible) */
              <div
                ref={trendingScrollRef}
                className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar scroll-smooth"
              >
                {trendingList.map((item, idx) => (
                  <div
                    key={idx}
                    className="w-[105px] min-w-[105px] sm:w-[135px] sm:min-w-[135px] md:w-[160px] md:min-w-[160px] shrink-0"
                  >
                    <SearchResultCard
                      item={item}
                      libraryName={state.activeServer === 2 ? 'ICC FTP' : 'Dhaka Flix'}
                      onSelectFolder={handleSelectFolder}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      {removedHistory && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl bg-[#2B2D31] border border-[#4E5058] px-4 py-3 shadow-2xl text-xs">
          <span className="text-white">Removed from Continue Watching</span>
          <button onClick={() => { restoreHistory(removedHistory); setRemovedHistory(null); }} className="font-bold text-[#8EA1FF]">Undo</button>
          <button onClick={() => setRemovedHistory(null)} aria-label="Dismiss" className="text-[#949BA4]">×</button>
        </div>
      )}
    </div>
  );
};
