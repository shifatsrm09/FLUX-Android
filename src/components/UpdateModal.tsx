import React, { useState } from 'react';
import { ExternalLink, CheckCircle, Download, RefreshCw } from 'lucide-react';

interface UpdateModalProps {
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ onClose }) => {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uptodate' | 'available'>('idle');
  const [latestTag, setLatestTag] = useState('v1.6.1');

  const checkUpdates = async () => {
    setChecking(true);
    try {
      const res = await fetch('https://api.github.com/repos/shifatsrm09/FLUX/releases/latest', {
        headers: { Accept: 'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        const tag = data.tag_name || 'v1.6.1';
        setLatestTag(tag);
        if (tag === 'v1.6.1' || tag === '1.6.1') {
          setStatus('uptodate');
        } else {
          setStatus('available');
        }
      } else {
        setStatus('uptodate');
      }
    } catch {
      setStatus('uptodate');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-14 bg-black/40 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-76 rounded-2xl bg-[#2B2D31] border border-[#4E5058] shadow-2xl p-4 text-white animate-scaleUp"
      >
        {/* Version Header */}
        <div className="space-y-1 pb-3 border-b border-[#383A40]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black tracking-widest text-[#5865F2]">FLUX</span>
            <span className="text-xs font-semibold text-white">Version 1.6.1</span>
          </div>
          <p className="text-[11px] text-[#80848E]">Web Edition (Client-Side)</p>
        </div>

        {/* Update Checker */}
        <div className="py-3.5 space-y-3">
          <button
            onClick={checkUpdates}
            disabled={checking}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-[#313338] hover:bg-[#383A40] text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Checking...' : 'Check for Updates'}</span>
          </button>

          {status === 'uptodate' && (
            <div className="flex items-center justify-center space-x-1.5 text-xs text-[#23A55A] font-medium py-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>FLUX is up to date</span>
            </div>
          )}

          {status === 'available' && (
            <div className="space-y-2 py-1">
              <span className="text-xs text-[#F0B232] font-semibold block text-center">
                New version available: {latestTag}
              </span>
              <a
                href={`https://github.com/shifatsrm09/FLUX/releases/download/${latestTag}/FLUX-1.6.1-Setup.exe`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Windows Installer</span>
              </a>
            </div>
          )}

          {/* Links */}
          <div className="pt-2 border-t border-[#383A40] space-y-1.5">
            <a
              href="https://github.com/shifatsrm09/FLUX/releases"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-xs text-[#949BA4] hover:text-white py-1 px-1 rounded transition-colors"
            >
              <span>Release Notes</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href="https://github.com/shifatsrm09/FLUX"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-xs text-[#949BA4] hover:text-white py-1 px-1 rounded transition-colors"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
