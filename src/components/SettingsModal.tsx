import React, { useState } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { X, Server, Shield, PlayCircle, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { state, updateSettings, setActiveServer } = useFlux();
  const [iccUrl, setIccUrl] = useState(state.settings.iccftpUrl);
  const [iccSession, setIccSession] = useState(state.settings.iccSession);
  const [customProxy, setCustomProxy] = useState(state.settings.customProxyUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    updateSettings({
      iccftpUrl: iccUrl,
      iccSession: iccSession,
      customProxyUrl: customProxy
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all saved history, bookmarks, and downloads in FLUX?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#2B2D31] border border-[#4E5058] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#383A40] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#5865F2]/20 text-[#5865F2]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">FLUX Settings</h2>
              <p className="text-xs text-[#949BA4]">Web Configuration & Networking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-[#949BA4] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Active Server Choice */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-[#80848E] uppercase tracking-wider block">
              Active Media Server
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveServer(1)}
                className={`flex flex-col p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  state.activeServer === 1
                    ? 'bg-[#5865F2]/20 border-[#5865F2] text-white shadow-lg'
                    : 'bg-[#313338] border-transparent hover:border-[#4E5058] text-[#949BA4]'
                }`}
              >
                <span className="font-semibold text-white">Dhaka Flix</span>
                <span className="text-xs text-[#80848E] mt-0.5">High-speed BDIX h5ai server</span>
              </button>

              <button
                onClick={() => setActiveServer(2)}
                className={`flex flex-col p-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
                  state.activeServer === 2
                    ? 'bg-[#5865F2]/20 border-[#5865F2] text-white shadow-lg'
                    : 'bg-[#313338] border-transparent hover:border-[#4E5058] text-[#949BA4]'
                }`}
              >
                <span className="font-semibold text-white">ICC FTP</span>
                <span className="text-xs text-[#80848E] mt-0.5">ICC Communication Portal</span>
              </button>
            </div>
          </div>

          {/* ICC FTP Parameters */}
          {state.activeServer === 2 && (
            <div className="space-y-3 p-4 rounded-xl bg-[#1E1F22] border border-[#383A40]">
              <div>
                <label className="text-xs text-[#949BA4] block mb-1">ICC FTP URL</label>
                <input
                  type="text"
                  value={iccUrl}
                  onChange={(e) => setIccUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#2B2D31] border border-[#4E5058] text-xs font-mono text-white focus:outline-none focus:border-[#5865F2]"
                />
              </div>
              <div>
                <label className="text-xs text-[#949BA4] block mb-1">ICC Session Token</label>
                <input
                  type="text"
                  value={iccSession}
                  onChange={(e) => setIccSession(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#2B2D31] border border-[#4E5058] text-xs font-mono text-white focus:outline-none focus:border-[#5865F2]"
                />
              </div>
            </div>
          )}

          {/* Network & Proxy Mode */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[#5865F2]" />
              <label className="text-xs font-bold text-[#80848E] uppercase tracking-wider block">
                Network & CORS Proxy Mode
              </label>
            </div>
            <p className="text-xs text-[#949BA4]">
              Public web domains (like GitHub Pages) require a CORS proxy to query internal BDIX HTTP IPs.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['auto', 'direct', 'corsproxy', 'custom'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ proxyMode: mode })}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-colors ${
                    state.settings.proxyMode === mode
                      ? 'bg-[#5865F2] border-[#5865F2] text-white'
                      : 'bg-[#313338] border-transparent hover:border-[#4E5058] text-[#949BA4]'
                  }`}
                >
                  {mode === 'auto' ? 'Auto (Recommended)' : mode === 'direct' ? 'Direct BDIX' : mode}
                </button>
              ))}
            </div>
            {state.settings.proxyMode === 'custom' && (
              <input
                type="text"
                value={customProxy}
                onChange={(e) => setCustomProxy(e.target.value)}
                placeholder="https://your-cors-proxy.com/?url="
                className="w-full mt-2 px-3 py-2 rounded-lg bg-[#1E1F22] border border-[#383A40] text-xs font-mono text-white focus:outline-none focus:border-[#5865F2]"
              />
            )}
          </div>

          {/* Playback Preferences */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2">
              <PlayCircle className="w-4 h-4 text-[#5865F2]" />
              <label className="text-xs font-bold text-[#80848E] uppercase tracking-wider block">
                Playback Preferences
              </label>
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#313338] border border-transparent hover:border-[#4E5058] cursor-pointer">
                <span className="text-white text-xs font-medium">Autoplay Next Episode</span>
                <input
                  type="checkbox"
                  checked={state.settings.autoplayNext}
                  onChange={(e) => updateSettings({ autoplayNext: e.target.checked })}
                  className="w-4 h-4 rounded text-[#5865F2] focus:ring-0"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#313338] border border-transparent hover:border-[#4E5058] cursor-pointer">
                <span className="text-white text-xs font-medium">Remember Resume Position</span>
                <input
                  type="checkbox"
                  checked={state.settings.resumePlayback}
                  onChange={(e) => updateSettings({ resumePlayback: e.target.checked })}
                  className="w-4 h-4 rounded text-[#5865F2] focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* Reset / Clear Data */}
          <div className="pt-2">
            <button
              onClick={handleResetData}
              className="flex items-center space-x-2 text-xs text-[#F23F43] hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Local Cache & Reset Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#383A40] bg-[#232428] flex items-center justify-between">
          <span className="text-xs text-[#80848E]">FLUX Web Edition v1.6.1</span>
          <div className="flex items-center space-x-3">
            {savedSuccess && <span className="text-xs text-[#23A55A] font-medium">Saved!</span>}
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-semibold transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
