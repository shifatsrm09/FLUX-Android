import React from 'react';
import { Download, Film, Folder } from 'lucide-react';
import { useFlux } from '../stores/useFluxStore';

export const DownloadLocationModal: React.FC = () => {
  const { state, setDownloadLocation } = useFlux();
  if (!state.pendingDownload) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl bg-[#1E1F22] border border-[#4E5058] shadow-2xl p-5 text-white">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 text-[#8EA1FF] flex items-center justify-center"><Download className="w-5 h-5" /></div>
          <div><h2 className="text-base font-bold">Where should downloads go?</h2><p className="mt-1 text-xs text-[#949BA4] line-clamp-2">Choose a location for this and future FLUX downloads.</p></div>
        </div>
        <div className="space-y-2">
          <button onClick={() => setDownloadLocation('downloads')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#2B2D31] border border-[#383A40] hover:border-[#5865F2] text-left">
            <Folder className="w-5 h-5 text-[#8EA1FF]" /><span><strong className="block text-sm">Downloads / FLUX</strong><small className="text-[11px] text-[#949BA4]">Easy to find in your Downloads folder</small></span>
          </button>
          <button onClick={() => setDownloadLocation('movies')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#2B2D31] border border-[#383A40] hover:border-[#5865F2] text-left">
            <Film className="w-5 h-5 text-[#23A55A]" /><span><strong className="block text-sm">Movies / FLUX</strong><small className="text-[11px] text-[#949BA4]">Visible to gallery and video apps</small></span>
          </button>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-[#80848E]">FLUX creates a FLUX folder and keeps the saved file linked in the Downloads screen for one-tap playback.</p>
      </div>
    </div>
  );
};
