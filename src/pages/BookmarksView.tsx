import React, { useState } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { SearchResultCard } from '../components/SearchResultCard';
import { FluxIcon } from '../components/FluxIcon';

export const BookmarksView: React.FC = () => {
  const { state } = useFlux();
  const [query, setQuery] = useState('');

  const filteredBookmarks = state.bookmarks.filter((b) =>
    b.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-16 pb-24 px-4 sm:px-8 md:px-12 max-w-[1400px] mx-auto space-y-8 select-none animate-fadeIn">
      {/* Heading + Filter matching LibraryPage.qml lines 108-195 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2B2D31] pb-5">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2.5">
            <h1 className="text-[26px] font-bold text-white tracking-[-0.4px]">Bookmarks</h1>
            <span className="w-5 h-5 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-xs leading-none">
              ★
            </span>
          </div>
          <p className="text-xs text-[#949BA4]">
            Saved movies, episodes and folders for instant playback.
          </p>
        </div>

        {state.bookmarks.length > 0 && (
          <div className="relative w-full max-w-xs">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none">
                <FluxIcon name="search" size={16} color="#80848E" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full pl-10 pr-9 py-2 rounded-full bg-[#313338] border border-[#2B2D31] focus:border-[#5865F2] text-xs text-white placeholder-[#80848E] focus:outline-none transition-all shadow-md"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid of Cards */}
      {filteredBookmarks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredBookmarks.map((b) => (
            <SearchResultCard
              key={b.url}
              item={{
                title: b.title,
                formattedSize: '',
                isFolder: b.isFolder,
                playUrl: b.url,
                extension: 'mkv',
                rawHref: b.url,
                libraryName: b.libraryName || 'BOOKMARK',
                group: b.group,
                posterUrl: b.posterUrl
              }}
              libraryName={b.libraryName || 'BOOKMARK'}
            />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#313338] border border-[#2B2D31] flex items-center justify-center text-[#80848E] text-2xl mx-auto shadow-inner">
            ★
          </div>
          <p className="text-sm text-[#949BA4] max-w-sm mx-auto">
            {state.bookmarks.length === 0
              ? 'No bookmarks saved yet. Hover over any movie card and click the star icon to save it here!'
              : 'No bookmarks match your search query.'}
          </p>
        </div>
      )}
    </div>
  );
};
