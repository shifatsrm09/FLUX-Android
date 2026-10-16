import React, { useState } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { Download, X, CheckCircle, Clock } from 'lucide-react';

interface DownloadsPanelProps {
  onClose: () => void;
}

export const DownloadsPanel: React.FC<DownloadsPanelProps> = ({ onClose }) => {
  const { state } = useFlux();
  const [showLog, setShowLog] = useState(false);

  const activeDownloads = state.downloads.filter((d) => d.status === 'downloading');
  const finishedDownloads = state.downloads.filter((d) => d.status === 'completed');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-end p-6 pb-20 bg-black/40 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-96 rounded-2xl bg-[#2B2D31] border border-[#4E5058] shadow-2xl p-4 text-white flex flex-col max-h-[70vh] animate-slideUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#383A40]">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-white" />
            <h3 className="text-sm font-bold text-white">
              {showLog ? 'Download History' : 'Downloads'}
            </h3>
            {activeDownloads.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#5865F2] text-[10px] font-bold text-white">
                {activeDownloads.length}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowLog(!showLog)}
              className="text-xs text-[#949BA4] hover:text-white px-2 py-1 rounded transition-colors"
            >
              {showLog ? 'Active' : 'Log'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-[#949BA4] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-3 overflow-y-auto space-y-3 flex-1">
          {state.downloads.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Download className="w-8 h-8 text-[#80848E] mx-auto opacity-40" />
              <p className="text-xs text-[#80848E]">No active or completed downloads</p>
            </div>
          ) : (
            (showLog ? finishedDownloads : activeDownloads.length > 0 ? activeDownloads : state.downloads).map((dl) => (
              <div
                key={dl.id}
                className="p-3 rounded-xl bg-[#1E1F22] border border-[#383A40] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-white line-clamp-1 flex-1 mr-2" title={dl.title}>
                    {dl.title}
                  </h4>
                  {dl.status === 'completed' ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[#23A55A] shrink-0" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-[#F0B232] shrink-0" />
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-[#313338] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      dl.status === 'completed' ? 'bg-[#23A55A]' : 'bg-[#5865F2]'
                    }`}
                    style={{ width: `${dl.progress}%` }}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-[11px] text-[#949BA4]">
                  <span>{dl.progress}%</span>
                  <span>{dl.speed}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
