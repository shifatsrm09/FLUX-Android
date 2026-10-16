import React, { useState } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { SearchResultCard } from '../components/SearchResultCard';
import { Bookmark, Search } from 'lucide-react';

export const BookmarksView: React.FC = () => {
  const { state } = useFlux();
  const [query, setQuery] = useState('');

  const filteredBookmarks = state.bookmarks.filter((b) =>
    b.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20 pb-24 px-6 md:px-12 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2B2D31] pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <Bookmark className="w-6 h-6 text-[#5865F2] fill-[#5865F2]" />
            <h1 className="text-2xl font-black tracking-wide text-white">Bookmarks</h1>
          </div>
          <p className="text-xs text-[#949BA4]">
            Your saved movies, shows, and directories for fast access.
          </p>
        </div>

        {state.bookmarks.length > 0 && (
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#80848E]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter bookmarks..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#2B2D31] border border-[#383A40] text-xs text-white focus:outline-none focus:border-[#5865F2]"
            />
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredBookmarks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
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
                libraryName: b.libraryName,
                group: b.group,
                posterUrl: b.posterUrl
              }}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-3">
          <Bookmark className="w-12 h-12 text-[#80848E] mx-auto opacity-30" />
          <p className="text-sm text-[#949BA4]">
            {state.bookmarks.length === 0
              ? 'No bookmarks saved yet. Click the bookmark icon on any media card to save it here!'
              : 'No bookmarks match your search.'}
          </p>
        </div>
      )}
    </div>
  );
};
