import React from 'react';
import { useFlux } from '../stores/useFluxStore';
import {
  Home,
  Tv,
  Bookmark,
  Folder,
  Settings,
  Download,
  X
} from 'lucide-react';

interface SideNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  section: 'home' | 'search' | 'bookmarks' | 'library';
  onSectionChange: (section: 'home' | 'search' | 'bookmarks' | 'library') => void;
  onOpenTeleparty: () => void;
  onOpenSettings: () => void;
  onOpenDownloads: () => void;
}

export const SideNavDrawer: React.FC<SideNavDrawerProps> = ({
  isOpen,
  onClose,
  section,
  onSectionChange,
  onOpenTeleparty,
  onOpenSettings,
  onOpenDownloads
}) => {
  const { state, setActiveServer } = useFlux();

  if (!isOpen) return null;

  const activeDownloadsCount = state.downloads.filter((d) => d.status === 'downloading').length;
  const inTeleparty = state.teleparty.state === 'joined';

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => {
        onSectionChange('home');
        onClose();
      },
      active: section === 'home'
    },
    {
      id: 'teleparty',
      label: 'Teleparty',
      icon: Tv,
      action: () => {
        onClose();
        onOpenTeleparty();
      },
      badge: inTeleparty ? 'Live' : undefined,
      badgeColor: 'bg-[#23A55A]'
    },
    {
      id: 'bookmarks',
      label: 'Bookmarks',
      icon: Bookmark,
      action: () => {
        onSectionChange('bookmarks');
        onClose();
      },
      active: section === 'bookmarks',
      badge: state.bookmarks.length > 0 ? String(state.bookmarks.length) : undefined
    },
    {
      id: 'library',
      label: 'Library',
      icon: Folder,
      action: () => {
        onSectionChange('library');
        onClose();
      },
      active: section === 'library'
    },
    {
      id: 'settings',
      label: 'Setting',
      icon: Settings,
      action: () => {
        onClose();
        onOpenSettings();
      }
    },
    {
      id: 'downloads',
      label: 'Downloads',
      icon: Download,
      action: () => {
        onClose();
        onOpenDownloads();
      },
      badge: activeDownloadsCount > 0 ? String(activeDownloadsCount) : undefined,
      badgeColor: 'bg-[#5865F2]'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex select-none animate-fadeIn">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-in Drawer */}
      <div
        className="relative w-72 max-w-[85vw] h-full bg-[#15151A] border-r border-[#2B2D31] flex flex-col shadow-2xl z-10 animate-slideRight"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#2B2D31] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-[4px] text-white leading-tight">
              FLUX
            </span>
            <span className="text-[10px] uppercase font-bold text-[#5865F2] tracking-[2px] mt-0.5">
              Android Edition
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-white/10 active:bg-white/20 text-[#949BA4] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isItemActive = Boolean(item.active);

            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full h-12 px-4 rounded-xl flex items-center justify-between transition-all cursor-pointer text-left ${
                  isItemActive
                    ? 'bg-[#5865F2] text-white shadow-lg font-bold'
                    : 'text-[#DBDEE1] hover:text-white hover:bg-white/5 active:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-3.5">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isItemActive ? 'text-white' : 'text-[#949BA4]'
                    }`}
                  />
                  <span className="text-sm font-semibold tracking-wide">
                    {item.label}
                  </span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold text-white ${
                      item.badgeColor || 'bg-[#2B2D31] text-[#DBDEE1]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer: Quick Server Indicator */}
        <div className="p-4 border-t border-[#2B2D31] bg-[#111215] flex flex-col space-y-2">
          <span className="text-[10px] font-bold text-[#80848E] uppercase tracking-wider">
            Active Media Server
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveServer(1)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                state.activeServer === 1
                  ? 'bg-[#5865F2] text-white shadow'
                  : 'bg-[#1E1F22] text-[#949BA4] hover:text-white border border-[#2B2D31]'
              }`}
            >
              Dhaka Flix
            </button>
            <button
              onClick={() => setActiveServer(2)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
                state.activeServer === 2
                  ? 'bg-[#5865F2] text-white shadow'
                  : 'bg-[#1E1F22] text-[#949BA4] hover:text-white border border-[#2B2D31]'
              }`}
            >
              ICC FTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
