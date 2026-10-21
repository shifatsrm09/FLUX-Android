import React, { useMemo } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { Download, X, CheckCircle, Clock, Play, AlertCircle } from 'lucide-react';
import type { DownloadItem } from '../types';

interface DownloadsPanelProps { onClose: () => void; }

export const DownloadsPanel: React.FC<DownloadsPanelProps> = ({ onClose }) => {
  const { state, playMedia } = useFlux();
  const groups = useMemo(() => {
    const result = new Map<string, DownloadItem[]>();
    [...state.downloads].sort((a, b) => b.startedAt - a.startedAt).forEach((item) => {
      const key = item.folderPath || item.title;
      result.set(key, [...(result.get(key) || []), item]);
    });
    return [...result.entries()];
  }, [state.downloads]);

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-end justify-end p-3 sm:p-6 pb-20 bg-black/50 backdrop-blur-[2px]">
      <div onClick={(e) => e.stopPropagation()} className="w-full sm:w-[min(30rem,calc(100vw-1.5rem))] rounded-2xl bg-[#1E1F22] border border-[#4E5058] shadow-2xl p-4 text-white flex flex-col max-h-[80vh] animate-slideUp">
        <div className="flex items-center justify-between pb-3 border-b border-[#383A40]">
          <div className="flex items-center gap-2"><Download className="w-4 h-4 text-[#8EA1FF]" /><h3 className="text-sm font-bold">Downloaded files</h3><span className="px-2 py-0.5 rounded-full bg-[#5865F2] text-[10px] font-bold">{state.downloads.length}</span></div>
          <button onClick={onClose} aria-label="Close downloads" className="p-1.5 rounded-lg hover:bg-white/10 text-[#949BA4]"><X className="w-4 h-4" /></button>
        </div>
        <div className="py-3 overflow-y-auto space-y-4 flex-1">
          {groups.length === 0 ? (
            <div className="py-10 text-center space-y-2"><Download className="w-8 h-8 text-[#80848E] mx-auto opacity-40" /><p className="text-xs text-[#80848E]">Downloaded files will appear here.</p></div>
          ) : groups.map(([groupName, items]) => (
            <section key={groupName} className="rounded-xl bg-[#2B2D31]/60 border border-[#383A40] overflow-hidden">
              <div className="px-3 py-2.5 border-b border-[#383A40] flex items-center justify-between"><h4 className="text-xs font-bold text-white line-clamp-1">{groupName.split('/').pop()}</h4><span className="text-[10px] text-[#949BA4]">{items.length} file{items.length === 1 ? '' : 's'}</span></div>
              <div className="p-2 space-y-2">
                {items.map((dl) => (
                  <div key={dl.id} className="flex items-center gap-3 rounded-lg bg-[#1E1F22] border border-[#383A40] p-2">
                    {dl.posterUrl ? <img src={dl.posterUrl} alt="" className="w-10 h-14 rounded-md object-cover bg-[#313338]" /> : <div className="w-10 h-14 rounded-md bg-[#313338] flex items-center justify-center"><Download className="w-4 h-4 text-[#5865F2]" /></div>}
                    <div className="min-w-0 flex-1"><p className="text-xs font-semibold text-white line-clamp-2">{dl.title}</p><p className="mt-1 text-[10px] text-[#80848E]">{dl.status === 'completed' ? (dl.folderPath ? `Saved in ${dl.folderPath}` : 'Saved locally') : dl.status === 'error' ? (dl.error || 'Download failed') : `${dl.progress}% · ${dl.speed}`}</p><div className="mt-2 h-1 rounded-full bg-[#313338] overflow-hidden"><div className={`h-full ${dl.status === 'completed' ? 'bg-[#23A55A]' : dl.status === 'error' ? 'bg-[#F23F43]' : 'bg-[#5865F2]'}`} style={{ width: `${dl.progress}%` }} /></div></div>
                    {dl.status === 'completed' && dl.localUri ? <button onClick={() => playMedia(dl.localUri!, dl.title, dl.localUri!, true)} aria-label={`Play ${dl.title}`} className="w-9 h-9 shrink-0 rounded-full bg-[#5865F2] hover:bg-[#4752C4] flex items-center justify-center"><Play className="w-4 h-4 fill-current" /></button> : dl.status === 'error' ? <AlertCircle className="w-4 h-4 text-[#F23F43] shrink-0" /> : dl.status === 'completed' ? <CheckCircle className="w-4 h-4 text-[#23A55A] shrink-0" /> : <Clock className="w-4 h-4 text-[#F0B232] shrink-0" />}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
