import React, { useState } from 'react';
import type { SearchResult } from '../types';
import { describe, formatMedia } from '../utils/mediaFormatter';
import { PosterArt } from './PosterArt';
import { Theme, posterTop, posterBottom } from '../theme';
import { useFlux } from '../stores/useFluxStore';

interface SearchResultCardProps {
  item: SearchResult;
  progress?: number; // 0..1
  extraInfo?: string;
  showRemove?: boolean;
  libraryName?: string;
  isPlaying?: boolean;
  onRemove?: () => void;
  onSelectFolder?: (item: SearchResult) => void;
  onDownload?: () => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  item,
  progress = 0,
  extraInfo = '',
  showRemove = false,
  libraryName = '',
  isPlaying = false,
  onRemove,
  onSelectFolder,
  onDownload,
}) => {
  const { playMedia, toggleBookmark, isBookmarked, addDownload } = useFlux();
  const [hovered, setHovered] = useState(false);
  const [dlFlash, setDlFlash] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const formatted = formatMedia(item.title, item.isFolder, item.formattedSize);
  const meta = describe(item.title, item.isFolder, item.formattedSize);
  const bookmarked = isBookmarked(item.playUrl);

  const topColor = posterTop(item.title);
  const bottomColor = posterBottom(item.title);

  // Big outlined text for procedural art
  const bigText = item.isFolder
    ? ''
    : meta.episode
    ? meta.episode.match(/E(\d+)/)
      ? `E${meta.episode.match(/E(\d+)/)![1]}`
      : meta.episode
    : meta.year
    ? meta.year
    : formatted.title.length > 0
    ? formatted.title.charAt(0).toUpperCase()
    : '';

  // Info line matches QML SearchResultCard.qml
  const infoLine = (() => {
    if (item.isFolder) {
      return item.formattedSize && item.formattedSize !== 'Folder' ? item.formattedSize : 'Folder';
    }
    const parts: string[] = [];
    if (extraInfo) parts.push(extraInfo);
    if (meta.episode) parts.push(meta.episode);
    else if (meta.year) parts.push(meta.year);
    if (meta.source) parts.push(meta.source);
    if (meta.codec) parts.push(meta.codec);
    if (item.formattedSize && item.formattedSize !== 'Folder') parts.push(item.formattedSize);
    return parts.join('  ·  ');
  })();

  const effectiveLibraryName = libraryName || item.libraryName || '';

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
    if (onDownload) {
      onDownload();
    } else {
      addDownload(item.playUrl, item.title, item.isFolder);
    }
    setDlFlash(true);
    setTimeout(() => setDlFlash(false), 1600);
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
      className={`relative w-full aspect-[1/1.5] cursor-pointer select-none transition-transform duration-260 ease-out p-[7px] ${
        hovered ? 'z-20' : 'z-0'
      }`}
    >
      {/* Visual Card Container */}
      <div
        className={`relative w-full h-full rounded-[12px] overflow-hidden transition-all duration-260 ease-out border ${
          hovered ? 'scale-[1.045] shadow-2xl' : 'scale-100'
        } ${
          isPlaying
            ? 'border-[#5865F2] ring-1 ring-[#5865F2]'
            : hovered
            ? 'border-white/40 shadow-black/80'
            : 'border-white/10'
        }`}
        style={{
          background: item.isFolder
            ? `linear-gradient(180deg, ${Theme.surfaceHi} 0%, ${Theme.surface} 100%)`
            : `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`
        }}
      >
        {/* Procedural Poster Artwork */}
        <PosterArt
          seed={item.title}
          bigText={bigText}
          isFolder={item.isFolder}
          hovered={hovered}
          className={imgLoaded && item.posterUrl ? 'opacity-0' : 'opacity-100'}
        />

        {/* Real Poster Image (TMDB / ICC Poster) */}
        {item.posterUrl && !item.isFolder && (
          <img
            src={item.posterUrl}
            alt={formatted.title}
            onLoad={() => setImgLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        )}

        {/* Soft Top Gloss Scrim */}
        <div
          className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 100%)'
          }}
        />

        {/* Bottom Scrim for Title Legibility */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[80%] pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.6) 55%, rgba(0, 0, 0, 0.92) 100%)'
          }}
        />

        {/* Top-Left Badges: Bookmark star, Resolution, HDR, Watched */}
        <div className="absolute top-2.5 left-2.5 flex items-center space-x-1.5 z-10 pointer-events-none">
          {bookmarked && (
            <div className="w-[22px] h-[22px] rounded-full bg-[#5865F2] flex items-center justify-center shadow-md">
              <span className="text-white text-xs leading-none">★</span>
            </div>
          )}

          {!item.isFolder && meta.resolution && (
            <div className="h-5 px-1.5 rounded-[5px] bg-black/60 border border-white/20 flex items-center justify-center">
              <span
                className={`text-[10px] font-bold tracking-wider ${
                  meta.resolution === '4K' ? 'text-[#F0B232]' : 'text-white'
                }`}
              >
                {meta.resolution}
              </span>
            </div>
          )}

          {!item.isFolder && meta.hdr && (
            <div className="h-5 px-1.5 rounded-[5px] bg-black/60 border border-white/20 flex items-center justify-center">
              <span className="text-[10px] font-bold tracking-wider text-[#F0B232]">{meta.hdr}</span>
            </div>
          )}

          {!item.isFolder && progress >= 0.9 && (
            <div className="h-5 px-1.5 rounded-[5px] bg-black/60 border border-white/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#23A55A]">✓ WATCHED</span>
            </div>
          )}
        </div>

        {/* Top-Right Badges: Extension, Folder, or Playing equalizer */}
        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-10 pointer-events-none">
          {isPlaying ? (
            <div className="h-[22px] px-2 rounded-full bg-[#5865F2] flex items-center space-x-1.5 shadow-md">
              <div className="flex items-end space-x-0.5 h-3 w-3">
                <span className="w-0.5 bg-white rounded-full animate-eq-1" />
                <span className="w-0.5 bg-white rounded-full animate-eq-2" />
                <span className="w-0.5 bg-white rounded-full animate-eq-3" />
              </div>
              <span className="text-[9px] font-bold tracking-wider text-white">PLAYING</span>
            </div>
          ) : item.isFolder ? (
            <div className="h-5 px-1.5 rounded-[5px] bg-black/60 border border-white/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/80">FOLDER</span>
            </div>
          ) : item.extension ? (
            <div className="h-5 px-1.5 rounded-[5px] bg-black/60 border border-white/20 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/80">{item.extension.toUpperCase()}</span>
            </div>
          ) : null}
        </div>

        {/* Hover Dim Overlay */}
        <div
          className={`absolute inset-0 bg-black transition-opacity duration-200 pointer-events-none ${
            hovered ? 'opacity-30' : 'opacity-0'
          }`}
        />

        {/* Center Hover Action (Play button / Open pill) */}
        <div
          className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-200 ${
            hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}
        >
          {item.isFolder ? (
            <div className="h-[34px] px-4 rounded-full bg-white/95 text-[#1E1F22] flex items-center space-x-1.5 shadow-xl font-bold text-xs tracking-wide">
              <span>Open</span>
              <span className="text-base font-bold leading-none">›</span>
            </div>
          ) : (
            <div className="w-[54px] h-[54px] rounded-full bg-white/95 text-[#1E1F22] flex items-center justify-center shadow-2xl">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1E1F22" className="ml-0.5">
                <path d="M7 4.5 L19.5 12 L7 19.5 Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Hover Top-Right Actions (Remove & Bookmark & Download) */}
        <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5 z-20">
          {showRemove && hovered && (
            <button
              onClick={handleRemoveClick}
              className="w-[26px] h-[26px] rounded-full bg-black/70 hover:bg-[#F23F43] border border-white/25 text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer shadow-lg"
              title="Remove from Continue Watching"
            >
              ×
            </button>
          )}

          {hovered && (
            <button
              onClick={handleBookmarkClick}
              className={`w-[26px] h-[26px] rounded-full border flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                bookmarked
                  ? 'bg-[#5865F2] border-[#5865F2] text-white'
                  : 'bg-black/70 hover:bg-black/90 border-white/25 text-white'
              }`}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark this item'}
            >
              <span className="text-xs leading-none">★</span>
            </button>
          )}

          {hovered && !item.localPath && (
            <button
              onClick={handleDownloadClick}
              className={`w-[26px] h-[26px] rounded-full border flex items-center justify-center text-xs font-bold transition-all cursor-pointer shadow-lg ${
                dlFlash
                  ? 'bg-[#23A55A] border-[#23A55A] text-white'
                  : 'bg-black/70 hover:bg-white hover:text-[#1E1F22] border-white/25 text-white'
              }`}
              title={dlFlash ? 'Added to downloads' : item.isFolder ? 'Download whole folder' : 'Download'}
            >
              {dlFlash ? '✓' : '↓'}
            </button>
          )}
        </div>

        {/* Title Block inside the Card */}
        <div className="absolute left-3.5 right-3.5 bottom-3 flex flex-col space-y-0.5 z-10 pointer-events-none">
          {effectiveLibraryName && (
            <span
              className={`text-[9px] font-bold uppercase tracking-[1.1px] line-clamp-1 ${
                isPlaying ? 'text-[#4752C4]' : 'text-white/70'
              }`}
            >
              {effectiveLibraryName}
            </span>
          )}

          <h3
            className="text-[14px] md:text-[15px] font-semibold text-white leading-tight line-clamp-2 drop-shadow"
            title={formatted.title}
          >
            {formatted.title}
          </h3>

          {infoLine && (
            <p className="text-[11px] text-white/70 font-normal line-clamp-1 drop-shadow pt-0.5">
              {infoLine}
            </p>
          )}
        </div>

        {/* Watch Progress Bar at Bottom of Card */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 z-20">
            <div
              className="h-full bg-[#5865F2]"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
        )}

        {/* Now-playing accent bar */}
        {isPlaying && progress <= 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5865F2] z-20" />
        )}
      </div>
    </div>
  );
};
