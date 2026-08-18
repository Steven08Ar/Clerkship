import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { registerVoiceAudio, unregisterVoiceAudio, notifyPlaying, playRegisteredAudio } from '../../utils/audioPlaybackCoordinator';

const SPEEDS = [0.5, 0.75, 1, 1.5, 2] as const;

interface VoiceMessagePlayerProps {
  /** Id único y estable del mensaje (client_id || _id) — con qué se
   *  registra este audio en el coordinador, y con qué otro reproductor
   *  le puede pedir "reprodúcete" cuando el audio anterior termina. */
  id: string;
  /** data URI completo: `data:audio/webm;base64,....` */
  src: string;
  /** Forma de onda resumida (0-1 por barra) capturada al grabar. */
  waveform: number[];
  durationSeconds: number;
  variant: 'user' | 'contact';
  /** Id del SIGUIENTE mensaje de audio en la conversación, solo si es
   *  inmediatamente el que sigue a este (audios "seguidos") — si existe,
   *  se reproduce solo apenas termina este. */
  autoPlayNextId?: string | null;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Reproductor estilo WhatsApp: forma de onda que se puede arrastrar para
 * adelantar/atrasar, botón de velocidad que cicla entre 5 valores, y
 * coordinado con el resto de la conversación — nunca suenan dos notas de
 * voz a la vez ("el último que le des play gana"), y si el mensaje
 * siguiente también es una nota de voz, se encadena sola al terminar esta.
 */
export default function VoiceMessagePlayer({ id, src, waveform, durationSeconds, variant, autoPlayNextId }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [speedIndex, setSpeedIndex] = useState(2); // arranca en 1x
  const [isDragging, setIsDragging] = useState(false);

  /* Se registra en el coordinador global apenas existe el <audio>, para que
     otros reproductores puedan pausarme o (si soy el "siguiente" de una
     cadena) encontrarme y reproducirme. */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    registerVoiceAudio(id, audio);
    return () => unregisterVoiceAudio(id);
  }, [id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function onTimeUpdate() {
      if (!audio!.duration || isDragging) return;
      setProgress(audio!.currentTime / audio!.duration);
    }
    // isPlaying se sincroniza SIEMPRE desde los eventos nativos del <audio>,
    // nunca a mano en togglePlay — así, sin importar si a este audio lo
    // pausó el usuario o lo pausó el coordinador (porque otro empezó a
    // sonar), el ícono de play/pause de este reproductor queda correcto.
    function onPlay() { setIsPlaying(true); }
    function onPause() { setIsPlaying(false); }
    function onEnded() {
      setIsPlaying(false);
      setProgress(0);
      if (autoPlayNextId) playRegisteredAudio(autoPlayNextId);
    }

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [isDragging, autoPlayNextId]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      notifyPlaying(audio); // pausa cualquier otra nota de voz que estuviera sonando
      audio.play().catch(() => {});
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
