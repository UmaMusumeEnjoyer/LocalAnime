import { useRef, useState, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../../store/playerStore.ts';
import styles from './VideoPlayer.module.css';
import { Play, Pause, ArrowLeft, Maximize, Minimize, Volume2, VolumeX, Settings, RotateCcw, RotateCw } from 'lucide-react';
import JASSUB from 'jassub';
import { parseSubtitle } from '../../services/subtitleParser.ts';
import type { SubtitleCue } from '../../services/subtitleParser.ts';
import SubtitleOverlay from './SubtitleOverlay.tsx';
import TrackSelector from './TrackSelector.tsx';
import type { SubtitleOption, AudioTrackOption } from './TrackSelector.tsx';
import { useSubtitleTiming } from '../../hooks/useSubtitleTiming.ts';

/** Detect mobile browser */
const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/** localStorage key helpers */
const getSubtitlePrefKey = (videoId: string) => `subtitle-pref-${videoId}`;

export default function VideoPlayer() {
  const { videos, currentVideo, setCurrentVideo, updatePlaybackHistory, getPlaybackHistory } = usePlayerStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const jassubInstanceRef = useRef<any>(null);
  const seekBarRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');

  const [subtitles, setSubtitles] = useState<SubtitleOption[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([]);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string>('none');
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(1);
  const [showSettings, setShowSettings] = useState(false);
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [targetSeekTime, setTargetSeekTime] = useState<number | null>(null);

  // Custom seek bar state
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreviewTime, setSeekPreviewTime] = useState<number | null>(null);

  const { offset, adjustOffset, resetOffset } = useSubtitleTiming(currentVideo?.id || '', selectedSubtitleId);

  const lastTap = useRef({ time: 0 });
  const controlsTimeoutRef = useRef<number | null>(null);

  // ─── Controls auto-hide ───────────────────────────────
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = window.setTimeout(() => {
        if (isPlaying && !showSettings) {
          setShowControls(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => {
      resetControlsTimeout();
    };

    window.addEventListener('mousemove', handleMouseMove);
    resetControlsTimeout();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showSettings]);

  // ─── Fullscreen change listener ───────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(isFS);

      // Unlock orientation when leaving fullscreen
      if (!isFS && screen.orientation && (screen.orientation as any).unlock) {
        try {
          (screen.orientation as any).unlock();
        } catch (_) { /* ignore */ }
      }
    };

    const handleWebkitEndFullscreen = () => {
      setIsFullscreen(false);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    // iOS Safari: listen on video element
    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.addEventListener('webkitendfullscreen', handleWebkitEndFullscreen);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      if (videoEl) {
        videoEl.removeEventListener('webkitendfullscreen', handleWebkitEndFullscreen);
      }
    };
  }, []);

  // ─── Fetch subtitles & auto-select default ────────────
  useEffect(() => {
    if (!currentVideo) return;

    fetch(`/api/videos/${currentVideo.id}/subtitles`)
      .then((res) => res.json())
      .then((data: SubtitleOption[]) => {
        const list: SubtitleOption[] = [
          { id: 'none', name: 'Tắt phụ đề', language: '', type: 'none' },
          ...data,
        ];
        setSubtitles(list);

        // Auto-select subtitle: check localStorage first, then pick default
        const savedPref = localStorage.getItem(getSubtitlePrefKey(currentVideo.id));
        if (savedPref && list.some((s) => s.id === savedPref)) {
          setSelectedSubtitleId(savedPref);
        } else if (data.length > 0) {
          // Prioritize Vietnamese subtitle
          const viSub = data.find(
            (s) =>
              s.language.toLowerCase().includes('vi') ||
              s.name.toLowerCase().includes('vie') ||
              s.name.toLowerCase().includes('việt')
          );
          const defaultSub = viSub || data[0];
          setSelectedSubtitleId(defaultSub.id);
          localStorage.setItem(getSubtitlePrefKey(currentVideo.id), defaultSub.id);
        }
      })
      .catch((err) => console.error('Error fetching subtitles:', err));

    fetch(`/api/videos/${currentVideo.id}/audio-tracks`)
      .then((res) => res.json())
      .then((data) => {
        setAudioTracks(data);
        if (data.length > 0) {
          setSelectedAudioIndex(data[0].index);
        }
      })
      .catch((err) => console.error('Error fetching audio tracks:', err));
  }, [currentVideo]);

  // Save subtitle preference when user changes it
  useEffect(() => {
    if (currentVideo && selectedSubtitleId) {
      localStorage.setItem(getSubtitlePrefKey(currentVideo.id), selectedSubtitleId);
    }
  }, [selectedSubtitleId, currentVideo]);

  // ─── Subtitle rendering (JASSUB / text) ───────────────
  useEffect(() => {
    if (!currentVideo) return;

    if (jassubInstanceRef.current) {
      jassubInstanceRef.current.destroy();
      jassubInstanceRef.current = null;
    }
    setCues([]);

    if (selectedSubtitleId === 'none') return;

    const selectedSub = subtitles.find((s) => s.id === selectedSubtitleId);
    if (!selectedSub) return;

    const subUrl =
      selectedSub.type === 'embedded'
        ? `/api/videos/${currentVideo.id}/subtitles/${selectedSub.id}`
        : `/api/videos/${currentVideo.id}/external-subs/${selectedSub.id}`;

    const codec = selectedSub.codec || '';
    const isAss =
      codec.toLowerCase().includes('ass') ||
      codec.toLowerCase().includes('ssa') ||
      selectedSub.name.toLowerCase().endsWith('.ass');

    if (isAss) {
      if (videoRef.current && canvasRef.current) {
        try {
          jassubInstanceRef.current = new (JASSUB as any)({
            video: videoRef.current,
            canvas: canvasRef.current,
            subUrl: subUrl,
            workerUrl: '/jassub/jassub-worker.js',
          });
          if (offset !== 0) {
            jassubInstanceRef.current.setDelay(offset);
          }
        } catch (err) {
          console.error('Failed to initialize JASSUB:', err);
        }
      }
    } else {
      fetch(subUrl)
        .then((res) => res.text())
        .then((text) => {
          const format = selectedSub.name.toLowerCase().endsWith('.vtt') ? 'vtt' : 'srt';
          const parsedCues = parseSubtitle(text, format);
          setCues(parsedCues);
        })
        .catch((err) => console.error('Failed to load text subtitle:', err));
    }

    return () => {
      if (jassubInstanceRef.current) {
        jassubInstanceRef.current.destroy();
        jassubInstanceRef.current = null;
      }
    };
  }, [selectedSubtitleId, subtitles, currentVideo]);

  useEffect(() => {
    if (jassubInstanceRef.current) {
      jassubInstanceRef.current.setDelay(offset);
    }
  }, [offset]);

  if (!currentVideo) return null;

  const videoSrc =
    audioTracks.length > 1
      ? `/api/videos/${currentVideo.id}/stream?audioTrack=${selectedAudioIndex}`
      : `/api/videos/${currentVideo.id}/stream`;

  // ─── Video event handlers ─────────────────────────────

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);

      if (targetSeekTime !== null) {
        videoRef.current.currentTime = targetSeekTime;
        setTargetSeekTime(null);
        if (isPlaying) {
          videoRef.current.play().catch((err) => console.log('Autoplay error', err));
        }
      } else {
        const savedTime = getPlaybackHistory(currentVideo.id);
        if (savedTime && savedTime < videoRef.current.duration) {
          videoRef.current.currentTime = savedTime;
        }
        videoRef.current.play().catch((err) => console.log('Autoplay error', err));
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && !isSeeking) {
      const curTime = videoRef.current.currentTime;
      setCurrentTime(curTime);
      updatePlaybackHistory(currentVideo.id, curTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch((err) => console.log('Autoplay error', err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // ─── Custom Seek Bar ──────────────────────────────────

  const getSeekTimeFromEvent = (
    e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement> | TouchEvent | MouseEvent
  ): number => {
    if (!seekBarRef.current) return 0;
    const rect = seekBarRef.current.getBoundingClientRect();
    let clientX: number;

    if ('touches' in e) {
      clientX = e.touches.length > 0 ? e.touches[0].clientX : (e as TouchEvent).changedTouches[0].clientX;
    } else {
      clientX = (e as MouseEvent).clientX;
    }

    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * (duration || 0);
  };

  const handleSeekStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsSeeking(true);
    const time = getSeekTimeFromEvent(e);
    setSeekPreviewTime(time);
    setCurrentTime(time);
  };

  const handleSeekMove = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!isSeeking) return;
      e.preventDefault();
      const time = getSeekTimeFromEvent(e);
      setSeekPreviewTime(time);
      setCurrentTime(time);
    },
    [isSeeking, duration]
  );

  const handleSeekEnd = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (!isSeeking) return;
      const time = getSeekTimeFromEvent(e);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
      setCurrentTime(time);
      setIsSeeking(false);
      setSeekPreviewTime(null);
    },
    [isSeeking, duration]
  );

  // Attach global listeners for seek move/end so dragging works even outside the bar
  useEffect(() => {
    if (isSeeking) {
      window.addEventListener('touchmove', handleSeekMove, { passive: false });
      window.addEventListener('touchend', handleSeekEnd);
      window.addEventListener('mousemove', handleSeekMove);
      window.addEventListener('mouseup', handleSeekEnd);
    }
    return () => {
      window.removeEventListener('touchmove', handleSeekMove);
      window.removeEventListener('touchend', handleSeekEnd);
      window.removeEventListener('mousemove', handleSeekMove);
      window.removeEventListener('mouseup', handleSeekEnd);
    };
  }, [isSeeking, handleSeekMove, handleSeekEnd]);

  // ─── Volume ────────────────────────────────────────────

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      videoRef.current.muted = nextMute;
    }
  };

  // ─── Fullscreen (mobile-aware) ─────────────────────────

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      // On iOS Safari, use native video fullscreen for true fullscreen
      if (isMobile() && videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
        try {
          (videoRef.current as any).webkitEnterFullscreen();
          setIsFullscreen(true);
          return;
        } catch (_) { /* fallback below */ }
      }

      // Standard Fullscreen API
      try {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
      } catch (err) {
        console.log('Fullscreen request failed:', err);
      }

      // Lock landscape on mobile Android
      if (isMobile() && screen.orientation && (screen.orientation as any).lock) {
        try {
          await (screen.orientation as any).lock('landscape');
        } catch (_) { /* not supported or denied */ }
      }

      // State is set by the fullscreenchange listener
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
      } catch (err) {
        console.log('Exit fullscreen failed:', err);
      }
      // State is set by the fullscreenchange listener
    }
  };

  // ─── Skip (tua) ────────────────────────────────────────

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      const sign = seconds > 0 ? '+' : '';
      showFeedback(`${sign}${seconds}s`);
    }
  };

  // ─── Double-tap to skip (kept as supplementary) ────────

  const handleVideoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    setShowControls(true);

    if (now - lastTap.current.time < DOUBLE_TAP_DELAY) {
      const rect = e.currentTarget.getBoundingClientRect();
      const tapX = e.clientX - rect.left;
      const width = rect.width;

      if (videoRef.current) {
        if (tapX < width / 2) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          showFeedback('⏪ -10s');
        } else {
          videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
          showFeedback('⏩ +10s');
        }
      }
    }

    lastTap.current = { time: now };
  };

  const showFeedback = (text: string) => {
    setFeedbackText(text);
    setTimeout(() => {
      setFeedbackText('');
    }, 800);
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // ─── Audio track switch ────────────────────────────────

  const handleSelectAudio = (index: number) => {
    if (videoRef.current) {
      const curTime = videoRef.current.currentTime;
      setTargetSeekTime(curTime);
      setSelectedAudioIndex(index);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 50);
    }
  };

  // ─── Auto-play next ────────────────────────────────────

  const handleEnded = () => {
    const currentIndex = videos.findIndex((v) => v.id === currentVideo.id);
    if (currentIndex !== -1 && currentIndex < videos.length - 1) {
      const nextVideo = videos[currentIndex + 1];
      setCurrentVideo(nextVideo);
    }
  };

  // ─── Computed values for seek bar ──────────────────────

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.videoWrapper} onClick={handleVideoTap}>
        <video
          ref={videoRef}
          data-testid="video-element"
          className={styles.video}
          src={videoSrc}
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
        />

        <canvas ref={canvasRef} className={styles.canvas} />

        <SubtitleOverlay currentTime={currentTime} cues={cues} offset={offset} />

        {feedbackText && (
          <div className={styles.feedback}>
            {feedbackText}
          </div>
        )}
      </div>

      {showControls && (
        <div className={styles.overlay}>
          <div className={styles.topBar}>
            <button
              aria-label="back"
              className={styles.iconButton}
              onClick={() => setCurrentVideo(null)}
            >
              <ArrowLeft size={24} />
            </button>
            <span className={styles.videoTitle}>{currentVideo.name}</span>
            <div style={{ width: 44 }} />
          </div>

          <div className={styles.bottomBar}>
            {/* Custom Seek Bar */}
            <div className={styles.progressRow}>
              <span className={styles.timeLabel}>{formatTime(currentTime)}</span>

              <div
                ref={seekBarRef}
                className={`${styles.seekBarContainer} ${isSeeking ? styles.seekBarContainerSeeking : ''}`}
                onTouchStart={handleSeekStart}
                onMouseDown={handleSeekStart}
              >
                <div className={styles.seekBarTrack}>
                  <div
                    className={styles.seekBarFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                  <div
                    className={styles.seekBarThumb}
                    style={{ left: `${progressPercent}%` }}
                  />
                </div>

                {isSeeking && seekPreviewTime !== null && (
                  <div
                    className={styles.seekPreview}
                    style={{ left: `${(seekPreviewTime / (duration || 1)) * 100}%` }}
                  >
                    {formatTime(seekPreviewTime)}
                  </div>
                )}
              </div>

              <span className={styles.timeLabel}>{formatTime(duration)}</span>
            </div>

            {/* Controls Row */}
            <div className={styles.controlsRow}>
              <div className={styles.controlsGroup}>
                <button
                  aria-label="play-pause"
                  className={styles.iconButton}
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>

                {/* Skip buttons: -10s, -5s, +5s, +10s */}
                <button
                  aria-label="rewind-10"
                  className={styles.skipButton}
                  onClick={() => handleSkip(-10)}
                >
                  <RotateCcw size={22} />
                  <span className={styles.skipLabel}>10</span>
                </button>
                <button
                  aria-label="rewind-5"
                  className={styles.skipButton}
                  onClick={() => handleSkip(-5)}
                >
                  <RotateCcw size={20} />
                  <span className={styles.skipLabel}>5</span>
                </button>
                <button
                  aria-label="forward-5"
                  className={styles.skipButton}
                  onClick={() => handleSkip(5)}
                >
                  <RotateCw size={20} />
                  <span className={styles.skipLabel}>5</span>
                </button>
                <button
                  aria-label="forward-10"
                  className={styles.skipButton}
                  onClick={() => handleSkip(10)}
                >
                  <RotateCw size={22} />
                  <span className={styles.skipLabel}>10</span>
                </button>

                <div className={styles.volumeContainer}>
                  <button
                    aria-label="mute"
                    className={styles.iconButton}
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                  </button>
                  <input
                    type="range"
                    className={styles.volumeBar}
                    min={0}
                    max={1}
                    step={0.1}
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                  />
                </div>
              </div>

              <div className={styles.controlsGroup}>
                <button
                  aria-label="settings"
                  className={styles.iconButton}
                  onClick={() => setShowSettings(true)}
                >
                  <Settings size={24} />
                </button>

                <button
                  aria-label="fullscreen"
                  className={styles.iconButton}
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <TrackSelector
          subtitles={subtitles}
          selectedSubtitleId={selectedSubtitleId}
          audioTracks={audioTracks}
          selectedAudioIndex={selectedAudioIndex}
          onSelectSubtitle={(sub) => setSelectedSubtitleId(sub.id)}
          onSelectAudio={handleSelectAudio}
          onClose={() => setShowSettings(false)}
          offset={offset}
          onAdjustOffset={adjustOffset}
          onResetOffset={resetOffset}
        />
      )}
    </div>
  );
}
