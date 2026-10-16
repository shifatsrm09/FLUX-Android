import React, { useState, useEffect } from 'react';
import { useFlux } from './stores/useFluxStore';
import { ClassicTitleBar } from './components/ClassicTitleBar';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { BookmarksView } from './pages/BookmarksView';
import { PlayerView } from './components/PlayerView';
import { SettingsModal } from './components/SettingsModal';
import { DownloadsPanel } from './components/DownloadsPanel';
import { FluxIcon } from './components/FluxIcon';
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
  const hasInterruptedDownloads = state.downloads.some((d) => d.status === 'error');

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
      {/* Top Header Bar matching ClassicTitleBar.qml */}
      <ClassicTitleBar
        section={section}
        onSectionChange={handleSectionChange}
        overlayMode={isPlayerActive}
      />

      {/* Main Content Stage */}
      <main className="relative">
        {isPlayerActive ? (
          <PlayerView />
        ) : section === 'library' ? (
          <LibraryPage />
        ) : section === 'bookmarks' ? (
          <BookmarksView />
        ) : (
          <SearchPage isSearchActiveTab={section === 'search'} />
        )}
      </main>

      {/* Bottom-Right Floating Dock: Downloads + Settings matching Main.qml lines 660-689 */}
      {!isPlayerActive && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-40 hidden sm:flex items-center space-x-2.5 select-none">
          {/* Downloads Dock Button */}
          <button
            onClick={() => setDownloadsOpen(!downloadsOpen)}
            className={`relative w-12 h-12 rounded-full border shadow-2xl flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
              downloadsOpen
                ? 'bg-[#383A40] border-[#4E5058]'
                : 'bg-[#15151A]/95 hover:bg-[#383A40] border-[#2B2D31] hover:border-[#4E5058]'
            }`}
            title="Downloads"
          >
            <FluxIcon
              name="download"
              size={22}
              color={downloadsOpen ? '#FFFFFF' : '#949BA4'}
              className="group-hover:text-white transition-colors"
            />

            {/* Red attention dot if interrupted */}
            {hasInterruptedDownloads && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#FF4D5E] border border-[#1E1F22]" />
            )}

            {/* Active downloads count badge */}
            {activeDownloadsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#5865F2] border-2 border-[#1E1F22] text-[10px] font-bold text-white flex items-center justify-center">
                {activeDownloadsCount}
              </span>
            )}
          </button>

          {/* Settings Dock Button */}
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={`relative w-12 h-12 rounded-full border shadow-2xl flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
              settingsOpen
                ? 'bg-[#383A40] border-[#4E5058]'
                : 'bg-[#15151A]/95 hover:bg-[#383A40] border-[#2B2D31] hover:border-[#4E5058]'
            }`}
            title="Settings"
          >
            <div className="transition-transform duration-300 ease-out group-hover:rotate-30">
              <FluxIcon
                name="settings"
                size={22}
                color={settingsOpen ? '#FFFFFF' : '#949BA4'}
                className="group-hover:text-white transition-colors"
              />
            </div>
          </button>
        </div>
      )}

      {/* Android Mobile Bottom Navigation Bar (Optimized for One-Hand Phone Usage) */}
      {!isPlayerActive && (
        <nav className="fixed bottom-0 left-0 right-0 h-16 z-40 bg-[#1E1F22]/95 backdrop-blur-lg border-t border-[#2B2D31] flex items-center justify-around px-2 select-none sm:hidden">
          <button
            onClick={() => handleSectionChange('home')}
            className={`flex flex-col items-center justify-center w-14 py-1 space-y-1 transition-colors cursor-pointer ${
              section === 'home' ? 'text-[#5865F2]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
          >
            <FluxIcon name="home" size={20} color={section === 'home' ? '#5865F2' : '#949BA4'} />
            <span className="text-[10px] font-medium tracking-tight">Home</span>
          </button>

          <button
            onClick={() => handleSectionChange('search')}
            className={`flex flex-col items-center justify-center w-14 py-1 space-y-1 transition-colors cursor-pointer ${
              section === 'search' ? 'text-[#5865F2]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
          >
            <FluxIcon name="search" size={20} color={section === 'search' ? '#5865F2' : '#949BA4'} />
            <span className="text-[10px] font-medium tracking-tight">Search</span>
          </button>

          <button
            onClick={() => handleSectionChange('bookmarks')}
            className={`flex flex-col items-center justify-center w-14 py-1 space-y-1 transition-colors cursor-pointer ${
              section === 'bookmarks' ? 'text-[#5865F2]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
          >
            <span className="text-lg leading-none font-bold">★</span>
            <span className="text-[10px] font-medium tracking-tight">Saved</span>
          </button>

          <button
            onClick={() => handleSectionChange('library')}
            className={`flex flex-col items-center justify-center w-14 py-1 space-y-1 transition-colors cursor-pointer ${
              section === 'library' ? 'text-[#5865F2]' : 'text-[#949BA4] hover:text-[#F2F3F5]'
            }`}
          >
            <FluxIcon name="folder" size={20} color={section === 'library' ? '#5865F2' : '#949BA4'} />
            <span className="text-[10px] font-medium tracking-tight">Library</span>
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="flex flex-col items-center justify-center w-14 py-1 space-y-1 text-[#949BA4] hover:text-[#F2F3F5] transition-colors cursor-pointer"
          >
            <FluxIcon name="settings" size={20} color="#949BA4" />
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
