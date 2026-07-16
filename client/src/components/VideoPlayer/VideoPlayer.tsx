import React, { useRef, useState, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import styles from './VideoPlayer.module.css';
import { Play, Pause, ArrowLeft, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';

export default function VideoPlayer() {
  const { currentVideo, setCurrentVideo, updatePlaybackHistory, getPlaybackHistory } = usePlayerStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');

  const lastTap = useRef({ time: 0 });
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
      setShowControls(true);
      controlsTimeoutRef.current = window.setTimeout(() => {
        if (isPlaying) {
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
  }, [isPlaying]);

  if (!currentVideo) return null;

  const videoSrc = `/api/videos/${currentVideo.id}/stream`;

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      const savedTime = getPlaybackHistory(currentVideo.id);
      if (savedTime && savedTime < videoRef.current.duration) {
        videoRef.current.currentTime = savedTime;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
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

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

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
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.videoWrapper} onClick={handleVideoTap}>
        <video
          ref={videoRef}
          data-testid="video-element"
          className={styles.video}
          src={videoSrc}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        
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
            <div className={styles.progressRow}>
              <span className={styles.timeLabel}>{formatTime(currentTime)}</span>
              <input
                type="range"
                className={styles.seekBar}
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeekChange}
              />
              <span className={styles.timeLabel}>{formatTime(duration)}</span>
            </div>

            <div className={styles.controlsRow}>
              <div className={styles.controlsGroup}>
                <button
                  aria-label="play-pause"
                  className={styles.iconButton}
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
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
    </div>
  );
}
