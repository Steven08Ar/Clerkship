import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

const SPEEDS = [0.5, 0.75, 1, 1.5, 2] as const;

interface VoiceMessagePlayerProps {
  /** data URI completo: `data:audio/webm;base64,....` */
  src: string;
  /** Forma de onda resumida (0-1 por barra) capturada al grabar. */
  waveform: number[];
  durationSeconds: number;
  variant: 'user' | 'contact';
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/** Reproductor estilo WhatsApp: forma de onda que se puede arrastrar para
 *  adelantar/atrasar, y un botón de velocidad que cicla entre 5 valores. */
export default function VoiceMessagePlayer({ src, waveform, durationSeconds, variant }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [speedIndex, setSpeedIndex] = useState(2); // arranca en 1x
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function onTimeUpdate() {
      if (!audio!.duration || isDragging) return;
      setProgress(audio!.currentTime / audio!.duration);
    }
    function onEnded() {
      setIsPlaying(false);
      setProgress(0);
    }

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [isDragging]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }

  function cycleSpeed() {
    const nextIndex = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(nextIndex);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[nextIndex];
  }

  function seekFromClientX(clientX: number) {
    const el = waveformRef.current;
    const audio = audioRef.current;
    if (!el || !audio || !audio.duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setProgress(ratio);
    audio.currentTime = ratio * audio.duration;
  }

  function handlePointerDown(e: React.PointerEvent) {
    setIsDragging(true);
    seekFromClientX(e.clientX);
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    seekFromClientX(e.clientX);
  }
  function handlePointerUp() {
    setIsDragging(false);
  }

  const currentSeconds = progress * durationSeconds;

  return (
    <div className={`voice-player ${variant}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button type="button" className="voice-player-play-btn" onClick={togglePlay} title={isPlaying ? 'Pausar' : 'Reproducir'}>
        {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
      </button>

      <div
        className="voice-player-waveform"
        ref={waveformRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {waveform.map((level, i) => {
          const barProgress = i / waveform.length;
          const played = barProgress <= progress;
          return (
            <span
              key={i}
              className={`voice-player-bar ${played ? 'played' : ''}`}
              style={{ height: `${Math.max(15, level * 100)}%` }}
            />
          );
        })}
      </div>

      <button type="button" className="voice-player-speed-btn" onClick={cycleSpeed} title="Velocidad de reproducción">
        {SPEEDS[speedIndex]}x
      </button>

      <span className="voice-player-time">
        {formatDuration(isPlaying || progress > 0 ? currentSeconds : durationSeconds)}
      </span>
    </div>
  );
}
