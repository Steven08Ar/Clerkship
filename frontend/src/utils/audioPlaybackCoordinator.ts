/**
 * Coordina la reproducción de notas de voz en toda la página de Chats.
 *
 * No es un hook ni vive en React — es un registro simple a nivel de módulo
 * (un `Map`), a propósito: cada `VoiceMessagePlayer` es independiente y no
 * sabe nada de los demás, pero todos necesitan poder:
 *   1. Pausar cualquier otro audio que esté sonando cuando yo empiezo a sonar
 *      (nunca dos notas de voz a la vez — "el último que le des play gana").
 *   2. Encontrar y reproducir la SIGUIENTE nota de voz cuando la mía termina,
 *      si el mensaje inmediatamente después en el chat también es audio
 *      (reproducción encadenada de notas de voz seguidas).
 *
 * `ChatsPage.tsx` decide QUÉ id sigue (mirando la lista real de mensajes);
 * este archivo solo sabe CÓMO encontrar el <audio> de ese id y reproducirlo.
 */

const registry = new Map<string, HTMLAudioElement>();
let currentlyPlaying: HTMLAudioElement | null = null;

export function registerVoiceAudio(id: string, audio: HTMLAudioElement) {
  registry.set(id, audio);
}

export function unregisterVoiceAudio(id: string) {
  registry.delete(id);
  if (currentlyPlaying && registry.get(id) === currentlyPlaying) {
    currentlyPlaying = null;
  }
}

/** Avisa que este <audio> va a sonar — pausa cualquier otro que estuviera sonando. */
export function notifyPlaying(audio: HTMLAudioElement) {
  if (currentlyPlaying && currentlyPlaying !== audio) {
    currentlyPlaying.pause();
  }
  currentlyPlaying = audio;
}

/** Busca el <audio> de `id` en el registro y lo reproduce (para la cadena de audios seguidos). */
export function playRegisteredAudio(id: string) {
  const audio = registry.get(id);
  if (!audio) return;
  notifyPlaying(audio);
  audio.play().catch(() => {
    // Autoplay bloqueado por el navegador (poco probable, ya hubo interacción
    // del usuario para llegar hasta acá) — se ignora, el usuario puede darle play a mano.
  });
}
