/**
 * Punto rojo del ícono de Buzón en el Sidebar general — mismo patrón que
 * chatsUnread.ts. Poll propio y liviano, más espaciado que el de una
 * bandeja abierta.
 */
import { useEffect, useState } from 'react';
import { getMailboxStatus } from '../data/mailboxApi';
import { getAccessToken } from '../data/mainAuth';

export const MAILBOX_READ_EVENT = 'clerkship-mailbox-read';

const POLL_MS = 20000;

export function useMailboxHasUnread(): boolean {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!getAccessToken()) return;
      try {
        const status = await getMailboxStatus();
        if (cancelled) return;
        setHasUnread(status.mailbox_created && status.unread_count > 0);
      } catch {
        // Silencioso — un fallo puntual no debe ensuciar el resto de la UI.
      }
    }

    check();
    const interval = setInterval(check, POLL_MS);
    window.addEventListener(MAILBOX_READ_EVENT, check);
    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener(MAILBOX_READ_EVENT, check);
    };
  }, []);

  return hasUnread;
}
