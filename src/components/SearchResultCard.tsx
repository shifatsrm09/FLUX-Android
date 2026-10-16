import React, { useState } from 'react';
import type { SearchResult } from '../types';
import { describe, formatMedia } from '../utils/mediaFormatter';
import { PosterArt } from './PosterArt';
import { useFlux } from '../stores/useFluxStore';
import { Play, Folder, Bookmark, Download, X } from 'lucide-react';

interface SearchResultCardProps {
  item: SearchResult;
  progress?: number; // 0..1
  extraInfo?: string;
  showRemove?: boolean;
  onRemove?: () => void;
  onSelectFolder?: (item: SearchResult) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  item,
  progress = 0,
  extraInfo = '',
  showRemove = false,
  onRemove,
  onSelectFolder,
}) => {
  const { playMedia, toggleBookmark, isBookmarked, addDownload } = useFlux();
  const [hovered, setHovered] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const formatted = formatMedia(item.title, item.isFolder, item.formattedSize);
  const meta = describe(item.title, item.isFolder, item.formattedSize);
  const bookmarked = isBookmarked(item.playUrl);

  const bigText = item.isFolder
    ? ''
    : meta.episode
    ? meta.episode
    : meta.year
    ? meta.year
    : formatted.title.charAt(0).toUpperCase();

  const handleCardClick = () => {
    if (item.isFolder) {
      if (onSelectFolder) onSelectFolder(item);
    } else {
      playMedia(
        item.playUrl,
        formatted.title,
        item.playUrl,
        !!item.localPath,
        undefined,
        item.embedUrl,
        item.trailerUrl,
        item.sources
      );
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(item);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    addDownload(item.playUrl, formatted.title, item.isFolder);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
      className={`relative group rounded-xl cursor-pointer transition-all duration-300 ease-out select-none flex flex-col ${
        hovered ? 'z-20 scale-[1.04]' : 'z-0 scale-100'
      }`}
    >
      {/* Poster Container */}
      <div
        className={`relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#15151A] border transition-colors duration-200 ${
          hovered ? 'border-[#5865F2] shadow-2xl shadow-[#5865F2]/20' : 'border-[#2B2D31]'
        }`}
      >
        {/* Procedural Poster Art or Image */}
        {item.posterUrl && !item.isFolder ? (
          <img
            src={item.posterUrl}
            alt={formatted.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              hovered ? 'scale-105' : 'scale-100'
            }`}
            loading="lazy"
          />
        ) : (
          <PosterArt
            seed={item.title}
            bigText={bigText}
            isFolder={item.isFolder}
            hovered={hovered}
          />
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            {meta.resolution && (
              <span className="px-1.5 py-0.5 rounded bg-black/75 border border-white/20 text-[10px] font-bold tracking-wider text-white">
                {meta.resolution}
              </span>
            )}
            {meta.dualAudio && (
              <span className="px-1.5 py-0.5 rounded bg-[#5865F2]/30 border border-[#5865F2]/60 text-[10px] font-bold text-white">
                DUAL
              </span>
            )}
            {item.isFolder && (
              <span className="px-1.5 py-0.5 rounded bg-[#2B2D31]/80 border border-white/20 text-[10px] font-bold text-white flex items-center space-x-1">
                <Folder className="w-2.5 h-2.5" />
                <span>SERIES</span>
              </span>
            )}
          </div>
        </div>

        {/* Top Right Action Buttons (Bookmark & Remove) */}
        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1 z-20">
          {showRemove && (
            <button
              onClick={handleRemoveClick}
              className="w-7 h-7 rounded-full bg-black/70 hover:bg-[#F23F43] border border-white/20 text-white flex items-center justify-center transition-colors"
              title="Remove from Continue Watching"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleBookmarkClick}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
              bookmarked
                ? 'bg-[#5865F2] border-[#5865F2] text-white shadow-lg'
                : hovered
                ? 'bg-black/70 hover:bg-black/90 border-white/20 text-white'
                : 'opacity-0'
            }`}
            title={bookmarked ? 'Remove Bookmark' : 'Add to Bookmarks'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Center Hover Action Button (Play / Open) */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 z-10 ${
            hovered ? 'opacity-100 bg-black/40' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-13 h-13 rounded-full bg-[#5865F2] text-white flex items-center justify-center shadow-xl shadow-[#5865F2]/50 transform transition-transform hover:scale-110 active:scale-95">
            {item.isFolder ? (
              <Folder className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </div>
        </div>

        {/* Bottom Right Download Button */}
        {hovered && !item.localPath && (
          <button
            onClick={handleDownloadClick}
            className={`absolute bottom-2.5 right-2.5 z-20 w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
              downloadSuccess
                ? 'bg-[#23A55A] border-[#23A55A] text-white'
                : 'bg-black/75 hover:bg-black border-white/20 text-white'
            }`}
            title={item.isFolder ? 'Download Season Pack' : 'Download Video'}
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Progress Bar (Watched Fraction) */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 z-10">
            <div
              className="h-full bg-[#5865F2]"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="mt-2.5 px-1 flex flex-col">
        <h3
          className={`text-sm font-semibold leading-tight line-clamp-1 transition-colors ${
            hovered ? 'text-[#5865F2]' : 'text-[#F2F3F5]'
          }`}
          title={formatted.title}
        >
          {formatted.title}
        </h3>
        <p className="text-[11px] font-medium text-[#949BA4] mt-0.5 line-clamp-1">
          {extraInfo || formatted.subtitle || (item.isFolder ? 'Directory' : item.formattedSize)}
        </p>
      </div>
    </div>
  );
};
