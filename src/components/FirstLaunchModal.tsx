import React from 'react';
import { Wifi, Download, FolderOpen, Server, X } from 'lucide-react';

interface FirstLaunchModalProps { onClose: () => void; }

export const FirstLaunchModal: React.FC<FirstLaunchModalProps> = ({ onClose }) => (
  <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
    <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1E1F22] border border-[#4E5058] shadow-2xl">
      <div className="p-6 border-b border-[#2B2D31] flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[2px] text-[#5865F2]">Welcome to FLUX</p>
          <h2 className="mt-1 text-xl font-bold text-white">Choose the best way to watch</h2>
        </div>
        <button onClick={onClose} aria-label="Close welcome guide" className="p-2 rounded-full hover:bg-white/10 text-[#949BA4]">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 space-y-4 text-sm">
        <Guide icon={<Server />} title="Dhaka Flix vs ICC FTP">
          Dhaka Flix is the primary BDIX media index. ICC FTP is a separate catalog and server. Switch servers when a title or category is missing.
        </Guide>
        <Guide icon={<Wifi />} title="When direct playback works">
          BDIX Direct works fastest while your phone is connected to the supported local BDIX network. Outside it, direct IP streams may be unreachable.
        </Guide>
        <Guide icon={<span className="text-lg">⚡</span>} title="Fast Mirror">
          Fast Mirror is an internet-based fallback stream. It may work outside BDIX, but quality, subtitles, and availability can differ.
        </Guide>
        <Guide icon={<Download />} title="Downloads vs imported files">
          Downloads are items you request from FLUX and track in Downloads. Imported files are videos you pick from your device. Both can be watched offline when fully saved.
        </Guide>
        <Guide icon={<FolderOpen />} title="Where offline videos are stored">
          Imported videos are stored in FLUX app storage on Android. They remain private to the app and can be removed from Library; Android may remove them if app data is cleared.
        </Guide>
      </div>
      <div className="p-6 pt-0">
        <button onClick={onClose} className="w-full h-11 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-bold">Got it</button>
      </div>
    </div>
  </div>
);

const Guide: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="flex gap-3 rounded-xl bg-[#2B2D31]/70 border border-[#383A40] p-3.5">
    <div className="w-8 h-8 shrink-0 rounded-lg bg-[#5865F2]/15 text-[#5865F2] flex items-center justify-center">{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-4 h-4' }) : icon}</div>
    <div><h3 className="font-semibold text-white">{title}</h3><p className="mt-1 text-xs leading-relaxed text-[#949BA4]">{children}</p></div>
  </div>
);
