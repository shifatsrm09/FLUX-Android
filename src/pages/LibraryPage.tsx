import React, { useState, useRef } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { SearchResultCard } from '../components/SearchResultCard';
import { FluxIcon } from '../components/FluxIcon';

export const LibraryPage: React.FC = () => {
  const { state, addLocalFile, removeLocalMedia } = useFlux();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('video/') || /\.(mkv|mp4|avi|mov|webm|ts)$/i.test(file.name)) {
        addLocalFile(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const filteredMedia = state.localMedia.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-16 pb-24 px-4 sm:px-8 md:px-12 max-w-[1400px] mx-auto space-y-8 select-none animate-fadeIn">
      {/* Heading + Library Search matching LibraryPage.qml lines 108-195 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2B2D31] pb-5">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2.5">
            <h1 className="text-[26px] font-bold text-white tracking-[-0.4px]">Library</h1>
          </div>
          <p className="text-xs text-[#949BA4]">
            Everything you've downloaded. Plays without an internet connection.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Library Input Bar */}
          <div className="relative w-64 sm:w-80">
            <div className="relative flex items-center">
              <div className="absolute left-3.5 pointer-events-none">
                <FluxIcon name="search" size={16} color="#80848E" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your library"
                className="w-full pl-10 pr-9 py-2 rounded-full bg-[#313338] border border-[#2B2D31] focus:border-[#5865F2] text-xs text-white placeholder-[#80848E] focus:outline-none transition-all shadow-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xs cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Import Button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,.mkv,.mp4,.avi,.mov,.webm"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 h-9 px-4 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95"
          >
            <span>+ Import</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-2.5 ${
          isDragging
            ? 'border-[#5865F2] bg-[#5865F2]/10 scale-[1.01]'
            : 'border-[#2B2D31] hover:border-[#4E5058] bg-[#313338]/40'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#5865F2]">
          <FluxIcon name="download" size={20} color="#5865F2" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-white">
            Drag and drop videos here or click to browse files
          </p>
          <p className="text-xs text-[#80848E]">
            Offline video playback with MKV, MP4, AVI and WebM support
          </p>
        </div>
      </div>

      {/* Media Cards Grid */}
      {filteredMedia.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredMedia.map((item, idx) => (
            <div key={idx} className="relative group/lib">
              <SearchResultCard
                item={item}
                libraryName="OFFLINE"
                showRemove={true}
                onRemove={() => removeLocalMedia(item.playUrl)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-2">
          <p className="text-sm text-[#949BA4]">
            {state.localMedia.length === 0
              ? 'Your offline library is empty. Import video files or download files to watch offline!'
              : 'No matching files in library.'}
          </p>
        </div>
      )}
    </div>
  );
};
