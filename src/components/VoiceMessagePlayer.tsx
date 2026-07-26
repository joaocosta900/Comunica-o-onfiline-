import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Mic, CheckCheck } from 'lucide-react';

interface VoiceMessagePlayerProps {
  url: string;
  fileName?: string;
  isMe?: boolean;
  timestamp?: string;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  url,
  fileName = 'audio_voz.webm',
  isMe = false,
  timestamp,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Telegram style waveform bar heights (32 thin bars)
  const waveformHeights = [
    25, 45, 20, 70, 95, 60, 35, 85, 100, 50,
    30, 80, 65, 90, 40, 75, 55, 95, 30, 60,
    40, 85, 50, 70, 30, 65, 40, 80, 25, 50,
    35, 20
  ];

  const durationRef = useRef(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        durationRef.current = audio.duration;
      }
    };

    // Fix for Chrome/Android MediaRecorder WebM blobs where duration is initially Infinity or NaN
    const handleLoadedData = () => {
      if (audio.duration === Infinity || isNaN(audio.duration)) {
        audio.currentTime = 1e101;
        const onSeeked = () => {
          audio.removeEventListener('seeked', onSeeked);
          if (isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
            durationRef.current = audio.duration;
          }
          audio.currentTime = 0;
        };
        audio.addEventListener('seeked', onSeeked);
      } else {
        updateDuration();
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
        durationRef.current = audio.duration;
      } else if (audio.currentTime > durationRef.current) {
        setDuration(audio.currentTime);
        durationRef.current = audio.currentTime;
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onPlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [url]);

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().then(() => setIsPlaying(true)).catch((err) => console.log('Audio play error:', err));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    const realDuration = (duration > 0 && isFinite(duration)) 
      ? duration 
      : (audio.duration && isFinite(audio.duration) ? audio.duration : 0);

    if (realDuration <= 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = pct * realDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cycleSpeed = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const speeds = [1, 1.5, 2];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveDuration = (duration > 0 && isFinite(duration))
    ? duration
    : (audioRef.current?.duration && isFinite(audioRef.current.duration) ? audioRef.current.duration : 0);

  const progressPct = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  return (
    <div className="flex items-center gap-3 py-1 px-1 select-none w-full min-w-[220px] max-w-[270px]">
      <audio ref={audioRef} src={url} preload="auto" />

      {/* Telegram-style Big White Circular Play Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-11 h-11 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg cursor-pointer transition-transform active:scale-95 hover:scale-105 ${
          isMe ? 'text-purple-600' : 'text-emerald-600'
        }`}
        title={isPlaying ? 'Pausar' : 'Reproduzir áudio'}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Details */}
      <div className="flex-1 min-w-0 space-y-1">
        {/* Interactive Waveform */}
        <div
          onClick={handleSeek}
          className="h-6 flex items-center gap-[2px] cursor-pointer group px-0.5"
          title="Clique para avançar/voltar no áudio"
        >
          {waveformHeights.map((h, i) => {
            const barPct = ((i + 1) / waveformHeights.length) * 100;
            const isPlayed = barPct <= progressPct || (progressPct >= 98 && i === waveformHeights.length - 1);

            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 min-w-[2px] rounded-full transition-colors duration-100 ${
                  isPlayed
                    ? 'bg-white'
                    : 'bg-white/35 group-hover:bg-white/50'
                }`}
              />
            );
          })}
        </div>

        {/* Telegram-Style Duration & Timestamp Row */}
        <div className="flex justify-between items-center text-[11px] text-white/90 font-sans leading-none pt-0.5">
          <div className="flex items-center gap-1 font-medium text-white/90">
            <Mic className="w-3 h-3 text-white/80 shrink-0" />
            <span>
              {isPlaying 
                ? formatTime(currentTime) 
                : (effectiveDuration > 0 ? formatTime(effectiveDuration) : '00:00')
              }
            </span>
            <span className="text-white/60">•</span>
          </div>

          <div className="flex items-center gap-1.5 text-white/80 text-[10px]">
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-1 py-0.2 rounded bg-white/20 hover:bg-white/30 text-[9px] font-bold text-white cursor-pointer transition-colors"
              title="Velocidade"
            >
              {playbackRate}x
            </button>

            <a
              href={url}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-0.5 hover:text-white text-white/80 cursor-pointer transition-colors"
              title="Baixar áudio"
            >
              <Download className="w-3 h-3" />
            </a>

            {timestamp && (
              <span className="flex items-center gap-0.5 text-[10px] text-white/70 ml-0.5 font-sans">
                {timestamp}
                {isMe && <CheckCheck className="w-3 h-3 text-cyan-200" />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
