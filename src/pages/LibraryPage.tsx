import React, { useState, useRef } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { SearchResultCard } from '../components/SearchResultCard';
import { HardDrive, Upload, Search, Trash2 } from 'lucide-react';

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
    <div className="min-h-screen pt-20 pb-24 px-6 md:px-12 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2B2D31] pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <HardDrive className="w-6 h-6 text-[#5865F2]" />
            <h1 className="text-2xl font-black tracking-wide text-white">Library</h1>
          </div>
          <p className="text-xs text-[#949BA4]">
            Offline local media files. Plays directly inside FLUX with zero internet bandwidth.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* File picker */}
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
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-colors cursor-pointer shadow-lg"
          >
            <Upload className="w-4 h-4" />
            <span>Import Video Files</span>
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
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-3 ${
          isDragging
            ? 'border-[#5865F2] bg-[#5865F2]/10 scale-[1.01]'
            : 'border-[#383A40] hover:border-[#4E5058] bg-[#2B2D31]/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`w-8 h-8 ${isDragging ? 'text-[#5865F2]' : 'text-[#80848E]'}`} />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">
            Drag and drop videos here or click to browse
          </p>
          <p className="text-xs text-[#80848E]">
            Supports MKV, MP4, AVI, MOV, WebM (stored directly in your browser)
          </p>
        </div>
      </div>

      {/* Search Library */}
      {state.localMedia.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#80848E]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search local library..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#2B2D31] border border-[#383A40] text-xs text-white focus:outline-none focus:border-[#5865F2]"
          />
        </div>
      )}

      {/* Media Cards Grid */}
      {filteredMedia.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filteredMedia.map((item, idx) => (
            <div key={idx} className="relative group/lib">
              <SearchResultCard item={item} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeLocalMedia(item.playUrl);
                }}
                className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/80 hover:bg-[#F23F43] text-white flex items-center justify-center opacity-0 group-hover/lib:opacity-100 transition-opacity"
                title="Remove from Library"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center space-y-2">
          <HardDrive className="w-12 h-12 text-[#80848E] mx-auto opacity-30" />
          <p className="text-sm text-[#949BA4]">
            {state.localMedia.length === 0
              ? 'Your offline library is empty. Drag and drop any video files above to watch!'
              : 'No matching files in library.'}
          </p>
        </div>
      )}
    </div>
  );
};
