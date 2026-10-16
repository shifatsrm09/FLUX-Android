import React, { useState, useEffect, useRef } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { SearchResultCard } from '../components/SearchResultCard';
import { CategoryFilterModal } from '../components/CategoryFilterModal';
import { FluxIcon } from '../components/FluxIcon';
import { TOP_PICKS } from '../data/topPicks';
import { executeSearch, fetchTrending, fetchFolderItems } from '../services/searchService';
import type { SearchResult } from '../types';

interface SearchPageProps {
  isSearchActiveTab?: boolean;
}

export const SearchPage: React.FC<SearchPageProps> = ({ isSearchActiveTab = false }) => {
  const {
    state,
    getCurrentRoots,
    selectCategory,
    setActiveServer,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    setTrending,
    toggleTopPicksFirst,
    removeFromHistory,
  } = useFlux();

  const roots = getCurrentRoots();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const continueScrollRef = useRef<HTMLDivElement>(null);

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [showAllTopPicks, setShowAllTopPicks] = useState(false);
  const [browsingFolder, setBrowsingFolder] = useState<SearchResult | null>(null);
  const [folderItems, setFolderItems] = useState<SearchResult[]>([]);
  const [isFolderLoading, setIsFolderLoading] = useState(false);

  // Focus search input when navigating to Search tab
  useEffect(() => {
    if (isSearchActiveTab && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActiveTab]);

  // Load trending media on mount or when server changes
  useEffect(() => {
    fetchTrending(state.activeServer).then((data) => {
      setTrending(data);
    });
  }, [state.activeServer]);

  // Debounced Search Execution
  useEffect(() => {
    const q = state.searchQuery.trim();
    if (!q) {
      setSearchResults([]);
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
        setSearchResults(results);
      });
    }, 280);

    return () => clearTimeout(timer);
  }, [state.searchQuery, state.activeServer, state.selectedCategoryIds, state.isAllSelected]);

  const handleSelectFolder = async (folder: SearchResult) => {
    setBrowsingFolder(folder);
    setFolderItems([]);
    setIsFolderLoading(true);
    const items = await fetchFolderItems(
      folder,
      state.settings.proxyMode,
      state.settings.customProxyUrl
    );
    setFolderItems(items);
    setIsFolderLoading(false);
  };

  const scrollContinue = (direction: 'left' | 'right') => {
    if (continueScrollRef.current) {
      const scrollAmount = continueScrollRef.current.clientWidth * 0.75;
      continueScrollRef.current.scrollBy({
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

  const isSearching = state.searchQuery.trim().length > 0 || isSearchActiveTab;
  const continueWatching = state.history.filter((h) => !h.isFolder && h.timestampMs > 1000);

  // Trending items count to show
  const trendingList = state.trending || [];
  const displayedTrending = showAllTrending ? trendingList : trendingList.slice(0, 12);

  // Top picks count to show
  const displayedTopPicks = showAllTopPicks ? TOP_PICKS : TOP_PICKS.slice(0, 12);

  return (
    <div className="min-h-screen pt-14 pb-24 px-4 sm:px-8 md:px-12 max-w-[1400px] mx-auto select-none">
      {/* =========================================================================
          VIEW A: Folder Browser View
         ========================================================================= */}
      {browsingFolder ? (
        <div className="space-y-6 pt-2 animate-fadeIn">
          {/* Breadcrumb Header */}
          <div className="flex items-center space-x-3 text-sm text-[#949BA4]">
            <button
              onClick={() => setBrowsingFolder(null)}
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
      ) : isSearching ? (
        /* =========================================================================
           VIEW B: Search Results View (Center Server Pill, Search Bar, Categories)
           ========================================================================= */
        <div className="space-y-6 pt-2 animate-fadeIn">
          {/* 1. Server Selector Pill Centered */}
          <div className="flex justify-center pt-2">
            <div className="inline-flex p-1 rounded-full bg-[#313338] border border-[#2B2D31] shadow-lg">
              <button
                onClick={() => setActiveServer(1)}
                className={`flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  state.activeServer === 1
                    ? 'bg-[#5865F2] text-white shadow-md'
                    : 'text-[#949BA4] hover:text-white'
                }`}
              >
                {state.activeServer === 1 && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                <span>Server 1 (Dhaka Flix)</span>
              </button>

              <button
                onClick={() => setActiveServer(2)}
                className={`flex items-center space-x-2 px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  state.activeServer === 2
                    ? 'bg-[#5865F2] text-white shadow-md'
                    : 'text-[#949BA4] hover:text-white'
                }`}
              >
                {state.activeServer === 2 && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                <span>Server 2 (ICC FTP)</span>
              </button>
            </div>
          </div>

          {/* 2. Compact Search Input Bar Centered */}
          <div className="flex justify-center">
            <div className="relative w-full max-w-lg">
              <div className="relative flex items-center">
                <div className="absolute left-4 pointer-events-none">
                  <FluxIcon name="search" size={18} color="#80848E" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={state.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${state.activeServer === 2 ? 'ICC FTP' : 'Dhaka Flix'} media...`}
                  className="w-full pl-11 pr-11 py-3 rounded-full bg-[#313338] border border-[#2B2D31] focus:border-[#5865F2] text-sm text-white placeholder-[#80848E] shadow-xl focus:outline-none transition-all"
                />
                {state.searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Category Checkpoints Row */}
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-1 max-w-4xl mx-auto no-scrollbar">
            <button
              onClick={() => selectCategory('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                state.isAllSelected
                  ? 'bg-[#5865F2] text-white shadow'
                  : 'bg-[#313338] text-[#949BA4] hover:text-white hover:bg-[#383A40]'
              }`}
            >
              All Categories
            </button>

            {roots.slice(0, 6).map((root) => {
              const isSelected = !state.isAllSelected && state.selectedCategoryIds.includes(root.id);
              return (
                <button
                  key={root.id}
                  onClick={() => selectCategory(root.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#5865F2] text-white shadow'
                      : 'bg-[#313338] text-[#949BA4] hover:text-white hover:bg-[#383A40]'
                  }`}
                >
                  {root.name}
                </button>
              );
            })}

            <button
              onClick={() => setFilterModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#313338] border border-[#2B2D31] text-white hover:bg-[#383A40] flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <span>Filters</span>
            </button>
          </div>

          {/* 4. Results Header & Grid */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-[#2B2D31] pb-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                {state.isSearching
                  ? `Searching for "${state.searchQuery}"...`
                  : `${state.searchResults.length} results found`}
              </h2>
            </div>

            {state.isSearching ? (
              /* Shimmer Skeletons */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="aspect-[1/1.5] rounded-xl bg-[#313338] animate-shimmer" />
                ))}
              </div>
            ) : state.searchResults.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <p className="text-sm text-[#949BA4]">
                  {state.searchQuery ? 'No matching results found.' : 'Type above to search.'}
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
        </div>
      ) : (
        /* =========================================================================
           VIEW C: Home (Continue Watching, Trending Right Now, Top Picks)
           ========================================================================= */
        <div className="space-y-12 pt-2 animate-fadeIn">
          {/* ---- SECTION 1: Continue Watching ---- */}
          {continueWatching.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] font-bold text-white tracking-[-0.3px]">
                  Continue Watching
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => scrollContinue('left')}
                    className="w-9 h-9 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] flex items-center justify-center text-white transition-colors cursor-pointer"
                    title="Scroll left"
                  >
                    <FluxIcon name="chevronLeft" size={18} color="#FFFFFF" />
                  </button>
                  <button
                    onClick={() => scrollContinue('right')}
                    className="w-9 h-9 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] flex items-center justify-center text-white transition-colors cursor-pointer"
                    title="Scroll right"
                  >
                    <FluxIcon name="chevronRight" size={18} color="#FFFFFF" />
                  </button>
                </div>
              </div>

              {/* Horizontal Slider */}
              <div
                ref={continueScrollRef}
                className="flex space-x-3.5 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
              >
                {continueWatching.map((item) => (
                  <div key={item.url} className="w-[172px] shrink-0">
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
                        posterUrl: item.posterUrl
                      }}
                      progress={item.progressFraction}
                      extraInfo={watchedTimeLabel(item.timestampMs)}
                      showRemove={true}
                      onRemove={() => removeFromHistory(item.url)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Render Sections in Order based on state.topPicksFirst */}
          {state.topPicksFirst ? (
            <>
              {/* TOP PICKS FIRST */}
              <TopPicksShelf
                displayedTopPicks={displayedTopPicks}
                showAllTopPicks={showAllTopPicks}
                setShowAllTopPicks={setShowAllTopPicks}
                onSwap={toggleTopPicksFirst}
                activeServer={state.activeServer}
              />
              <TrendingShelf
                trendingList={trendingList}
                displayedTrending={displayedTrending}
                showAllTrending={showAllTrending}
                setShowAllTrending={setShowAllTrending}
                onSwap={toggleTopPicksFirst}
                isLoading={state.isTrendingLoading}
                onSelectFolder={handleSelectFolder}
              />
            </>
          ) : (
            <>
              {/* TRENDING FIRST */}
              <TrendingShelf
                trendingList={trendingList}
                displayedTrending={displayedTrending}
                showAllTrending={showAllTrending}
                setShowAllTrending={setShowAllTrending}
                onSwap={toggleTopPicksFirst}
                isLoading={state.isTrendingLoading}
                onSelectFolder={handleSelectFolder}
              />
              <TopPicksShelf
                displayedTopPicks={displayedTopPicks}
                showAllTopPicks={showAllTopPicks}
                setShowAllTopPicks={setShowAllTopPicks}
                onSwap={toggleTopPicksFirst}
                activeServer={state.activeServer}
              />
            </>
          )}
        </div>
      )}

      {/* Category Multi-Select Modal */}
      {filterModalOpen && <CategoryFilterModal onClose={() => setFilterModalOpen(false)} />}
    </div>
  );
};

// =========================================================================
// Helper Shelf: Trending Right Now
// =========================================================================
interface TrendingShelfProps {
  trendingList: SearchResult[];
  displayedTrending: SearchResult[];
  showAllTrending: boolean;
  setShowAllTrending: (val: boolean) => void;
  onSwap: () => void;
  isLoading: boolean;
  onSelectFolder: (item: SearchResult) => void;
}

const TrendingShelf: React.FC<TrendingShelfProps> = ({
  trendingList,
  displayedTrending,
  showAllTrending,
  setShowAllTrending,
  onSwap,
  isLoading,
  onSelectFolder,
}) => {
  return (
    <section className="space-y-4">
      {/* Header Row matching SearchPage.qml lines 300-369 */}
      <div className="flex items-center space-x-3">
        <h2 className="text-[22px] font-bold text-white tracking-[-0.3px]">Trending Right Now</h2>

        {/* Accent Soft Pill Badge */}
        <div className="h-5 px-2 rounded-full bg-[#5865F2]/15 border border-[#5865F2]/50 flex items-center justify-center">
          <span className="text-[11px] font-bold text-[#5865F2]">ICC FTP</span>
        </div>

        <div className="grow" />

        {/* Item Counter */}
        <span className="text-xs text-[#949BA4]">
          {showAllTrending
            ? `Showing all ${trendingList.length}`
            : `Top ${Math.min(trendingList.length, 12)}`}
        </span>

        {/* Swap Button */}
        <button
          onClick={onSwap}
          className="w-[30px] h-[30px] rounded-lg bg-transparent hover:bg-[#383A40] border border-transparent hover:border-[#2B2D31] flex items-center justify-center transition-colors cursor-pointer"
          title="Swap section order"
        >
          <FluxIcon name="swap" size={16} color="#949BA4" />
        </button>
      </div>

      {/* Grid of Cards */}
      {isLoading && trendingList.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-[1/1.5] rounded-xl bg-[#313338] animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {displayedTrending.map((item, idx) => (
            <SearchResultCard
              key={idx}
              item={item}
              libraryName="ICC FTP"
              onSelectFolder={onSelectFolder}
            />
          ))}
        </div>
      )}

      {/* "Show More" / "Show Less" Button matching QML lines 454-495 */}
      {trendingList.length > 12 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAllTrending(!showAllTrending)}
            className="h-10 px-6 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] hover:border-[#5865F2] flex items-center space-x-2 text-white font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-lg"
          >
            <span>{showAllTrending ? 'Show Less' : 'Show More'}</span>
            <FluxIcon
              name={showAllTrending ? 'chevronUp' : 'chevronDown'}
              size={14}
              color="#949BA4"
            />
          </button>
        </div>
      )}
    </section>
  );
};

// =========================================================================
// Helper Shelf: Top Picks (25 Curated Masterpieces)
// =========================================================================
interface TopPicksShelfProps {
  displayedTopPicks: typeof TOP_PICKS;
  showAllTopPicks: boolean;
  setShowAllTopPicks: (val: boolean) => void;
  onSwap: () => void;
  activeServer: 1 | 2;
}

const TopPicksShelf: React.FC<TopPicksShelfProps> = ({
  displayedTopPicks,
  showAllTopPicks,
  setShowAllTopPicks,
  onSwap,
  activeServer,
}) => {
  return (
    <section className="space-y-4">
      {/* Header Row matching SearchPage.qml lines 727-804 */}
      <div className="flex items-center space-x-3">
        <h2 className="text-[22px] font-bold text-white tracking-[-0.3px]">Top Picks</h2>

        {/* Server Pill Badge */}
        <div className="h-5 px-2 rounded-full bg-[#5865F2]/15 border border-[#5865F2]/50 flex items-center justify-center">
          <span className="text-[11px] font-bold text-[#5865F2]">
            {activeServer === 2 ? 'ICC FTP' : 'Dhaka Flix'}
          </span>
        </div>

        <div className="grow" />

        {/* Item Counter */}
        <span className="text-xs text-[#949BA4]">
          {showAllTopPicks
            ? `Showing all ${TOP_PICKS.length}`
            : `Top ${Math.min(TOP_PICKS.length, 12)} of ${TOP_PICKS.length}`}
        </span>

        {/* Swap Button */}
        <button
          onClick={onSwap}
          className="w-[30px] h-[30px] rounded-lg bg-transparent hover:bg-[#383A40] border border-transparent hover:border-[#2B2D31] flex items-center justify-center transition-colors cursor-pointer"
          title="Swap section order"
        >
          <FluxIcon name="swap" size={16} color="#949BA4" />
        </button>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
        {displayedTopPicks.map((pick, idx) => {
          const preferIcc = activeServer === 2 && Boolean(pick.altUrl);
          const effectiveUrl = preferIcc ? pick.altUrl : pick.url;

          return (
            <SearchResultCard
              key={idx}
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
          );
        })}
      </div>

      {/* "Show More" / "Show Less" Button matching QML lines 873-917 */}
      {TOP_PICKS.length > 12 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAllTopPicks(!showAllTopPicks)}
            className="h-10 px-6 rounded-full bg-[#313338] hover:bg-[#383A40] border border-[#2B2D31] hover:border-[#5865F2] flex items-center space-x-2 text-white font-semibold text-xs tracking-wide transition-all cursor-pointer shadow-lg"
          >
            <span>
              {showAllTopPicks
                ? 'Show Less'
                : `Show More (${TOP_PICKS.length - 12} more)`}
            </span>
            <FluxIcon
              name={showAllTopPicks ? 'chevronUp' : 'chevronDown'}
              size={14}
              color="#949BA4"
            />
          </button>
        </div>
      )}
    </section>
  );
};
