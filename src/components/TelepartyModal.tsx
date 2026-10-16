import React, { useState } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { Users, Copy, Check, LogOut, ArrowLeft } from 'lucide-react';

interface TelepartyModalProps {
  onClose: () => void;
}

export const TelepartyModal: React.FC<TelepartyModalProps> = ({ onClose }) => {
  const { state, hostTeleparty, joinTeleparty, leaveTeleparty } = useFlux();
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  const inSession = state.teleparty.state === 'joined' || state.teleparty.state === 'connecting';

  const handleCopy = () => {
    navigator.clipboard.writeText(state.teleparty.sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length >= 4) {
      joinTeleparty(code);
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
        {/* Header */}
        <div className="flex items-center space-x-2 pb-3 border-b border-[#383A40]">
          <Users className="w-4 h-4 text-[#5865F2]" />
          <span className="text-xs font-black tracking-widest uppercase">Teleparty</span>
        </div>

        {/* In Session View */}
        {inSession ? (
          <div className="py-4 space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-[#80848E] uppercase tracking-wider">
                Session Code
              </span>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl font-mono font-black tracking-widest text-[#5865F2]">
                  {state.teleparty.sessionCode}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-[#313338] hover:bg-[#383A40] text-[#949BA4] hover:text-white transition-colors"
                  title="Copy Code"
                >
                  {copied ? <Check className="w-4 h-4 text-[#23A55A]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1E1F22] text-xs">
              <span className="text-[#949BA4]">Active Members</span>
              <span className="font-semibold text-white">{state.teleparty.membersCount} connected</span>
            </div>

            <p className="text-[11px] text-[#80848E] leading-relaxed text-center">
              Playback actions (play, pause, seek) are synchronized across all connected devices in real time.
            </p>

            <button
              onClick={() => {
                leaveTeleparty();
                onClose();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-[#F23F43]/20 hover:bg-[#F23F43]/30 text-[#F23F43] border border-[#F23F43]/40 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Session</span>
            </button>
          </div>
        ) : joining ? (
          /* Join Code Input View */
          <form onSubmit={handleJoinSubmit} className="py-4 space-y-3">
            <div className="flex items-center space-x-2 text-xs text-[#949BA4]">
              <button
                type="button"
                onClick={() => setJoining(false)}
                className="hover:text-white transition-colors p-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <span>Enter 5-digit room code</span>
            </div>

            <input
              type="text"
              maxLength={5}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 48291"
              className="w-full px-3 py-2.5 rounded-xl bg-[#1E1F22] border border-[#4E5058] text-center font-mono text-lg font-bold tracking-widest text-white uppercase focus:outline-none focus:border-[#5865F2]"
              autoFocus
            />

            <button
              type="submit"
              disabled={code.trim().length < 4}
              className="w-full py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 text-white text-xs font-bold tracking-wide transition-colors cursor-pointer"
            >
              Join Room
            </button>
          </form>
        ) : (
          /* Idle Choice View */
          <div className="py-4 space-y-2.5">
            <p className="text-xs text-[#949BA4] leading-relaxed">
              Watch movies and series in sync with friends anywhere in the world.
            </p>

            <button
              onClick={() => hostTeleparty()}
              className="w-full py-2.5 px-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold tracking-wide transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Host a Session</span>
            </button>

            <button
              onClick={() => setJoining(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#313338] hover:bg-[#383A40] text-white text-xs font-bold tracking-wide transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <span>Join with Code</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
