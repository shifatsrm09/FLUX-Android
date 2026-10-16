import React, { useState } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { testServerConnection } from '../services/searchService';
import { X, Settings as SettingsIcon, Check, Folder, RefreshCw, Shield, PlayCircle, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { state, updateSettings, setActiveServer } = useFlux();
  const [iccUrl, setIccUrl] = useState(state.settings.iccftpUrl);
  const [iccSession, setIccSession] = useState(state.settings.iccSession);
  const [customProxy, setCustomProxy] = useState(state.settings.customProxyUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Test Connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testServerConnection(
        state.activeServer,
        iccUrl,
        state.settings.proxyMode,
        customProxy
      );
      setTestResult({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection test failed: ${err.message || 'Unknown error'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-[#1E1F22] border border-[#2B2D31] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header matching screenshot */}
        <div className="px-6 py-4.5 border-b border-[#2B2D31] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white tracking-wide">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 text-[#949BA4] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Section: MEDIA SERVER matching screenshot */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-[#80848E] uppercase tracking-[1.5px] block">
              MEDIA SERVER
            </label>

            <div className="p-4.5 rounded-xl bg-[#2B2D31]/80 border border-[#383A40] space-y-4">
              <span className="text-sm font-bold text-white block">Active Media Server</span>

              {/* Server Toggle Buttons Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Server 1 (Dhaka Flix) */}
                <button
                  onClick={() => {
                    setActiveServer(1);
                    setTestResult(null);
                  }}
                  className={`h-11 px-3.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    state.activeServer === 1
                      ? 'bg-[#5865F2] text-white shadow-lg'
                      : 'bg-[#1E1F22] hover:bg-[#383A40] text-[#DBDEE1] border border-[#383A40]'
                  }`}
                >
                  {state.activeServer === 1 ? (
                    <Check className="w-4 h-4 shrink-0 text-white stroke-[2.5]" />
                  ) : (
                    <Folder className="w-4 h-4 shrink-0 text-[#949BA4]" />
                  )}
                  <span className="truncate">Server 1 (Dhaka Flix)</span>
                </button>

                {/* Server 2 (ICC FTP) */}
                <button
                  onClick={() => {
                    setActiveServer(2);
                    setTestResult(null);
                  }}
                  className={`h-11 px-3.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    state.activeServer === 2
                      ? 'bg-[#5865F2] text-white shadow-lg'
                      : 'bg-[#1E1F22] hover:bg-[#383A40] text-[#DBDEE1] border border-[#383A40]'
                  }`}
                >
                  {state.activeServer === 2 ? (
                    <Check className="w-4 h-4 shrink-0 text-white stroke-[2.5]" />
                  ) : (
                    <Folder className="w-4 h-4 shrink-0 text-[#949BA4]" />
                  )}
                  <span className="truncate">Server 2 (ICC FTP)</span>
                </button>
              </div>

              {/* Test Connection Button matching screenshot */}
              <div className="flex flex-col space-y-2 pt-1">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="h-9 px-4 rounded-full bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-60 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-md cursor-pointer active:scale-95 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>{isTesting ? 'Testing…' : 'Test Connection'}</span>
                  </button>

                  {/* Live Test Feedback */}
                  {testResult && (
                    <div
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                        testResult.success
                          ? 'text-[#23A55A] bg-[#23A55A]/15'
                          : 'text-[#FF4D5E] bg-[#FF4D5E]/15'
                      }`}
                    >
                      {testResult.message}
                    </div>
                  )}
                </div>

                {/* Explanatory description */}
                <p className="text-xs text-[#949BA4] leading-relaxed pt-1">
                  {state.activeServer === 1
                    ? 'Server 1 connects to Dhaka Flix BDIX indexer using h5ai directory search.'
                    : 'Server 2 connects to ICC FTP communication portal.'}
                </p>
              </div>
            </div>
          </div>

          {/* Server 2 Custom Configuration Fields (Visible when Server 2 is selected) */}
          {state.activeServer === 2 && (
            <div className="space-y-3 p-4.5 rounded-xl bg-[#2B2D31]/80 border border-[#383A40]">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                ICC FTP Server Parameters
              </span>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#949BA4] block mb-1">ICC FTP URL</label>
                  <input
                    type="text"
                    value={iccUrl}
                    onChange={(e) => setIccUrl(e.target.value)}
                    placeholder="http://10.16.100.244"
                    className="w-full px-3 py-2 rounded-lg bg-[#1E1F22] border border-[#4E5058] text-xs font-mono text-white focus:outline-none focus:border-[#5865F2]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#949BA4] block mb-1">ICC Session Token</label>
                  <input
                    type="text"
                    value={iccSession}
                    onChange={(e) => setIccSession(e.target.value)}
                    placeholder="b1bdfae1f7e206b929..."
                    className="w-full px-3 py-2 rounded-lg bg-[#1E1F22] border border-[#4E5058] text-xs font-mono text-white focus:outline-none focus:border-[#5865F2]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Network & CORS Proxy Mode */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-[#5865F2]" />
              <label className="text-[11px] font-bold text-[#80848E] uppercase tracking-[1.5px] block">
                NETWORK & CORS PROXY MODE
              </label>
            </div>
            <div className="p-4.5 rounded-xl bg-[#2B2D31]/80 border border-[#383A40] space-y-3">
              <p className="text-xs text-[#949BA4]">
                Public networks require proxy tunneling to query internal BDIX HTTP IP addresses.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(['auto', 'direct', 'corsproxy', 'custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSettings({ proxyMode: mode })}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize border transition-colors cursor-pointer ${
                      state.settings.proxyMode === mode
                        ? 'bg-[#5865F2] border-[#5865F2] text-white shadow'
                        : 'bg-[#1E1F22] border-[#383A40] hover:border-[#4E5058] text-[#949BA4]'
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
                  placeholder="https://your-custom-proxy.com/?url="
                  className="w-full px-3 py-2 rounded-lg bg-[#1E1F22] border border-[#4E5058] text-xs font-mono text-white focus:outline-none focus:border-[#5865F2]"
                />
              )}
            </div>
          </div>

          {/* Playback Preferences */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <PlayCircle className="w-4 h-4 text-[#5865F2]" />
              <label className="text-[11px] font-bold text-[#80848E] uppercase tracking-[1.5px] block">
                PLAYBACK PREFERENCES
              </label>
            </div>
            <div className="p-4.5 rounded-xl bg-[#2B2D31]/80 border border-[#383A40] space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-white">Autoplay Next Episode</span>
                <input
                  type="checkbox"
                  checked={state.settings.autoplayNext}
                  onChange={(e) => updateSettings({ autoplayNext: e.target.checked })}
                  className="w-4 h-4 accent-[#5865F2] rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs text-white">Remember Resume Position</span>
                <input
                  type="checkbox"
                  checked={state.settings.resumePlayback}
                  onChange={(e) => updateSettings({ resumePlayback: e.target.checked })}
                  className="w-4 h-4 accent-[#5865F2] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-2">
            <button
              onClick={handleResetData}
              className="w-full px-4 py-2.5 rounded-xl bg-[#FF4D5E]/10 hover:bg-[#FF4D5E]/20 text-[#FF4D5E] text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-[#FF4D5E]/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Saved Data & Cache</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2B2D31] flex items-center justify-between bg-[#15151A]/60">
          <span className="text-xs text-[#949BA4]">FLUX Android v1.6.1</span>
          <div className="flex items-center space-x-3">
            {savedSuccess && <span className="text-xs text-[#23A55A] font-semibold">Saved!</span>}
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-md cursor-pointer active:scale-95"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
