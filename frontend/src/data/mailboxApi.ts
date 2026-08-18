/**
 * Cliente del backend real para el Buzón (/api/mailbox) — 100% independiente
 * de Chats. Manda y recibe correo real por Mailgun con la dirección
 * {username}@clerk-ship.online, una vez que el usuario autoriza crearla
 * (ver MailboxPage.tsx). Detalle de cómo "recibe" sin webhook público en
 * pruebas/back/flask-api/app/mailbox.py.
 */
import { apiFetch } from './apiClient';

export type MailboxFolder = 'inbox' | 'sent' | 'trash';

export interface MailboxAttachmentMeta {
  name: string;
  mime_type: string;
  size_bytes: number;
}

export interface MailboxAttachmentData extends MailboxAttachmentMeta {
  /** Base64 sin el prefijo "data:...;base64,". Solo viene en el detalle de un mensaje. */
  data: string;
}

export interface MailboxMessageSummary {
  id: string;
  direction: 'inbound' | 'outbound';
  folder: MailboxFolder;
  from_address: string;
  to_addresses: string[];
  cc_addresses: string[];
  subject: string;
  text_body: string;
  html_body: string | null;
  attachments: MailboxAttachmentMeta[];
  read: boolean;
  starred: boolean;
  created_at: string | null;
}

export interface MailboxMessageDetail extends Omit<MailboxMessageSummary, 'attachments'> {
  attachments: MailboxAttachmentData[];
}

export interface MailboxStatus {
  mailbox_created: boolean;
  address: string | null;
  unread_count: number;
}

export function getMailboxStatus(): Promise<MailboxStatus> {
  return apiFetch('/api/mailbox/status');
}

export function setupMailbox(): Promise<{ mailbox_created: true; address: string }> {
  return apiFetch('/api/mailbox/setup', { method: 'POST' });
}

export function listMailboxMessages(folder: MailboxFolder): Promise<{ messages: MailboxMessageSummary[] }> {
  return apiFetch(`/api/mailbox/messages?folder=${folder}`);
}

export function getMailboxMessage(id: string): Promise<{ message: MailboxMessageDetail }> {
  return apiFetch(`/api/mailbox/messages/${id}`);
}

export interface ComposePayload {
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  attachments?: { name: string; mime_type: string; data: string }[];
  in_reply_to?: string;
}

export function sendMailboxMessage(payload: ComposePayload): Promise<{ message: MailboxMessageSummary }> {
  return apiFetch('/api/mailbox/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateMailboxMessage(
  id: string,
  updates: { read?: boolean; starred?: boolean; folder?: MailboxFolder },
): Promise<{ ok: boolean }> {
  return apiFetch(`/api/mailbox/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export function deleteMailboxMessage(id: string): Promise<{ ok: boolean; deleted: boolean }> {
  return apiFetch(`/api/mailbox/messages/${id}`, { method: 'DELETE' });
}
