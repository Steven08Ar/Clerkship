/**
 * Cliente del backend real para Chats (/api/chats, /api/usuarios/buscar).
 * Reemplaza los datos mock que tenía ChatsPage.tsx — todo lo de esta
 * pantalla que sea conversación humana (DIRECT/GROUP/PUBLIC) viene de acá.
 *
 * El chat con agentes IA sigue sin implementar (depende de Casos Clínicos +
 * fastapi-service, ambos pendientes de definir con el equipo).
 */
import { apiFetch } from './apiClient';

export interface ParticipantInfo {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER';
  /** Última vez que este participante pidió los mensajes de la conversación
   *  (se actualiza solo en el backend al llamar listMessages). Sirve para
   *  saber si un mensaje mío ya fue leído o no. */
  last_read_at?: string | null;
}

export type ConversationType = 'DIRECT' | 'GROUP' | 'PUBLIC';

export interface LastMessagePreview {
  preview: string;
  sender_id: string;
  created_at: string | null;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name: string | null;
  course_id: string | null;
  ai_agent_id: string | null;
  updated_at: string | null;
  participants: ParticipantInfo[];
  /** Ausente en la respuesta de crear/reutilizar conversación (todavía no
   *  hay mensajes); siempre presente (puede ser null) en GET /api/chats. */
  last_message?: LastMessagePreview | null;
  /** Mensajes de otros que no he visto — ausente en crear/reutilizar,
   *  siempre presente en GET /api/chats. */
  unread_count?: number;
}

export interface VoiceNoteData {
  /** Audio en base64 (sin el prefijo "data:...;base64,"). Codec Opus, bitrate
   *  bajo (24 kbps) — pensado para pesar muy poco, ver utils/audioRecorder.ts. */
  data: string;
  mime_type: string;
  duration_seconds: number;
  /** 40 números (0-1) que resumen el volumen a lo largo del audio, para
   *  dibujar la forma de onda en el reproductor sin tener que decodificarlo. */
  waveform: number[];
}

export interface FileAttachmentInfo {
  name: string;
  mime_type: string;
  size_bytes: number;
  /** Archivo en base64 (sin el prefijo "data:...;base64,"). Las imágenes ya
   *  llegan comprimidas/redimensionadas desde utils/fileUpload.ts. */
  data: string;
}

export interface ChatMessage {
  _id: string;
  conversation_id: string;
  sender_type: 'student' | 'teacher';
  sender_id: string;
  content: string;
  file_attachment?: FileAttachmentInfo | null;
  audio?: VoiceNoteData | null;
  created_at: string;
  /** Solo local (nunca viene del backend): id estable para el envío optimista,
   *  para que React no la trate como una burbuja nueva cuando el `_id`
   *  temporal se reemplaza por el real — eso era lo que causaba el parpadeo. */
  client_id?: string;
}

export function listConversations(): Promise<{ conversations: ConversationSummary[] }> {
  return apiFetch('/api/chats');
}

export function createDirectConversation(otherUserId: string): Promise<{ conversation: ConversationSummary }> {
  return apiFetch('/api/chats', {
    method: 'POST',
    body: JSON.stringify({ type: 'DIRECT', participant_ids: [otherUserId] }),
  });
}

export function listMessages(conversationId: string): Promise<{ mensajes: ChatMessage[] }> {
  return apiFetch(`/api/chats/${conversationId}/mensajes`);
}

/** Marca la conversación como leída para mí — llamar SOLO cuando el usuario
 *  de verdad tiene esta conversación abierta y visible en pantalla (no basta
 *  con que esté "seleccionada" mientras la pestaña está en otra sección o en
 *  segundo plano). */
export function markConversationRead(conversationId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/chats/${conversationId}/leido`, { method: 'POST' });
}

export function sendMessage(
  conversationId: string,
  payload: {
    content: string;
    file_attachment?: FileAttachmentInfo;
    audio?: VoiceNoteData;
  },
): Promise<{ mensaje: ChatMessage }> {
  return apiFetch(`/api/chats/${conversationId}/mensajes`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function searchUsers(query: string): Promise<{ users: ParticipantInfo[] }> {
  return apiFetch(`/api/usuarios/buscar?q=${encodeURIComponent(query)}`);
}

/** "Estoy escribiendo" — aproximación por polling (no WebSockets). */
export function pingTyping(conversationId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/chats/${conversationId}/typing`, { method: 'POST' });
}

export function getTypingUsers(conversationId: string): Promise<{ typing_user_ids: string[] }> {
  return apiFetch(`/api/chats/${conversationId}/typing`);
}
