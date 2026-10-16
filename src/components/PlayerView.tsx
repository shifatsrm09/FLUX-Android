import React, { useRef, useState, useEffect } from 'react';
import { useFlux } from '../stores/useFluxStore';
import { formatTime } from '../theme';
import { buildProxyUrl } from '../services/searchService';
import { MoviPlayer } from 'movi-player/react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  Check,
  RefreshCw,
  ExternalLink,
  Layers,
  Download,
  Copy,
  Film
} from 'lucide-react';
import type { VideoSource } from '../types';

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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<'contain' | 'cover' | 'fill'>('contain');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Resume Toast
  const [resumeToast, setResumeToast] = useState<{ visible: boolean; timeMs: number }>({
    visible: false,
    timeMs: 0
  });

  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
    };
    const handleError = () => {
      setIsBuffering(false);
      setHasError(true);
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

  // Controls auto-hide
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
    } else {
      video.pause();
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  };

  const changeVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newVol = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVol);
    video.volume = newVol;
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
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
          skip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          changeVolume(-0.1);
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

  const copyDirectLink = () => {
    if (activeSource?.url) {
      navigator.clipboard.writeText(activeSource.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const playSample = () => {
    setHasError(false);
    const sampleUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    if (videoRef.current) {
      videoRef.current.src = sampleUrl;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={wakeControls}
      onClick={wakeControls}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* Video Content: Embed Iframe OR MoviPlayer (MKV WASM) OR Native Video */}
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
            onError={() => setHasError(true)}
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

      {/* Buffering Spinner (Native Video) */}
      {!isEmbed && !isMkv && isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="w-16 h-16 rounded-full border-4 border-[#5865F2]/20 border-t-[#5865F2] animate-spin" />
        </div>
      )}

      {/* Error Overlay */}
      {!isEmbed && hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 space-y-5 p-6 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/10 border border-[#5865F2]/30 flex items-center justify-center text-[#5865F2]">
            <Film className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-white tracking-wide">
              BDIX Stream Notification
            </h3>
            <p className="text-xs text-[#949BA4] leading-relaxed max-w-md">
              If this BDIX stream takes a moment to buffer, you can switch to Fast Mirror, launch directly into VLC, or download the full-speed file.
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
                className="px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold transition-all shadow-lg shadow-[#5865F2]/25 flex items-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Switch to Fast Mirror</span>
              </button>
            )}

            <button
              onClick={() => {
                if (activeSource?.url) {
                  window.location.href = `vlc://${activeSource.url}`;
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center space-x-2 cursor-pointer"
              title="Open stream URL in VLC player"
            >
              <span>Open in VLC</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (activeSource?.url) window.open(activeSource.url, '_blank');
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={copyDirectLink}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-[#949BA4] hover:text-white text-xs font-medium transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="pt-2">
            <button
              onClick={playSample}
              className="text-[11px] text-[#5865F2] hover:underline cursor-pointer"
            >
              ▶ Test with Sample HTML5 Video Stream
            </button>
          </div>
        </div>
      )}

      {/* Center Play/Pause Button (Native Video Only) */}
      {!isEmbed && !isMkv && !isPlaying && !isBuffering && !hasError && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
        >
          <div className="w-20 h-20 rounded-full bg-[#5865F2]/90 hover:bg-[#5865F2] text-white flex items-center justify-center shadow-2xl shadow-[#5865F2]/50 transform transition-transform hover:scale-110 active:scale-95">
            <Play className="w-9 h-9 fill-white ml-1" />
          </div>
        </div>
      )}

      {/* Resume Toast */}
      {resumeToast.visible && !isEmbed && !isMkv && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-[#2B2D31]/95 border border-[#4E5058] rounded-2xl px-5 py-3 shadow-2xl flex items-center space-x-4 animate-slideDown">
          <span className="text-xs text-white">
            Resume from <strong className="text-[#5865F2]">{formatTime(resumeToast.timeMs)}</strong>?
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={resumeAtSaved}
              className="px-3 py-1 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold cursor-pointer"
            >
              Resume
            </button>
            <button
              onClick={() => setResumeToast({ visible: false, timeMs: 0 })}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[#949BA4] text-xs font-medium cursor-pointer"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Top Header Controls Overlay (Accessible in all modes) */}
      <div
        className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between px-6 z-30 transition-opacity duration-300 ${
          showControls || isEmbed || isMkv ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer border border-white/15 shadow-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h2 className="text-sm font-bold text-white tracking-wide line-clamp-1 max-w-md drop-shadow">
            {current?.title}
          </h2>
        </div>

        {/* Source Switcher Pills */}
        <div className="flex items-center space-x-2">
          {availableSources.length > 1 && (
            <div className="flex items-center space-x-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-2xl">
              <div className="px-2 text-[10px] font-bold text-[#80848E] uppercase tracking-wider flex items-center space-x-1">
                <Layers className="w-3 h-3 text-[#5865F2]" />
                <span className="hidden sm:inline">Source</span>
              </div>
              {availableSources.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedSourceIdx(idx);
                    setHasError(false);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedSourceIdx === idx
                      ? 'bg-[#5865F2] text-white shadow-md'
                      : 'text-[#949BA4] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {src.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar Overlay (Native Video Only) */}
      {!isEmbed && !isMkv && (
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-6 pt-12 z-30 transition-opacity duration-300 flex flex-col space-y-3 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Scrub Bar */}
          <div
            onClick={handleSeek}
            className="relative w-full h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer transition-all group"
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
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform" />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={() => skip(-10)}
                className="w-9 h-9 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => skip(10)}
                className="w-9 h-9 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Forward 10s"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center space-x-2 group">
                <button
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5 text-[#F23F43]" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
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
                  className="w-20 h-1 accent-[#5865F2] cursor-pointer"
                />
              </div>

              {/* Time Display */}
              <div className="text-xs font-mono text-[#F2F3F5] tracking-wide ml-2">
                <span>{formatTime(currentTime)}</span>
                <span className="text-[#80848E] mx-1">/</span>
                <span className="text-[#949BA4]">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2">
              {/* Speed Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-xs font-bold text-white tracking-wider cursor-pointer"
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
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                          playbackSpeed === s
                            ? 'bg-[#5865F2] text-white'
                            : 'text-[#949BA4] hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{s}x</span>
                        {playbackSpeed === s && <Check className="w-3 h-3" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Aspect Ratio Switcher */}
              <button
                onClick={() => {
                  setAspectRatio((prev) =>
                    prev === 'contain' ? 'cover' : prev === 'cover' ? 'fill' : 'contain'
                  );
                }}
                className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-xs font-bold text-[#949BA4] hover:text-white tracking-wider uppercase cursor-pointer"
                title="Toggle Aspect Ratio"
              >
                {aspectRatio}
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-full hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
