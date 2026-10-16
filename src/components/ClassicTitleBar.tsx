import React from 'react';
import { Menu, Search } from 'lucide-react';

interface ClassicTitleBarProps {
  onOpenDrawer: () => void;
  onSearchClick: () => void;
  isSearchActive?: boolean;
  overlayMode?: boolean;
  onHomeClick?: () => void;
}

export const ClassicTitleBar: React.FC<ClassicTitleBarProps> = ({
  onOpenDrawer,
  onSearchClick,
  isSearchActive = false,
  overlayMode = false,
  onHomeClick
}) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 h-14 z-40 flex items-center justify-between px-4 sm:px-6 select-none transition-all duration-200 ${
        overlayMode
          ? 'opacity-0 pointer-events-none'
          : 'bg-[#1E1F22]/95 backdrop-blur-md border-b border-[#2B2D31]'
      }`}
    >
      {/* Left: Hamburger Icon */}
      <button
        onClick={onOpenDrawer}
        className="w-10 h-10 rounded-full hover:bg-white/10 active:bg-white/20 text-[#DBDEE1] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        title="Open Navigation Menu"
        aria-label="Open Navigation Menu"
      >
        <Menu className="w-6 h-6 stroke-[2.2]" />
      </button>

      {/* Middle: FLUX Text Centered */}
      <div
        onClick={onHomeClick}
        className="flex items-center justify-center cursor-pointer select-none group"
        title="FLUX Home"
      >
        <span className="text-2xl font-black tracking-[4px] text-white group-hover:text-[#5865F2] transition-colors leading-none">
          FLUX
        </span>
      </div>

      {/* Right: Only Search Icon */}
      <button
        onClick={onSearchClick}
        className={`w-10 h-10 rounded-full hover:bg-white/10 active:bg-white/20 flex items-center justify-center transition-colors cursor-pointer ${
          isSearchActive
            ? 'text-[#5865F2] bg-white/5'
            : 'text-[#DBDEE1] hover:text-white'
        }`}
        title="Search Movies & TV Shows"
        aria-label="Search"
      >
        <Search className="w-5 h-5 stroke-[2.2]" />
      </button>
    </header>
  );
};
