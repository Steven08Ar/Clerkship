/**
 * Estado global (ligero) de "tengo mensajes sin leer en Chats" — lo usa el
 * ícono de Chats en el Sidebar de toda la plataforma (no solo dentro de
 * /chats), para mostrarle un punto rojo al usuario sin tener que entrar.
 *
 * No hay WebSockets todavía, así que esto hace polling propio y liviano
 * (mucho más espaciado que el poll de 1s de una conversación abierta). El
 * evento CHATS_READ_EVENT permite que ChatsPage le avise "ya se marcó como
 * leído" para que el punto rojo desaparezca al toque, sin esperar el
 * siguiente poll.
 */
import { useEffect, useState } from 'react';
import { listConversations } from '../data/chatsApi';
import { getAccessToken } from '../data/mainAuth';

export const CHATS_READ_EVENT = 'clerkship-chats-read';

// 4s se siente casi instantáneo para una notificación en segundo plano, sin
// convertir esto en un poll agresivo corriendo en TODAS las páginas de la app.
const POLL_MS = 4000;

export function useChatsHasUnread(): boolean {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!getAccessToken()) return;
      try {
        const { conversations } = await listConversations();
        if (cancelled) return;
        setHasUnread(conversations.some(c => (c.unread_count || 0) > 0));
      } catch {
        // Silencioso — un fallo puntual no debe ensuciar el resto de la UI.
      }
    }

    check();
    const interval = setInterval(check, POLL_MS);
    window.addEventListener(CHATS_READ_EVENT, check);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener(CHATS_READ_EVENT, check);
    };
  }, []);

  return hasUnread;
}
