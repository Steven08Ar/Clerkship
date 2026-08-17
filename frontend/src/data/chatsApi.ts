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
}

export type ConversationType = 'DIRECT' | 'GROUP' | 'PUBLIC';

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name: string | null;
  course_id: string | null;
  ai_agent_id: string | null;
  updated_at: string | null;
  participants: ParticipantInfo[];
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

export interface ChatMessage {
  _id: string;
  conversation_id: string;
  sender_type: 'student' | 'teacher';
  sender_id: string;
  content: string;
  file_attachment?: { name: string; sizeStr: string; type: string } | null;
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

export function sendMessage(
  conversationId: string,
  payload: {
    content: string;
    file_attachment?: { name: string; sizeStr: string; type: string };
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
