import React, { useRef, useState, useEffect } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { formatTime, qualityLabel } from '../theme';
import { buildProxyUrl } from '../services/searchService';
import { FluxIcon } from './FluxIcon';
import { MoviPlayer } from 'movi-player/react';
import Hls from 'hls.js';
import type { VideoSource } from '../types';
import { isNativeVlcSupported, launchNativeVlc } from '../services/fluxVlcPlayer';

export const PlayerView: React.FC = () => {
  const { state, setPage, updateProgress } = useFlux();
  const current = state.currentPlaying;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build list of stream sources for this media
  const availableSources: VideoSource[] = React.useMemo(() => {
    if (!current) return [];
    if (current.sources && current.sources.length > 0) {
      return current.sources;
    }
    const list: VideoSource[] = [];
    if (current.directUrl) {
      const isEmbed =
        current.directUrl.includes('autoembed') ||
        current.directUrl.includes('multiembed') ||
        current.directUrl.includes('player.php');
      list.push({
        name: isEmbed ? 'Web Stream' : 'BDIX Direct Stream',
        url: current.directUrl,
        type: isEmbed ? 'embed' : 'video'
      });
    }
    if (current.embedUrl) {
      list.push({ name: 'Fast Mirror (HD)', url: current.embedUrl, type: 'embed' });
    }
    if (current.trailerUrl) {
      list.push({ name: 'Official Trailer', url: current.trailerUrl, type: 'embed' });
    }
    return list;
  }, [current]);

  const [selectedSourceIdx, setSelectedSourceIdx] = useState(0);
  const activeSource = availableSources[selectedSourceIdx] || availableSources[0];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(state.settings.volume / 100);
  const [isMuted, setIsMuted] = useState(state.settings.muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferingPercent, setBufferingPercent] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [osd, setOsd] = useState<{ text: string; level: number; visible: boolean }>({
    text: '',
    level: -1,
    visible: false
  });

  // Resume Toast
  const [resumeToast, setResumeToast] = useState<{ visible: boolean; timeMs: number }>({
    visible: false,
    timeMs: 0
  });

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const osdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showOsd = (text: string, level = -1) => {
    setOsd({ text, level, visible: true });
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    osdTimeoutRef.current = setTimeout(() => {
      setOsd((prev) => ({ ...prev, visible: false }));
    }, 1400);
  };

  useEffect(() => {
    setSelectedSourceIdx(0);
    setHasError(false);
  }, [current?.url]);

  // Check saved resume position
  useEffect(() => {
    if (!current) return;
    const historyItem = state.history.find((h) => h.url === current.url);
    if (historyItem && historyItem.timestampMs > 15000 && historyItem.progressFraction < 0.92) {
      setResumeToast({ visible: true, timeMs: historyItem.timestampMs });
      const timer = setTimeout(() => {
        setResumeToast((prev) => ({ ...prev, visible: false }));
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [current?.url]);

  // Native Android Embedded LibVLC Player
  useEffect(() => {
    if (!current || !isNativeVlcSupported()) return;

    let isCancelled = false;
    const historyItem = state.history.find((h) => h.url === current.url);
    const resumePos = historyItem && historyItem.progressFraction < 0.95 ? historyItem.timestampMs : 0;

    const sources = availableSources.map((s) => ({
      name: s.name,
      url: s.url
    }));

    const playUrl = activeSource?.url || current.directUrl || current.url;

    launchNativeVlc(
      playUrl,
      current.title,
      current.title.match(/\b(2160p|4k|1080p|720p|480p)\b/i)?.[0]?.toUpperCase() || 'HD',
      resumePos,
      sources
    )
      .then((res) => {
        if (isCancelled) return;
        if (res.durationMs > 0) {
          updateProgress(current.url, res.positionMs, res.durationMs);
        }
        setPage(state.pageBeforePlayer || 'search');
      })
      .catch((err) => {
        console.error('Native VLC Player error:', err);
        if (!isCancelled) {
          setHasError(true);
          setErrorMessage('Native VLC playback failed: ' + err.message);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [current?.url, activeSource?.url]);

  const isEmbed =
    activeSource?.type === 'embed' ||
    Boolean(
      activeSource?.url &&
        (activeSource.url.includes('autoembed') ||
          activeSource.url.includes('multiembed') ||
          activeSource.url.includes('player.php') ||
          activeSource.url.includes('youtube'))
    );

  const isMkv =
    !isEmbed &&
    Boolean(
      activeSource?.url &&
        (activeSource.url.toLowerCase().includes('.mkv') ||
          activeSource.url.toLowerCase().includes('.avi'))
    );

  const rawUrl = activeSource?.url || '';
  const streamUrl = rawUrl
    ? buildProxyUrl(rawUrl, state.settings.proxyMode, state.settings.customProxyUrl)
    : '';

  // Video source & HLS initialization (for direct MP4 / HLS streams)
  useEffect(() => {
    if (isEmbed || isMkv) return;
    const video = videoRef.current;
    if (!video || !activeSource) return;

    setHasError(false);
    setIsBuffering(true);
    setBufferingPercent(15);

    let hlsInstance: Hls | null = null;

    if (streamUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        hlsInstance = new Hls({ enableWorker: true });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          video.play().catch(() => setIsPlaying(false));
        });
        hlsInstance.on(Hls.Events.ERROR, () => {
          setIsBuffering(false);
          setHasError(true);
          setErrorMessage('Streaming manifest failed to parse.');
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      }
    } else {
      video.src = streamUrl;
      video.play().catch(() => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (hlsInstance) hlsInstance.destroy();
    };
  }, [activeSource, isEmbed, isMkv, streamUrl]);

  // Sync state & progress for native video
  useEffect(() => {
    if (isEmbed || isMkv) return;
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime * 1000);
      if (video.duration) {
        setDuration(video.duration * 1000);
        if (current?.url) {
          updateProgress(current.url, video.currentTime * 1000, video.duration * 1000);
        }
      }
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1) * 1000);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => {
      setIsBuffering(true);
      setBufferingPercent((prev) => Math.min(95, prev + 25));
    };
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handleError = () => {
      setIsBuffering(false);
      setHasError(true);
      setErrorMessage('Direct video playback failed. Please try an alternative mirror.');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('error', handleError);
    };
  }, [current, activeSource, isEmbed, isMkv]);

  // Controls auto-hide matching hideControlsTimer
  const wakeControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
      }
    }, 3500);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      showOsd('Play');
    } else {
      video.pause();
      showOsd('Pause');
    }
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    showOsd((seconds < 0 ? '−' : '+') + Math.abs(seconds) + 's');
  };

  const adjustVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    video.volume = newVol;
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
    showOsd(`Volume ${Math.round(newVol * 100)}%`, Math.round(newVol * 100));
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
    showOsd(nextMuted ? 'Muted' : `Volume ${Math.round(volume * 100)}%`, nextMuted ? 0 : Math.round(volume * 100));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Keyboard Shortcuts matching Main.qml keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      wakeControls();
      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'arrowleft':
          e.preventDefault();
          seekBy(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          seekBy(10);
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(0.05);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-0.05);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'escape':
          if (isFullscreen) {
            toggleFullscreen();
          } else {
            handleBack();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isFullscreen, volume, isMuted]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pos * (duration / 1000);
  };

  const handleBack = () => {
    const video = videoRef.current;
    if (video) video.pause();
    setPage(state.pageBeforePlayer);
  };

  const resumeAtSaved = () => {
    const video = videoRef.current;
    if (video && resumeToast.timeMs > 0) {
      video.currentTime = resumeToast.timeMs / 1000;
    }
    setResumeToast({ visible: false, timeMs: 0 });
  };

  const videoQuality = qualityLabel(1920, 1080);

  if (isNativeVlcSupported()) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0B0B0E] flex flex-col items-center justify-center text-white p-6 select-none">
        <div className="w-16 h-16 rounded-2xl bg-[#1E1F22] border border-[#2B2D31] flex items-center justify-center mb-6 shadow-2xl">
          <div className="w-8 h-8 border-3 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-[11px] uppercase font-bold text-[#5865F2] tracking-[2px] mb-2">
          FLUX Embedded VLC Engine
        </span>
        <h2 className="text-xl font-bold text-white max-w-md text-center px-4 line-clamp-1 mb-2">
          {current?.title || 'Starting Playback...'}
        </h2>
        <p className="text-xs text-[#949BA4] text-center max-w-sm mb-6">
          Playing stream directly with native LibVLC hardware decoding
        </p>
        <button
          onClick={handleBack}
          className="px-5 py-2.5 rounded-full bg-[#1E1F22] hover:bg-[#2B2D31] border border-[#2B2D31] text-xs font-semibold text-[#DBDEE1] transition-all cursor-pointer shadow-lg"
        >
          Cancel & Return
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={wakeControls}
      onClick={wakeControls}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* =========================================================================
          Video Viewport
         ========================================================================= */}
      {isEmbed ? (
        <iframe
          src={activeSource?.url}
          title={current?.title}
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : isMkv ? (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <MoviPlayer
            src={streamUrl}
            title={current?.title}
            controls
            autoplay
            theme="dark"
            themecolor="#5865F2"
            className="w-full h-full"
            onError={() => {
              setHasError(true);
              setErrorMessage('Client-side WASM decoder encountered an issue.');
            }}
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          onClick={togglePlay}
          className={`w-full h-full cursor-pointer ${
            aspectRatio === 'cover'
              ? 'object-cover'
              : aspectRatio === 'fill'
              ? 'object-fill'
              : 'object-contain'
          }`}
          playsInline
        />
      )}

      {/* Paused Dimmer Overlay matching PlayerView.qml line 316 */}
      {!isEmbed && !isMkv && !isPlaying && !isBuffering && !hasError && (
        <div className="absolute inset-0 bg-black/35 pointer-events-none transition-opacity duration-150" />
      )}

      {/* =========================================================================
          TOP BAR: Back Button, NOW PLAYING Header, Title, Quality Chip, Mirror Switcher
         ========================================================================= */}
      <div
        className={`absolute top-0 left-0 right-0 h-[130px] bg-gradient-to-b from-black/85 to-transparent px-6 sm:px-8 pt-7 z-30 transition-opacity duration-200 ${
          showControls || isEmbed || isMkv ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-start justify-between">
          {/* Back button & Title Block */}
          <div className="flex items-center space-x-4 max-w-2xl">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="w-10 h-10 rounded-full bg-[#15151A]/80 hover:bg-[#383A40] border border-[#2B2D31] flex items-center justify-center text-white transition-colors cursor-pointer shadow-xl shrink-0"
              title="Back (Esc)"
            >
              <FluxIcon name="back" size={20} color="#FFFFFF" />
            </button>

            {/* Title & "NOW PLAYING" */}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#4752C4] tracking-[2px] uppercase">
                NOW PLAYING
              </span>
              <div className="flex items-center space-x-3">
                <h1
                  className="text-lg sm:text-2xl font-bold text-white tracking-tight line-clamp-1 drop-shadow"
                  title={current?.title}
                >
                  {current?.title}
                </h1>

                {/* Quality Chip */}
                {videoQuality && (
                  <div className="hidden sm:flex h-6 px-2.5 rounded-md bg-black/40 border border-white/35 items-center justify-center">
                    <span className="text-xs font-bold text-white tracking-wider">
                      {videoQuality}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Source / Mirror Switcher Pills matching QML */}
          {availableSources.length > 1 && (
            <div className="flex items-center space-x-1.5 p-1 rounded-full bg-[#1E1F22]/90 border border-[#2B2D31] shadow-2xl backdrop-blur-md">
              {availableSources.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedSourceIdx(idx);
                    setHasError(false);
                    showOsd(`Switched to ${src.name}`);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedSourceIdx === idx
                      ? 'bg-[#5865F2] text-white shadow'
                      : 'text-[#949BA4] hover:text-white'
                  }`}
                >
                  {src.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          CENTRE OVERLAYS: Big Play Button, Buffering Spinner, OSD Toasts
         ========================================================================= */}

      {/* Big Play Button matching PlayerView.qml lines 440-479 */}
      {!isEmbed && !isMkv && !isPlaying && !isBuffering && !hasError && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-20"
        >
          <div className="w-24 h-24 rounded-full bg-white/25 hover:bg-white/40 border-2 border-white/60 text-white flex items-center justify-center shadow-2xl transform transition-transform hover:scale-105 active:scale-95">
            <div className="ml-1">
              <FluxIcon name="play" size={44} color="#FFFFFF" />
            </div>
          </div>
        </div>
      )}

      {/* Buffering Spinner matching PlayerView.qml lines 482-503 */}
      {!isEmbed && !isMkv && isBuffering && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 space-y-3">
          <div className="w-16 h-16 rounded-full border-4 border-white/20 border-t-[#5865F2] animate-spin" />
          <span className="text-sm font-medium text-white/90 drop-shadow">
            {bufferingPercent > 0 ? `Buffering ${bufferingPercent}%` : 'Buffering'}
          </span>
        </div>
      )}

      {/* OSD Toast Notification matching PlayerView.qml lines 506-559 */}
      {osd.visible && (
        <div className="absolute top-[118px] left-1/2 -translate-x-1/2 z-30 h-11 px-5 rounded-full bg-[#101015]/90 border border-white/15 shadow-2xl flex items-center space-x-3.5 animate-fadeIn">
          <span
            className={`text-sm font-bold ${
              osd.level > 100 ? 'text-[#F0B232]' : 'text-white'
            }`}
          >
            {osd.text}
          </span>

          {osd.level >= 0 && (
            <div className="w-[120px] h-1 rounded-full bg-white/25 relative flex items-center">
              <div
                className={`h-full rounded-full ${
                  osd.level > 100 ? 'bg-[#F0B232]' : 'bg-white'
                }`}
                style={{ width: `${Math.min(100, osd.level)}%` }}
              />
              {/* 100% Marker */}
              <div className="absolute left-1/2 top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-white/50" />
            </div>
          )}
        </div>
      )}

      {/* Playback Error Dialog matching PlayerView.qml lines 562-653 */}
      {!isEmbed && hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-30 space-y-4 p-6 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-full bg-[#FF5D5D]/15 border border-[#FF5D5D]/30 flex items-center justify-center text-[#F23F43]">
            <FluxIcon name="alert" size={26} color="#F23F43" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white tracking-tight">Playback error</h3>
            <p className="text-xs text-[#949BA4] max-w-sm">
              {errorMessage || 'This stream could not be played directly.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 justify-center">
            {availableSources.length > 1 && (
              <button
                onClick={() => {
                  setHasError(false);
                  const mirrorIdx = availableSources.findIndex((s) => s.name.includes('Fast Mirror'));
                  setSelectedSourceIdx(mirrorIdx >= 0 ? mirrorIdx : 1);
                }}
                className="px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-lg cursor-pointer"
              >
                Try Alternative Server
              </button>
            )}

            <button
              onClick={() => {
                setHasError(false);
                setIsBuffering(true);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Retry Playback
            </button>

            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 text-[#949BA4] text-xs font-medium cursor-pointer"
            >
              Go back
            </button>
          </div>
        </div>
      )}

      {/* Resume Toast Card matching ResumeToast.qml */}
      {resumeToast.visible && !isEmbed && !isMkv && (
        <div className="absolute left-8 bottom-36 z-30 bg-[#2B2D31]/95 border border-[#4E5058] rounded-xl px-4 py-3 shadow-2xl flex items-center space-x-3.5 animate-slideUp">
          <span className="text-xs text-white">
            Resumed from <strong className="text-[#5865F2]">{formatTime(resumeToast.timeMs)}</strong>
          </span>
          <button
            onClick={resumeAtSaved}
            className="px-2.5 py-1 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold cursor-pointer"
          >
            Resume
          </button>
          <button
            onClick={() => setResumeToast({ visible: false, timeMs: 0 })}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#949BA4] text-xs font-medium cursor-pointer"
          >
            Start Over
          </button>
        </div>
      )}

      {/* =========================================================================
          BOTTOM TRANSPORT CONTROLS BAR matching PlaybackControls.qml
         ========================================================================= */}
      {!isEmbed && !isMkv && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-6 sm:px-8 pb-6 pt-16 z-30 transition-opacity duration-200 flex flex-col space-y-2 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Timeline Row */}
          <div className="flex items-center space-x-3.5 w-full">
            {/* Elapsed Time */}
            <span className="text-xs font-semibold font-mono text-white w-14 text-right">
              {formatTime(currentTime)}
            </span>

            {/* Seek Bar with preview */}
            <div
              onClick={handleSeek}
              className="relative grow h-1 hover:h-2 bg-white/25 rounded-full cursor-pointer transition-all group"
            >
              {/* Buffered */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-white/30 rounded-full"
                style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }}
              />
              {/* Played */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-[#5865F2] rounded-full relative"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#5865F2] shadow-md transform scale-0 group-hover:scale-100 transition-transform" />
              </div>
            </div>

            {/* Total Duration */}
            <span className="text-xs font-semibold font-mono text-[#949BA4] w-14 text-left">
              {formatTime(duration)}
            </span>
          </div>

          {/* Button Row */}
          <div className="flex items-center justify-between pt-1">
            {/* Left Transport Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              >
                <FluxIcon name={isPlaying ? 'pause' : 'play'} size={26} color="#FFFFFF" />
              </button>

              {/* Replay 10s */}
              <button
                onClick={() => seekBy(-10)}
                className="w-9 h-9 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Back 10 seconds (←)"
              >
                <FluxIcon name="replay10" size={24} color="#FFFFFF" />
              </button>

              {/* Forward 10s */}
              <button
                onClick={() => seekBy(10)}
                className="w-9 h-9 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Forward 10 seconds (→)"
              >
                <FluxIcon name="forward10" size={24} color="#FFFFFF" />
              </button>

              {/* Volume Button + Expander Slider matching PlaybackControls.qml lines 265-370 */}
              <div className="flex items-center space-x-1.5 group/vol">
                <button
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  <FluxIcon
                    name={isMuted || volume === 0 ? 'volumeMuted' : volume < 0.6 ? 'volumeLow' : 'volume'}
                    size={24}
                    color="#FFFFFF"
                  />
                </button>

                <div className="w-0 group-hover/vol:w-28 overflow-hidden transition-all duration-200 flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (videoRef.current) videoRef.current.volume = v;
                      if (isMuted && v > 0) {
                        setIsMuted(false);
                        if (videoRef.current) videoRef.current.muted = false;
                      }
                    }}
                    className="w-16 h-1 accent-[#5865F2] cursor-pointer"
                  />
                  <span className="text-[11px] font-mono font-semibold text-[#949BA4]">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Speed Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="h-8 px-2.5 rounded-lg hover:bg-white/10 text-xs font-bold text-white tracking-wider cursor-pointer"
                >
                  {playbackSpeed}x
                </button>

                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-28 rounded-xl bg-[#2B2D31] border border-[#4E5058] p-1.5 shadow-2xl z-40 space-y-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setPlaybackSpeed(s);
                          if (videoRef.current) videoRef.current.playbackRate = s;
                          setShowSpeedMenu(false);
                          showOsd(`Speed ${s}x`);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          playbackSpeed === s
                            ? 'bg-[#5865F2] text-white'
                            : 'text-[#949BA4] hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{s}x</span>
                        {playbackSpeed === s && <span className="text-white text-xs">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Aspect Ratio Switcher */}
              <button
                onClick={() => {
                  const next =
                    aspectRatio === 'contain'
                      ? 'cover'
                      : aspectRatio === 'cover'
                      ? 'fill'
                      : 'contain';
                  setAspectRatio(next);
                  showOsd(`Aspect: ${next.toUpperCase()}`);
                }}
                className="h-8 px-2.5 rounded-lg hover:bg-white/10 text-xs font-bold text-[#949BA4] hover:text-white tracking-wider uppercase cursor-pointer"
                title="Toggle Aspect Ratio"
              >
                {aspectRatio}
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                <FluxIcon
                  name={isFullscreen ? 'fullscreenExit' : 'fullscreen'}
                  size={20}
                  color="#FFFFFF"
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
