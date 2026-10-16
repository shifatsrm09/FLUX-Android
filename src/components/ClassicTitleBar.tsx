import React, { useState } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { FluxIcon } from './FluxIcon';
import { TelepartyModal } from './TelepartyModal';

interface ClassicTitleBarProps {
  section: 'home' | 'search' | 'bookmarks' | 'library';
  onSectionChange: (section: 'home' | 'search' | 'bookmarks' | 'library') => void;
  overlayMode?: boolean;
}

export const ClassicTitleBar: React.FC<ClassicTitleBarProps> = ({
  section,
  onSectionChange,
  overlayMode = false,
}) => {
  const { state, setPage } = useFlux();
  const [telepartyOpen, setTelepartyOpen] = useState(false);

  const isPlaying = !!state.currentPlaying;
  const inTeleparty = state.teleparty.state === 'joined';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 h-12 z-40 flex items-center justify-between px-4 sm:px-8 select-none transition-all duration-240 ${
          overlayMode
            ? 'opacity-0 pointer-events-none'
            : 'bg-[#1E1F22]/95 backdrop-blur-md border-b border-[#2B2D31]'
        }`}
      >
        {/* Left: Brand + Nav */}
        <div className="flex items-center space-x-6 sm:space-x-8">
          {/* FLUX Wordmark matching QML lines 175-204 */}
          <div
            onClick={() => onSectionChange('home')}
            className="flex items-center cursor-pointer group"
            title="Return to Home Page"
          >
            <span className="text-[26px] font-black tracking-[4px] text-white group-hover:text-[#5865F2] transition-colors leading-none">
              FLUX
            </span>
          </div>

          {/* Nav Links matching QML lines 207-285 */}
          <nav className="flex items-center space-x-6">
            {/* Home */}
            <button
              onClick={() => onSectionChange('home')}
              className={`relative py-3 text-sm font-semibold transition-colors cursor-pointer ${
                section === 'home' ? 'text-[#F2F3F5] font-bold' : 'text-[#949BA4] hover:text-[#F2F3F5]'
              }`}
            >
              <span>Home</span>
              {section === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5865F2] rounded-full" />
              )}
            </button>

            {/* Search with icon */}
            <button
              onClick={() => onSectionChange('search')}
              className={`relative py-3 flex items-center space-x-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                section === 'search' ? 'text-[#F2F3F5] font-bold' : 'text-[#949BA4] hover:text-[#F2F3F5]'
              }`}
              title="Search & Categories"
            >
              <FluxIcon
                name="search"
                size={15}
                color={section === 'search' ? '#F2F3F5' : '#949BA4'}
              />
              <span>Search</span>
              {section === 'search' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5865F2] rounded-full" />
              )}
            </button>

            {/* Bookmarks */}
            <button
              onClick={() => onSectionChange('bookmarks')}
              className={`relative py-3 text-sm font-semibold transition-colors cursor-pointer ${
                section === 'bookmarks' ? 'text-[#F2F3F5] font-bold' : 'text-[#949BA4] hover:text-[#F2F3F5]'
              }`}
            >
              <span>Bookmarks</span>
              {section === 'bookmarks' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5865F2] rounded-full" />
              )}
            </button>

            {/* Library */}
            <button
              onClick={() => {
                if (!inTeleparty) onSectionChange('library');
              }}
              disabled={inTeleparty}
              title={inTeleparty ? 'Leave Teleparty to access library' : 'Offline Library'}
              className={`relative py-3 text-sm font-semibold transition-colors cursor-pointer ${
                inTeleparty
                  ? 'opacity-40 cursor-not-allowed text-[#80848E]'
                  : section === 'library'
                  ? 'text-[#F2F3F5] font-bold'
                  : 'text-[#949BA4] hover:text-[#F2F3F5]'
              }`}
            >
              <span>Library</span>
              {section === 'library' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#5865F2] rounded-full" />
              )}
            </button>
          </nav>
        </div>

        {/* Right: Now Playing & Teleparty matching QML lines 289-400 */}
        <div className="flex items-center space-x-2.5">
          {/* Now Playing Pill */}
          {isPlaying && state.currentPage !== 'player' && (
            <button
              onClick={() => setPage('player')}
              className="flex items-center space-x-1.5 h-6 px-3 rounded-full bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/50 text-white text-[11px] font-semibold transition-all cursor-pointer shadow-md"
            >
              <div className="flex items-end space-x-0.5 h-3 w-3">
                <span className="w-0.5 bg-[#5865F2] rounded-full animate-eq-1" />
                <span className="w-0.5 bg-[#5865F2] rounded-full animate-eq-2" />
                <span className="w-0.5 bg-[#5865F2] rounded-full animate-eq-3" />
              </div>
              <span>Now Playing</span>
            </button>
          )}

          {/* Teleparty Button */}
          <button
            onClick={() => setTelepartyOpen(!telepartyOpen)}
            className={`flex items-center space-x-1.5 h-6 px-3 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
              state.teleparty.state === 'joined'
                ? 'bg-[#23A55A]/20 border-[#23A55A]/50 text-white hover:bg-[#23A55A]/30'
                : state.teleparty.state === 'connecting'
                ? 'bg-[#F0B232]/20 border-[#F0B232]/50 text-white'
                : 'bg-white/10 hover:bg-white/20 border-white/10 text-[#F2F3F5]'
            }`}
          >
            {state.teleparty.state !== 'idle' && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  state.teleparty.state === 'joined' ? 'bg-[#23A55A]' : 'bg-[#F0B232]'
                }`}
              />
            )}
            <span>{state.teleparty.statusText}</span>
          </button>
        </div>
      </header>

      {/* Teleparty dropdown modal */}
      {telepartyOpen && <TelepartyModal onClose={() => setTelepartyOpen(false)} />}
    </>
  );
};
