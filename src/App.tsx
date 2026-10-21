import React, { useState, useEffect, Suspense } from 'react';
import { useFlux } from './stores/useFluxStore';
import { ClassicTitleBar } from './components/ClassicTitleBar';
import { SideNavDrawer } from './components/SideNavDrawer';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { BookmarksView } from './pages/BookmarksView';
import { FirstLaunchModal } from './components/FirstLaunchModal';
import { DownloadLocationModal } from './components/DownloadLocationModal';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';

const PlayerView = React.lazy(() => import('./components/PlayerView').then((m) => ({ default: m.PlayerView })));
const SettingsModal = React.lazy(() => import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal })));
const DownloadsPanel = React.lazy(() => import('./components/DownloadsPanel').then((m) => ({ default: m.DownloadsPanel })));
const TelepartyModal = React.lazy(() => import('./components/TelepartyModal').then((m) => ({ default: m.TelepartyModal })));

export const App: React.FC = () => {
  const { state, setPage, setSearchQuery, setSearchResults, setBrowsingFolder, setPlayQueue } = useFlux();
  const [section, setSection] = useState<'home' | 'search' | 'bookmarks' | 'library'>('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [telepartyOpen, setTelepartyOpen] = useState(false);
  const [howToUseOpen, setHowToUseOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(() => localStorage.getItem('flux_onboarding_seen_v1') !== '1');

  const closeWelcome = () => {
    localStorage.setItem('flux_onboarding_seen_v1', '1');
    setWelcomeOpen(false);
  };

  const isPlayerActive = state.currentPage === 'player';

  const handleHomeClick = () => {
    setSection('home');
    setDrawerOpen(false);
    setSettingsOpen(false);
    setDownloadsOpen(false);
    setTelepartyOpen(false);
    setHowToUseOpen(false);
    // Home is the dashboard, not the search-results view. Clear the query so
    // SearchPage cannot remain in search mode after changing sections.
    setSearchQuery('');
    setSearchResults([]);
    setBrowsingFolder(null);
    setPlayQueue([]);
    if (state.currentPage === 'player') {
      setPage('search');
    }
  };

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
      if (welcomeOpen) {
        closeWelcome();
        return;
      }
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
  }, [isPlayerActive, drawerOpen, settingsOpen, downloadsOpen, telepartyOpen, section, welcomeOpen]);

  // Status Bar & Orientation Controller
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    if (isPlayerActive) {
      StatusBar.hide().catch(() => {});
      ScreenOrientation.unlock().catch(() => {});
    } else {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      StatusBar.show().catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#1E1F22' }).catch(() => {});
      ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
    }
  }, [isPlayerActive]);

  // App resume handler to restore Status Bar after returning from native VLC player
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const resumeListener = CapApp.addListener('resume', () => {
      if (state.currentPage !== 'player') {
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
        StatusBar.show().catch(() => {});
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        StatusBar.setBackgroundColor({ color: '#1E1F22' }).catch(() => {});
        ScreenOrientation.lock({ orientation: 'portrait' }).catch(() => {});
      }
    });

    return () => {
      resumeListener.then((l) => l.remove());
    };
  }, [state.currentPage]);

  return (
    <div className="relative min-h-screen bg-[#1E1F22] text-[#F2F3F5] font-sans overflow-x-hidden pb-6">
      {/* Reworked Title Bar: Hamburger (Left), Centered FLUX (Middle), Search (Right) */}
      <ClassicTitleBar
        onOpenDrawer={() => setDrawerOpen(true)}
        onSearchClick={() => setSection(section === 'search' ? 'home' : 'search')}
        isSearchActive={section === 'search'}
        onHomeClick={handleHomeClick}
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
        onOpenHowToUse={() => setHowToUseOpen(true)}
      />

      {/* Main Content Stage */}
      <main
        className="relative"
        style={{
          paddingTop: isPlayerActive ? 0 : 'calc(3.5rem + env(safe-area-inset-top, 0px))'
        }}
      >
        {isPlayerActive ? (
          <Suspense fallback={<div className="fixed inset-0 z-50 bg-black flex items-center justify-center text-[#949BA4]">Starting player…</div>}><PlayerView /></Suspense>
        ) : section === 'library' ? (
          <LibraryPage />
        ) : section === 'bookmarks' ? (
          <BookmarksView />
        ) : (
          <SearchPage isSearchActiveTab={section === 'search'} />
        )}
      </main>



      {/* Settings Modal */}
      {settingsOpen && <Suspense fallback={null}><SettingsModal onClose={() => setSettingsOpen(false)} /></Suspense>}

      {/* Downloads Panel */}
      {downloadsOpen && <Suspense fallback={null}><DownloadsPanel onClose={() => setDownloadsOpen(false)} /></Suspense>}

      {/* Teleparty Modal */}
      {telepartyOpen && <Suspense fallback={null}><TelepartyModal onClose={() => setTelepartyOpen(false)} /></Suspense>}
      {howToUseOpen && <FirstLaunchModal onClose={() => setHowToUseOpen(false)} />}
      {welcomeOpen && !isPlayerActive && <FirstLaunchModal onClose={closeWelcome} />}
      <DownloadLocationModal />
    </div>
  );
};

export default App;
