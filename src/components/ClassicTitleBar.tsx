import React, { useState } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { Search } from 'lucide-react';
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
        className={`fixed top-0 left-0 right-0 h-12 z-40 flex items-center justify-between px-6 select-none transition-colors duration-200 ${
          overlayMode
            ? 'bg-transparent pointer-events-none'
            : 'bg-[#1E1F22]/90 backdrop-blur-md border-b border-[#2B2D31]'
        }`}
      >
        {/* Left: Brand + Nav */}
        <div className={`flex items-center space-x-7 ${overlayMode ? 'opacity-0' : 'opacity-100'} pointer-events-auto`}>
          {/* Logo */}
          <div
            onClick={() => onSectionChange('home')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <img src="./flux.ico" alt="FLUX" className="w-6 h-6 object-contain" />
            <span className="text-xl font-black tracking-widest text-white group-hover:text-[#5865F2] transition-colors">
              FLUX
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex items-center space-x-6">
            <button
              onClick={() => onSectionChange('home')}
              className={`relative py-3 text-sm font-semibold transition-colors cursor-pointer ${
                section === 'home' ? 'text-white' : 'text-[#949BA4] hover:text-[#F2F3F5]'
              }`}
            >
              Home
              {section === 'home' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865F2] rounded-full" />
              )}
            </button>

            <button
              onClick={() => onSectionChange('search')}
              className={`relative py-3 flex items-center space-x-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                section === 'search' ? 'text-white' : 'text-[#949BA4] hover:text-[#F2F3F5]'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              {section === 'search' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865F2] rounded-full" />
              )}
            </button>

            <button
              onClick={() => onSectionChange('bookmarks')}
              className={`relative py-3 text-sm font-semibold transition-colors cursor-pointer ${
                section === 'bookmarks' ? 'text-white' : 'text-[#949BA4] hover:text-[#F2F3F5]'
              }`}
            >
              Bookmarks
              {section === 'bookmarks' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865F2] rounded-full" />
              )}
            </button>

            <button
              onClick={() => {
                if (!inTeleparty) {
                  onSectionChange('library');
                }
              }}
              title={inTeleparty ? 'Leave Teleparty to access library' : 'Offline Library'}
              disabled={inTeleparty}
              className={`relative py-3 text-sm font-semibold transition-colors cursor-pointer ${
                inTeleparty
                  ? 'opacity-40 cursor-not-allowed text-[#80848E]'
                  : section === 'library'
                  ? 'text-white'
                  : 'text-[#949BA4] hover:text-[#F2F3F5]'
              }`}
            >
              Library
              {section === 'library' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5865F2] rounded-full" />
              )}
            </button>
          </nav>
        </div>

        {/* Right: Now Playing + Teleparty */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          {/* Now Playing pill */}
          {isPlaying && state.currentPage !== 'player' && (
            <button
              onClick={() => setPage('player')}
              className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#5865F2]/20 hover:bg-[#5865F2]/30 border border-[#5865F2]/50 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <div className="flex items-end space-x-0.5 h-3.5 w-3.5">
                <span className="w-1 bg-[#5865F2] rounded-full animate-eq-1" />
                <span className="w-1 bg-[#5865F2] rounded-full animate-eq-2" />
                <span className="w-1 bg-[#5865F2] rounded-full animate-eq-3" />
              </div>
              <span>Now Playing</span>
            </button>
          )}

          {/* Teleparty Button */}
          <button
            onClick={() => setTelepartyOpen(!telepartyOpen)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              state.teleparty.state === 'joined'
                ? 'bg-[#23A55A]/20 border-[#23A55A]/50 text-white hover:bg-[#23A55A]/30'
                : state.teleparty.state === 'connecting'
                ? 'bg-[#F0B232]/20 border-[#F0B232]/50 text-white'
                : 'bg-white/10 hover:bg-white/20 border-white/10 text-[#F2F3F5]'
            }`}
          >
            {state.teleparty.state !== 'idle' && (
              <span
                className={`w-2 h-2 rounded-full ${
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
