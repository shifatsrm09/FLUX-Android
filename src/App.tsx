import React, { useState, useEffect } from 'react';
import { useFlux } from './stores/useFluxStore';
import { ClassicTitleBar } from './components/ClassicTitleBar';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { BookmarksView } from './pages/BookmarksView';
import { PlayerView } from './components/PlayerView';
import { SettingsModal } from './components/SettingsModal';
import { DownloadsPanel } from './components/DownloadsPanel';
import {
  Home,
  Search,
  Bookmark,
  Folder,
  Settings,
  Download
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';

export const App: React.FC = () => {
  const { state, setPage } = useFlux();
  const [section, setSection] = useState<'home' | 'search' | 'bookmarks' | 'library'>('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);

  const isPlayerActive = state.currentPage === 'player';
  const activeDownloadsCount = state.downloads.filter((d) => d.status === 'downloading').length;

  const handleSectionChange = (sec: 'home' | 'search' | 'bookmarks' | 'library') => {
    setSection(sec);
    if (state.currentPage === 'player') {
      setPage('search');
    }
  };

  // Hardware Back Button handler for Android
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const backListener = CapApp.addListener('backButton', () => {
      if (isPlayerActive) {
        setPage('search');
        return;
      }
      if (settingsOpen) {
        setSettingsOpen(false);
        return;
      }
      if (downloadsOpen) {
        setDownloadsOpen(false);
        return;
      }
      if (section !== 'home') {
        setSection('home');
        return;
      }
      CapApp.exitApp();
    });

    return () => {
      backListener.then((l) => l.remove());
    };
  }, [isPlayerActive, settingsOpen, downloadsOpen, section]);

  // Status Bar & Orientation Controller
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    if (isPlayerActive) {
      StatusBar.hide().catch(() => {});
      ScreenOrientation.unlock().catch(() => {});
    } else {
      StatusBar.show().catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#1E1F22' }).catch(() => {});
      ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
    }
  }, [isPlayerActive]);

  return (
    <div className="relative min-h-screen bg-[#1E1F22] text-[#F2F3F5] font-sans overflow-x-hidden pb-16 md:pb-0">
      {/* Top Header Bar */}
      <ClassicTitleBar
        section={section}
        onSectionChange={handleSectionChange}
        overlayMode={isPlayerActive}
      />

      {/* Main Content Area */}
      <main className="relative">
        {isPlayerActive ? (
          <PlayerView />
        ) : section === 'library' ? (
          <LibraryPage />
        ) : section === 'bookmarks' ? (
          <BookmarksView />
        ) : (
          <SearchPage initialSearchFocused={section === 'search'} />
        )}
      </main>

      {/* Floating Downloads Button */}
      {!isPlayerActive && (
        <div className="fixed bottom-20 md:bottom-6 right-5 z-40 flex items-center space-x-3 select-none">
          <button
            onClick={() => setDownloadsOpen(!downloadsOpen)}
            className="relative w-12 h-12 rounded-full bg-[#15151A]/95 hover:bg-[#383A40] active:scale-95 border border-[#2B2D31] hover:border-[#4E5058] shadow-2xl flex items-center justify-center text-[#949BA4] hover:text-white transition-all cursor-pointer group"
            title="Downloads"
          >
            <Download className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
            {activeDownloadsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#5865F2] border-2 border-[#1E1F22] text-[10px] font-bold text-white flex items-center justify-center">
                {activeDownloadsCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Android Mobile Bottom Navigation Bar */}
      {!isPlayerActive && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 z-40 bg-[#1E1F22]/95 backdrop-blur-lg border-t border-[#2B2D31] flex items-center justify-around px-2 select-none md:hidden">
          <button
            onClick={() => handleSectionChange('home')}
            className={`flex flex-col items-center justify-center w-14 py-1 space-y-1 transition-colors ${
              section === 'home' ? 'text-[#5865F2]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Home</span>
          </button>

          <button
            onClick={() => handleSectionChange('search')}
            className={`flex flex-col items-center justify-center w-14 py-1 space-y-1 transition-colors ${
              section === 'search' ? 'text-[#5865F2]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Search</span>
          </button>

          <button
            onClick={() => handleSectionChange('bookmarks')}
            className={`flex flex-col items-center justify-center w-14 py-1 space-y-1 transition-colors ${
              section === 'bookmarks' ? 'text-[#5865F2]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
          >
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Saved</span>
          </button>

          <button
            onClick={() => handleSectionChange('library')}
            className={`flex flex-col items-center justify-center w-14 py-1 space-y-1 transition-colors ${
              section === 'library' ? 'text-[#5865F2]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
          >
            <Folder className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Library</span>
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex flex-col items-center justify-center w-14 py-1 space-y-1 text-[#949BA4] hover:text-[#F2F3F5] transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Settings</span>
          </button>
        </nav>
      )}

      {/* Settings Modal */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {/* Downloads Panel */}
      {downloadsOpen && <DownloadsPanel onClose={() => setDownloadsOpen(false)} />}
    </div>
  );
};

export default App;
