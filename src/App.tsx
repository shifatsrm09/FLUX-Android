import React, { useState, useEffect } from 'react';
import { useFlux } from './stores/useFluxStore';
import { ClassicTitleBar } from './components/ClassicTitleBar';
import { SideNavDrawer } from './components/SideNavDrawer';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { BookmarksView } from './pages/BookmarksView';
import { PlayerView } from './components/PlayerView';
import { SettingsModal } from './components/SettingsModal';
import { DownloadsPanel } from './components/DownloadsPanel';
import { TelepartyModal } from './components/TelepartyModal';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';

export const App: React.FC = () => {
  const { state, setPage } = useFlux();
  const [section, setSection] = useState<'home' | 'search' | 'bookmarks' | 'library'>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [telepartyOpen, setTelepartyOpen] = useState(false);

  const isPlayerActive = state.currentPage === 'player';

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
      if (drawerOpen) {
        setDrawerOpen(false);
        return;
      }
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
      if (telepartyOpen) {
        setTelepartyOpen(false);
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
  }, [isPlayerActive, drawerOpen, settingsOpen, downloadsOpen, telepartyOpen, section]);

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
    <div className="relative min-h-screen bg-[#1E1F22] text-[#F2F3F5] font-sans overflow-x-hidden pb-6">
      {/* Reworked Title Bar: Hamburger (Left), Centered FLUX (Middle), Search (Right) */}
      <ClassicTitleBar
        onOpenDrawer={() => setDrawerOpen(true)}
        onSearchClick={() => setSection(section === 'search' ? 'home' : 'search')}
        isSearchActive={section === 'search'}
        onHomeClick={() => setSection('home')}
        overlayMode={isPlayerActive}
      />

      {/* Side Navigation Window / Drawer */}
      <SideNavDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        section={section}
        onSectionChange={handleSectionChange}
        onOpenTeleparty={() => setTelepartyOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDownloads={() => setDownloadsOpen(true)}
      />

      {/* Main Content Stage */}
      <main className="relative pt-14">
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



      {/* Settings Modal */}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {/* Downloads Panel */}
      {downloadsOpen && <DownloadsPanel onClose={() => setDownloadsOpen(false)} />}

      {/* Teleparty Modal */}
      {telepartyOpen && <TelepartyModal onClose={() => setTelepartyOpen(false)} />}
    </div>
  );
};

export default App;
