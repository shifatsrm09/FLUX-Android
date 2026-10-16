import React, { useState, useEffect, useRef } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { SearchResultCard } from '../components/SearchResultCard';
import { CategoryFilterModal } from '../components/CategoryFilterModal';
import { executeSearch, fetchTrending, fetchFolderItems } from '../services/searchService';
import type { SearchResult } from '../types';
import { Search, SlidersHorizontal, ChevronRight, ArrowLeft } from 'lucide-react';

interface SearchPageProps {
  initialSearchFocused?: boolean;
}

export const SearchPage: React.FC<SearchPageProps> = () => {
  const {
    state,
    getCurrentRoots,
    selectCategory,
    setActiveServer,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    setTrending,
    removeFromHistory
  } = useFlux();

  const roots = getCurrentRoots();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [browsingFolder, setBrowsingFolder] = useState<SearchResult | null>(null);
  const [folderItems, setFolderItems] = useState<SearchResult[]>([]);

  // Load trending media on mount
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
    const items = await fetchFolderItems(
      folder,
      state.settings.proxyMode,
      state.settings.customProxyUrl
    );
    setFolderItems(items);
  };

  const isSearchActive = state.searchQuery.trim().length > 0;
  const continueWatching = state.history.filter((h) => h.progressFraction > 0.02 && h.progressFraction < 0.95);

  return (
    <div className="min-h-screen pt-16 pb-24 px-6 md:px-12 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Folder Browser View */}
      {browsingFolder ? (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 text-sm text-[#949BA4]">
            <button
              onClick={() => setBrowsingFolder(null)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <ChevronRight className="w-4 h-4 text-[#80848E]" />
            <span className="text-white font-semibold line-clamp-1">{browsingFolder.title}</span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-wide">
            {browsingFolder.title}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {folderItems.map((item, idx) => (
              <SearchResultCard key={idx} item={item} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Top Hero: Glowing Search Bar + Server Selector */}
          <div className="relative py-4 flex flex-col items-center space-y-5">
            {/* Ambient Background Glow Orb */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-28 bg-[#5865F2]/20 blur-3xl pointer-events-none rounded-full" />

            {/* Server Switcher Pill */}
            <div className="inline-flex p-1 rounded-2xl bg-[#2B2D31] border border-[#383A40] shadow-lg">
              <button
                onClick={() => setActiveServer(1)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  state.activeServer === 1
                    ? 'bg-[#5865F2] text-white shadow-md'
                    : 'text-[#949BA4] hover:text-white'
                }`}
              >
                Dhaka Flix
              </button>
              <button
                onClick={() => setActiveServer(2)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  state.activeServer === 2
                    ? 'bg-[#5865F2] text-white shadow-md'
                    : 'text-[#949BA4] hover:text-white'
                }`}
              >
                ICC FTP
              </button>
            </div>

            {/* Glowing Search Input Bar */}
            <div className="relative w-full max-w-2xl">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-[#949BA4] pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={state.searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${state.activeServer === 2 ? 'ICC FTP' : 'Dhaka Flix'} media (e.g. Dune, 4K, 1080p, Shogun)...`}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-[#2B2D31]/90 backdrop-blur-md border border-[#383A40] hover:border-[#4E5058] focus:border-[#5865F2] text-sm text-white placeholder-[#80848E] shadow-xl focus:outline-none transition-all"
                />
                {state.searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-[#949BA4] hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills Row */}
            <div className="w-full flex items-center justify-center space-x-2 overflow-x-auto pb-1 max-w-4xl no-scrollbar">
              <button
                onClick={() => selectCategory('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  state.isAllSelected
                    ? 'bg-[#5865F2] text-white shadow'
                    : 'bg-[#2B2D31] text-[#949BA4] hover:text-white hover:bg-[#383A40]'
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
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#5865F2] text-white shadow'
                        : 'bg-[#2B2D31] text-[#949BA4] hover:text-white hover:bg-[#383A40]'
                    }`}
                  >
                    {root.name}
                  </button>
                );
              })}

              <button
                onClick={() => setFilterModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#2B2D31] border border-[#383A40] text-white hover:bg-[#383A40] flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* VIEW: Search Results */}
          {isSearchActive ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#2B2D31] pb-3">
                <h2 className="text-base font-bold text-white tracking-wide">
                  {state.isSearching
                    ? `Searching for "${state.searchQuery}"...`
                    : `${state.searchResults.length} results for "${state.searchQuery}"`}
                </h2>
              </div>

              {state.isSearching ? (
                /* Shimmer Skeletons */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[2/3] rounded-xl bg-[#2B2D31] animate-shimmer"
                    />
                  ))}
                </div>
              ) : state.searchResults.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <p className="text-sm text-[#949BA4]">No matching results found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
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
          ) : (
            /* VIEW: Home (Continue Watching & Trending Shelves) */
            <div className="space-y-10">
              {/* Continue Watching Shelf */}
              {continueWatching.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white tracking-wide">Continue Watching</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                    {continueWatching.map((item) => (
                      <SearchResultCard
                        key={item.url}
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
                        extraInfo={`${Math.round(item.progressFraction * 100)}% watched`}
                        showRemove={true}
                        onRemove={() => removeFromHistory(item.url)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Trending Now Shelf */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-lg font-bold text-white tracking-wide">Trending Now</h2>
                    <p className="text-xs text-[#949BA4]">
                      Popular movies and series currently streaming on {state.activeServer === 2 ? 'ICC FTP' : 'Dhaka Flix'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAllTrending(!showAllTrending)}
                    className="text-xs font-semibold text-[#5865F2] hover:underline cursor-pointer"
                  >
                    {showAllTrending ? 'Show Less' : 'Show All'}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                  {(showAllTrending ? state.trending : state.trending.slice(0, 12)).map((item, idx) => (
                    <SearchResultCard
                      key={idx}
                      item={item}
                      onSelectFolder={handleSelectFolder}
                    />
                  ))}
                </div>
              </section>
            </div>
          )}
        </>
      )}

      {/* Category Filter Multi-Select Modal */}
      {filterModalOpen && <CategoryFilterModal onClose={() => setFilterModalOpen(false)} />}
    </div>
  );
};
