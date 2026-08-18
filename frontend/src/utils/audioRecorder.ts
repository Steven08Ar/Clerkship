/**
 * Grabación de notas de voz real, con MediaRecorder (nativo del navegador,
 * sin librerías externas). Diseño pensado para que el archivo final sea muy
 * liviano, ya que se guarda como texto (base64) dentro del documento de
 * Mongo del mensaje — no hay todavía un bucket de almacenamiento de archivos
 * conectado (Supabase Storage u otro), así que había que evitar que esto
 * pese mucho:
 *
 * - Codec Opus (audio/webm;codecs=opus) — diseñado específicamente para voz,
 *   mucho más eficiente que MP3/WAV para este caso de uso.
 * - audioBitsPerSecond bajo (24 kbps) — de sobra para que una nota de voz se
 *   entienda perfectamente, y reduce el tamaño del archivo drásticamente
 *   frente a la calidad "de música" por defecto (~128 kbps).
 *   Con esto, un minuto de audio pesa ~180 KB (antes de pasar a base64).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const WAVEFORM_BARS = 40;

export interface RecordingResult {
  base64: string;
  mimeType: string;
  durationSeconds: number;
  /** Resumen de amplitud (0-1) a lo largo del audio, para dibujar la forma
   *  de onda al reproducirlo — no es el audio en sí, son 40 números. */
  waveform: number[];
}

function pickMimeType(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return candidates.find(t => window.MediaRecorder?.isTypeSupported?.(t)) || '';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function downsampleWaveform(samples: number[], targetCount: number): number[] {
  if (samples.length === 0) return Array(targetCount).fill(0.08);
  const bucketSize = Math.max(1, Math.floor(samples.length / targetCount));
  const result: number[] = [];
  for (let i = 0; i < targetCount; i++) {
    const bucket = samples.slice(i * bucketSize, (i + 1) * bucketSize);
    const avg = bucket.length ? bucket.reduce((a, b) => a + b, 0) / bucket.length : 0;
    result.push(Math.max(0.08, Math.min(1, avg)));
  }
  return result;
}

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [liveAmplitude, setLiveAmplitude] = useState<number[]>(Array(WAVEFORM_BARS).fill(0.08));
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const waveformSamplesRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef(0);
  const isPausedRef = useRef(false);

  function currentElapsedMs() {
    return accumulatedMsRef.current + (isPausedRef.current ? 0 : Date.now() - segmentStartRef.current);
  }

  // Se guarda en un ref (no useCallback) para poder recursionar sobre sí
  // misma vía requestAnimationFrame sin depender de "declararse antes de usarse".
  // La asignación va en un efecto (no en el cuerpo del render) porque React
  // no permite mutar un ref durante el render.
  const sampleLoopRef = useRef<() => void>(() => {});
  useEffect(() => {
    sampleLoopRef.current = () => {
      const analyser = analyserRef.current;
      if (!analyser) return;

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);

      const timeData = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(timeData);

      let sumSquares = 0;
      for (let i = 0; i < timeData.length; i++) {
        const v = (timeData[i] - 128) / 128;
        sumSquares += v * v;
      }
      const rms = Math.sqrt(sumSquares / timeData.length);
      const rmsLevel = Math.min(1, rms * 5.5);

      if (!isPausedRef.current) {
        waveformSamplesRef.current.push(rmsLevel);

        // Visualizador continuo fluido (centro a lados) que sube y baja según el micrófono
        const HALF_BARS = WAVEFORM_BARS / 2; // 20 barras por lado
        const binStep = Math.max(1, Math.floor((freqData.length * 0.45) / HALF_BARS));
        const t = Date.now() * 0.005; // Fase de animación continua

        const halfBars: number[] = [];
        for (let j = 0; j < HALF_BARS; j++) {
          const normDist = j / (HALF_BARS - 1); // 0 en el centro, 1 en extremo

          // Muestreo de frecuencia del micrófono en tiempo real
          const rawFreq = freqData[j * binStep] || 0;
          const normFreq = rawFreq / 255;

          // Sensibilidad al volumen de voz (RMS + frecuencia)
          const micVolume = Math.min(1, Math.max(normFreq * 1.1, rmsLevel * 3.2));

          // Envolvente suave con mayor respuesta en el centro
          const centerEnvelope = Math.cos(normDist * (Math.PI * 0.38));

          // Onda continua orgánica compuesta (oscila permanentemente)
          const osc1 = Math.sin(t * 3.5 - normDist * 3.8);
          const osc2 = Math.cos(t * 2.2 + normDist * 2.4) * 0.45;
          const continuousBase = (osc1 + osc2 + 1.45) / 2.9; // Normalizado ~0.15 a 1.0

          // La altura total de la onda continua escala directamente con el volumen del micrófono
          // Cuando no habla: altura baja (~10% - 18%)
          // Cuando habla: la onda sube y se expande en vivo (~40% - 100%)
          const heightMultiplier = 0.12 + (micVolume * 0.88 * centerEnvelope);
          const finalLevel = Math.min(1, Math.max(0.08, continuousBase * heightMultiplier * 1.5));

          halfBars.push(finalLevel);
        }

        // Espejo simétrico del centro a los lados
        const newBars: number[] = [...[...halfBars].reverse(), ...halfBars];

        setLiveAmplitude(newBars);
      }
      rafRef.current = requestAnimationFrame(() => sampleLoopRef.current());
    };
  });

  function cleanupTracksAndContext() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close().catch(() => {});
    streamRef.current = null;
    audioContextRef.current = null;
    analyserRef.current = null;
    mediaRecorderRef.current = null;
  }

  function resetState() {
    setIsRecording(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setLiveAmplitude(Array(WAVEFORM_BARS).fill(0.08));
    isPausedRef.current = false;
    accumulatedMsRef.current = 0;
    chunksRef.current = [];
    waveformSamplesRef.current = [];
  }

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, {
        ...(mimeType ? { mimeType } : {}),
        audioBitsPerSecond: 24000,
      });
      chunksRef.current = [];
      waveformSamplesRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      mediaRecorderRef.current = recorder;

      accumulatedMsRef.current = 0;
      segmentStartRef.current = Date.now();
      isPausedRef.current = false;
      setElapsedSeconds(0);
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(Math.floor(currentElapsedMs() / 1000));
      }, 200);

      rafRef.current = requestAnimationFrame(() => sampleLoopRef.current());
    } catch {
      setError('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
    }
  }, []);

  const pause = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;
    recorder.pause();
    accumulatedMsRef.current += Date.now() - segmentStartRef.current;
    isPausedRef.current = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'paused') return;
    recorder.resume();
    segmentStartRef.current = Date.now();
    isPausedRef.current = false;
    setIsPaused(false);
  }, []);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    cleanupTracksAndContext();
    resetState();
  }, []);

  const stop = useCallback((): Promise<RecordingResult | null> => {
    return new Promise(resolve => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') { resolve(null); return; }

      recorder.onstop = async () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const durationSeconds = Math.max(1, Math.round(currentElapsedMs() / 1000));
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const base64 = await blobToBase64(blob);
        const waveform = downsampleWaveform(waveformSamplesRef.current, WAVEFORM_BARS);

        cleanupTracksAndContext();
        resetState();
        resolve({ base64, mimeType, durationSeconds, waveform });
      };
      recorder.stop();
    });
  }, []);

  return { isRecording, isPaused, elapsedSeconds, liveAmplitude, error, start, pause, resume, stop, cancel };
}
