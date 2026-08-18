import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Send, Paperclip, MoreHorizontal,
  CheckCheck, MessageSquare, Mic, Pause, Play, Check, X,
  UploadCloud, Link as LinkIcon,
  Users, BookOpen, FileCheck, Trash2,
  ArrowLeft, UserPlus, Loader2,
} from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import { useCurrentUser } from '../../utils/currentUser';
import { generatedAvatarUrl } from '../../utils/avatar';
import { useAudioRecorder } from '../../utils/audioRecorder';
import { buildFileAttachment, formatFileSize } from '../../utils/fileUpload';
import VoiceMessagePlayer from '../../components/chats/VoiceMessagePlayer';
import FileAttachmentPreview from '../../components/chats/FileAttachmentPreview';
import ImageLightbox from '../../components/chats/ImageLightbox';
import LinkPreviewCard from '../../components/chats/LinkPreviewCard';
import { extractFirstUrl } from '../../utils/linkPreview';
import { mainAuthErrorMessage, getStoredUser } from '../../data/mainAuth';
import {
  listConversations, createDirectConversation, listMessages, sendMessage, searchUsers,
  pingTyping, getTypingUsers, markConversationRead,
  type ConversationSummary, type ChatMessage, type ParticipantInfo, type VoiceNoteData, type FileAttachmentInfo,
} from '../../data/chatsApi';
import { CHATS_READ_EVENT } from '../../utils/chatsUnread';

type Section = 'chats' | 'community';

/* ── Helpers de presentación para conversaciones reales ─── */
function firstWord(s: string): string {
  return s.trim().split(/\s+/)[0] || '';
}

function conversationDisplayName(c: ConversationSummary): string {
  if (c.name) return c.name;
  if (c.type === 'DIRECT' && c.participants[0]) {
    return `${c.participants[0].first_name} ${c.participants[0].last_name}`.trim();
  }
  if (c.type === 'GROUP') return 'Grupo sin nombre';
  return 'Conversación pública';
}

/** Versión corta para mobile: solo el primer nombre + primer apellido (por si
 *  first_name/last_name traen nombres compuestos, ej. "Juan Camilo" o "De la Cruz"). */
function conversationShortName(c: ConversationSummary): string {
  if (c.name) return c.name;
  if (c.type === 'DIRECT' && c.participants[0]) {
    return `${firstWord(c.participants[0].first_name)} ${firstWord(c.participants[0].last_name)}`.trim();
  }
  return conversationDisplayName(c);
}

/** Segunda línea de la lista de chats: el último mensaje real (con "Tú: " si
 *  lo mandé yo), o el cargo del otro participante si todavía no hay ninguno. */
function conversationPreviewText(c: ConversationSummary, currentUserId?: string): string {
  const last = c.last_message;
  if (!last) return conversationSubtitle(c);
  const prefix = last.sender_id === currentUserId ? 'Tú: ' : '';
  return `${prefix}${last.preview || ''}`;
}

function conversationSubtitle(c: ConversationSummary): string {
  if (c.type === 'DIRECT' && c.participants[0]) {
    return c.participants[0].role === 'TEACHER' ? 'Docente' : 'Estudiante';
  }
  if (c.type === 'GROUP') return `${c.participants.length + 1} integrantes`;
  return 'Conversación pública';
}

/** DIRECT → avatar de la otra persona (por su correo). Grupo/pública → un avatar
 *  estable por conversación (no hay "una sola persona" a quién representar). */
function conversationAvatarSeed(c: ConversationSummary): string {
  if (c.type === 'DIRECT' && c.participants[0]) return c.participants[0].email;
  return c.id;
}

/** "Leído" = todos los demás participantes pidieron los mensajes (last_read_at)
 *  después de que se envió éste. Con `_is_participant`, listMessages() en el
 *  backend actualiza last_read_at de quien la llama cada vez que entra a ver
 *  la conversación — por eso esto refleja lectura real, no un simple "entregado". */
function isMessageReadByOthers(message: ChatMessage, conversation: ConversationSummary | null): boolean {
  if (!conversation || conversation.participants.length === 0) return false;
  const sentAt = new Date(message.created_at).getTime();
  return conversation.participants.every(p => p.last_read_at && new Date(p.last_read_at).getTime() >= sentAt);
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

/** Clave de contenido usada solo para detectar duplicados entre un mensaje
 *  optimista (todavía sin confirmar) y su versión ya confirmada por el servidor. */
function messageContentKey(m: ChatMessage): string {
  return `${m.sender_id}|${m.content}|${m.file_attachment?.name || ''}|${m.audio?.duration_seconds || ''}`;
}

/**
 * Combina lo que trajo el servidor (`serverMsgs`) con lo que había localmente
 * (`localMsgs`, que puede incluir mensajes optimistas aún sin confirmar).
 *
 * Existe por una condición de carrera real: si el poll (cada ~1s) llega justo
 * mientras un mensaje recién enviado ya se guardó en el servidor pero la
 * respuesta del POST todavía no le llegó al navegador, el mensaje optimista
 * (temp-...) Y el mensaje real del poll coexistían un instante — se veía
 * como "el mensaje se manda doble". El dedupe por contenido lo evita: si el
 * servidor ya trae un mensaje con el mismo remitente+contenido que un
 * optimista pendiente, se descarta el optimista (ya está representado).
 */
function mergeMessages(serverMsgs: ChatMessage[], localMsgs: ChatMessage[]): ChatMessage[] {
  const clientIdByRealId = new Map(
    localMsgs.filter(m => m.client_id && !m._id.startsWith('temp-')).map(m => [m._id, m.client_id]),
  );
  const withStableKeys = serverMsgs.map(m => ({ ...m, client_id: clientIdByRealId.get(m._id) }));

  // Cuenta cuántas veces aparece cada "firma" de contenido en lo que ya
  // confirmó el servidor, y descarta como máximo esa misma cantidad de
  // optimistas pendientes con esa firma — así dos mensajes idénticos
  // seguidos ("hola", "hola") no se colapsan en uno solo por error.
  const serverContentCounts = new Map<string, number>();
  for (const m of serverMsgs) {
    const key = messageContentKey(m);
    serverContentCounts.set(key, (serverContentCounts.get(key) || 0) + 1);
  }

  const stillPendingOptimistic = localMsgs.filter(m => {
    if (!m._id.startsWith('temp-')) return false;
    const key = messageContentKey(m);
    const remaining = serverContentCounts.get(key) || 0;
    if (remaining > 0) {
      serverContentCounts.set(key, remaining - 1);
      return false; // ya está representado por el servidor, se descarta el optimista
    }
    return true;
  });

  return [...withStableKeys, ...stillPendingOptimistic];
}

/* ═══════════════════════════════════════════════════════════
   ChatsPage Component — Chats y Comunidad en un solo lugar:
   cambiar de sección NUNCA navega a otra ruta, solo cambia qué
   se muestra dentro de este mismo panel. El Buzón real (correo
   de verdad, vía Mailgun) es su propia página independiente,
   ver pages/mailbox/MailboxPage.tsx.

   Chats habla con el backend real (pruebas/back/flask-api,
   rutas /api/chats y /api/usuarios/buscar). Comunidad sigue
   como placeholder (su backend ya existe en /api/comunidad,
   pero no fue lo priorizado en este batch).
   ═══════════════════════════════════════════════════════════ */
export default function ChatsPage() {
  const currentUser = useCurrentUser();
  const [section, setSection] = useState<Section>('chats');

  /* ── Estado: Chats (datos reales) ── */
  const [tab, setTab] = useState<'direct' | 'group' | 'public'>('direct');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState('');
  const [chatsError, setChatsError] = useState<string | null>(null);

  /* ── Estado: Nuevo chat (buscar usuario por @username) ── */
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatQuery, setNewChatQuery] = useState('');
  const [newChatResults, setNewChatResults] = useState<ParticipantInfo[]>([]);
  const [newChatSearching, setNewChatSearching] = useState(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);

  /* ── Estado: "está escribiendo" (polling, no WebSockets) ── */
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const lastTypingPingRef = useRef<number>(0);

  /* 📁 Estados de Archivos & Drag and Drop */
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedFile, setAttachedFile] = useState<FileAttachmentInfo | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showDropZoneModal, setShowDropZoneModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* 🎙️ Grabación de audio real (MediaRecorder) */
  const recorder = useAudioRecorder();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* Cargar conversaciones reales al entrar.
     silent=true evita el parpadeo de spinner en toda la lista — se usa
     cada vez que esto se refresca "de fondo" (tras mandar un mensaje,
     tras iniciar un chat), para que NUNCA se sienta como un mini F5. */
  async function refreshConversations(opts: { silent?: boolean } = {}) {
    try {
      if (!opts.silent) setLoadingConversations(true);
      setChatsError(null);
      const { conversations } = await listConversations();
      setConversations(conversations);
    } catch (err) {
      setChatsError(mainAuthErrorMessage(err));
    } finally {
      if (!opts.silent) setLoadingConversations(false);
    }
  }
  useEffect(() => { refreshConversations(); }, []);

  /* Filtrar conversaciones por tab & búsqueda */
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      const matchTab = c.type === tab.toUpperCase();
      const matchSearch = conversationDisplayName(c).toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [conversations, tab, search]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const typingParticipant = activeConversation?.participants.find(p => typingUserIds.includes(p.id)) || null;

  /* "Visto" real: solo se marca cuando el usuario de verdad tiene la
     conversación en pantalla — con la pestaña de Chats activa (no Comunidad)
     Y el documento visible (no en segundo plano/minimizado). El backend ya
     NO marca esto solo, así que hay que dispararlo explícitamente. */
  async function markReadIfVisible(conversationId: string) {
    if (document.hidden || section !== 'chats') return;
    try {
      await markConversationRead(conversationId);
      setConversations(prev => prev.map(c => (c.id === conversationId ? { ...c, unread_count: 0 } : c)));
      window.dispatchEvent(new Event(CHATS_READ_EVENT));
    } catch {
      // Silencioso — si falla, el próximo tick del poll lo vuelve a intentar.
    }
  }

  /* Poll de mensajes + "está escribiendo" de la conversación activa
     (sin WebSockets todavía — 500ms se siente prácticamente instantáneo para
     un chat de este tamaño, sin llegar a martillar el backend). */
  useEffect(() => {
    if (!activeConversationId) return;
    let cancelled = false;

    async function poll() {
      try {
        const [{ mensajes }, { typing_user_ids }] = await Promise.all([
          listMessages(activeConversationId!),
          getTypingUsers(activeConversationId!),
        ]);
        if (cancelled) return;
        setMessagesByConversation(prev => ({
          ...prev,
          [activeConversationId!]: mergeMessages(mensajes, prev[activeConversationId!] || []),
        }));
        setTypingUserIds(typing_user_ids);
        // Marca como visto SOLO si de verdad se está viendo ahora mismo
        // (ver markReadIfVisible) — y trae el last_read_at actualizado de LA
        // OTRA persona, para que el chulo se ponga azul sin recargar nada.
        markReadIfVisible(activeConversationId!);
        refreshConversations({ silent: true });
      } catch (err) {
        if (!cancelled) setChatsError(mainAuthErrorMessage(err));
      }
    }

    poll();
    const interval = setInterval(poll, 500);
    return () => { cancelled = true; clearInterval(interval); setTypingUserIds([]); };
  }, [activeConversationId, section]);

  /* Marca como visto EN EL ACTO al abrir la conversación (o al volver de
     Comunidad a Chats con una ya abierta) — sin esperar a que el poll
     de arriba complete su primer ciclo. También cubre el caso de dejar la
     pestaña del navegador en segundo plano y volver más tarde: recién ahí
     se marca, no antes, aunque hayan llegado mensajes nuevos mientras tanto. */
  useEffect(() => {
    if (activeConversationId && section === 'chats') {
      markReadIfVisible(activeConversationId);
    }
    function handleVisibility() {
      if (!document.hidden && activeConversationId && section === 'chats') {
        markReadIfVisible(activeConversationId);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, section]);

  /* Poll de la LISTA de conversaciones mientras se está en la pestaña Chats
     (con o sin una conversación abierta) — así los mensajes nuevos, el
     círculo de "no leído" y el orden de la lista se actualizan solos aunque
     el usuario esté mirando la lista sin haber entrado a ningún chat. */
  useEffect(() => {
    if (section !== 'chats') return;
    const interval = setInterval(() => refreshConversations({ silent: true }), 3000);
    return () => clearInterval(interval);
  }, [section]);

  /* Búsqueda de usuarios para iniciar un chat nuevo */
  useEffect(() => {
    if (!newChatOpen) return;
    const query = newChatQuery.trim();
    if (!query) { setNewChatResults([]); return; }

    const timeout = setTimeout(async () => {
      try {
        setNewChatSearching(true);
        setNewChatError(null);
        const { users } = await searchUsers(query);
        setNewChatResults(users.filter(u => u.id !== currentUser?.id));
      } catch (err) {
        setNewChatError(mainAuthErrorMessage(err));
      } finally {
        setNewChatSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [newChatQuery, newChatOpen, currentUser?.id]);

  async function handleStartChat(otherUserId: string) {
    try {
      const { conversation } = await createDirectConversation(otherUserId);
      setNewChatOpen(false);
      setNewChatQuery('');
      setNewChatResults([]);
      setTab('direct');
      await refreshConversations({ silent: true });
      setActiveConversationId(conversation.id);
    } catch (err) {
      setNewChatError(mainAuthErrorMessage(err));
    }
  }

  const currentChatMsgs = activeConversationId ? (messagesByConversation[activeConversationId] || []) : [];

  /* Todas las imágenes de la conversación activa, en orden — así el lightbox
     puede navegar entre todas con una tira de miniaturas, no solo la que se
     clickeó. */
  const chatImages = useMemo(
    () =>
      currentChatMsgs
        .filter(m => m.file_attachment && m.file_attachment.mime_type.startsWith('image/'))
        .map(m => ({
          msgId: m.client_id || m._id,
          src: `data:${m.file_attachment!.mime_type};base64,${m.file_attachment!.data}`,
          name: m.file_attachment!.name,
        })),
    [currentChatMsgs],
  );

  /* Auto scroll chat messages to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMsgs.length, activeConversationId, typingParticipant]);

  /* Envío optimista: el mensaje aparece YA (0ms, local), y se reconcilia
     con la respuesta real del servidor apenas llega — así enviar nunca
     se siente como esperar un F5. Si el envío falla, se retira solo. */
  async function sendChatMessage(
    content: string,
    extra: { file_attachment?: FileAttachmentInfo; audio?: VoiceNoteData } = {},
  ) {
    if (!activeConversationId || !currentUser) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMsg: ChatMessage = {
      _id: tempId,
      client_id: tempId,
      conversation_id: activeConversationId,
      sender_type: getStoredUser()?.role === 'TEACHER' ? 'teacher' : 'student',
      sender_id: currentUser.id,
      content,
      file_attachment: extra.file_attachment || null,
      audio: extra.audio || null,
      created_at: new Date().toISOString(),
    };

    setMessagesByConversation(prev => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), optimisticMsg],
    }));

    try {
      const { mensaje } = await sendMessage(activeConversationId, { content, ...extra });
      setMessagesByConversation(prev => ({
        ...prev,
        [activeConversationId]: (prev[activeConversationId] || []).map(m => (m._id === tempId ? { ...mensaje, client_id: tempId } : m)),
      }));
      refreshConversations({ silent: true });
    } catch (err) {
      setChatsError(mainAuthErrorMessage(err));
      setMessagesByConversation(prev => ({
        ...prev,
        [activeConversationId]: (prev[activeConversationId] || []).filter(m => m._id !== tempId),
      }));
    }
  }

  /* Enviar mensaje (texto y/o archivo adjunto) */
  async function handleSendMessage(customText?: string) {
    if (!activeConversationId) return;
    const textToSend = (customText ?? input).trim();
    if (!textToSend && !attachedFile) return;

    const extra = attachedFile ? { file_attachment: attachedFile } : {};
    setInput('');
    setAttachedFile(null);
    setShowDropZoneModal(false);
    await sendChatMessage(textToSend, extra);
  }

  /* Enviar nota de voz real: detiene la grabación, arma el data URI y lo manda. */
  async function handleSendVoiceNote() {
    const result = await recorder.stop();
    if (!result || !activeConversationId) return;

    const mins = Math.floor(result.durationSeconds / 60);
    const secs = result.durationSeconds % 60;
    const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    await sendChatMessage(`🎤 Nota de voz (${durStr})`, {
      audio: {
        data: result.base64,
        mime_type: result.mimeType,
        duration_seconds: result.durationSeconds,
        waveform: result.waveform,
      },
    });
  }

  function handleCancelVoiceNote() {
    recorder.cancel();
  }

  /* Avisa al backend que estoy escribiendo, con throttle (máx. 1 ping cada 2s) */
  function handleInputChange(value: string) {
    setInput(value);
    if (!activeConversationId) return;
    const now = Date.now();
    if (now - lastTypingPingRef.current > 2000) {
      lastTypingPingRef.current = now;
      pingTyping(activeConversationId).catch(() => {});
    }
  }

  /* Lee y prepara el archivo de verdad (comprime si es imagen) para adjuntarlo. */
  async function processAndAttachFile(file: File) {
    setFileError(null);
    setIsProcessingFile(true);
    try {
      const attachment = await buildFileAttachment(file);
      setAttachedFile(attachment);
      setShowDropZoneModal(false);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'No se pudo leer el archivo.');
    } finally {
      setIsProcessingFile(false);
    }
  }

  /* File Selection Handler */
  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processAndAttachFile(file);
    e.target.value = ''; // permite volver a elegir el mismo archivo después
  }

  /* Drag and Drop Handlers */
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
  }
  function handleDropFile(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processAndAttachFile(file);
  }

  /* Formato del Temporizador mm:ss (simple, no el formato "0:00:02" de antes) */
  const recMinutes = Math.floor(recorder.elapsedSeconds / 60);
  const recSecsRem = recorder.elapsedSeconds % 60;
  const timerDisplay = `${recMinutes}:${recSecsRem < 10 ? '0' : ''}${recSecsRem}`;

  return (
    <div className="dash-root">
      <Sidebar />

      <div className={`chats-page-wrapper ${activeConversationId && section === 'chats' ? 'has-active-chat' : 'no-active-chat'}`}>

        {/* ── COLUMNA IZQUIERDA: LISTA (Chats / Comunidad) ── */}
        <aside className="chats-sidebar-panel">
          <div className="chats-sb-header">

            {/* Fila Superior de Iconos: cambia de sección SIN navegar de página */}
            <div className="chats-top-nav-icons">
              <button
                className={`chats-nav-icon-btn ${section === 'chats' ? 'active' : ''}`}
                title="Mensajes"
                onClick={() => setSection('chats')}
              >
                <MessageSquare size={20} />
                {section === 'chats' && <span className="chats-nav-icon-label">Mensajes</span>}
              </button>

              <button
                className={`chats-nav-icon-btn ${section === 'community' ? 'active' : ''}`}
                title="Comunidad"
                onClick={() => setSection('community')}
              >
                <Users size={20} />
                {section === 'community' && <span className="chats-nav-icon-label">Comunidad</span>}
              </button>

              <div className="chats-nav-user-avatar" title={currentUser?.name || 'Perfil'}>
                {currentUser ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="chats-nav-avatar-img" />
                ) : (
                  <span className="chats-nav-avatar-text">--</span>
                )}
              </div>
            </div>

            {/* ── Encabezado de sección: Chats ── */}
            {section === 'chats' && (
              <>
                <div className="chats-sb-title-row">
                  <h1 className="chats-sb-title">Mensajes</h1>
                  <button
                    className="chats-add-btn"
                    title="Nuevo chat"
                    onClick={() => setNewChatOpen(v => !v)}
                  >
                    {newChatOpen ? <X size={18} /> : <Plus size={18} />}
                  </button>
                </div>

                {!newChatOpen && (
                  <>
                    <div className="chats-tab-group">
                      <button
                        className={`chats-tab-btn ${tab === 'direct' ? 'active' : ''}`}
                        onClick={() => setTab('direct')}
                      >
                        DIRECTOS
                      </button>
                      <button
                        className={`chats-tab-btn ${tab === 'group' ? 'active' : ''}`}
                        onClick={() => setTab('group')}
                      >
                        GRUPOS
                      </button>
                      <button
                        className={`chats-tab-btn ${tab === 'public' ? 'active' : ''}`}
                        onClick={() => setTab('public')}
                      >
                        PÚBLICOS
                      </button>
                    </div>

                    <div className="chats-search-box">
                      <Search size={15} className="chats-search-icon" />
                      <input
                        type="text"
                        placeholder="Buscar conversación..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {newChatOpen && (
                  <div className="chats-search-box">
                    <Search size={15} className="chats-search-icon" />
                    <input
                      type="text"
                      placeholder="Buscar por @usuario..."
                      value={newChatQuery}
                      onChange={e => setNewChatQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                )}
              </>
            )}

            {/* ── Encabezado de sección: Comunidad ── */}
            {section === 'community' && (
              <div className="chats-sb-title-row">
                <h1 className="chats-sb-title">Comunidad</h1>
              </div>
            )}
          </div>

          {/* ── Lista: Nuevo chat (resultados de búsqueda de usuarios) ── */}
          {section === 'chats' && newChatOpen && (
            <div className="chats-list">
              {newChatSearching && (
                <div className="chats-empty-list"><Loader2 size={24} className="chats-spin" /></div>
              )}
              {newChatError && <p className="auth-field-error" style={{ padding: '0 16px' }}>{newChatError}</p>}
              {!newChatSearching && newChatQuery.trim() && newChatResults.length === 0 && (
                <div className="chats-empty-list">
                  <UserPlus size={32} />
                  <p>No se encontró ningún @usuario así.</p>
                </div>
              )}
              {newChatResults.map(u => (
                <div key={u.id} className="chats-item" onClick={() => handleStartChat(u.id)}>
                  <div className="chats-item-avatar-wrap">
                    <img className="chats-avatar-img" src={generatedAvatarUrl(u.email)} alt={`${u.first_name} ${u.last_name}`} />
                  </div>
                  <div className="chats-item-body">
                    <div className="chats-item-head">
                      <span className="chats-item-name">
                        <span className="chats-name-full">{u.first_name} {u.last_name}</span>
                        <span className="chats-name-short">{firstWord(u.first_name)} {firstWord(u.last_name)}</span>
                      </span>
                    </div>
                    <p className="chats-item-preview">@{u.username} · {u.role === 'TEACHER' ? 'Docente' : 'Estudiante'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Lista: Chats ── */}
          {section === 'chats' && !newChatOpen && (
            <div className="chats-list">
              {loadingConversations && (
                <div className="chats-empty-list"><Loader2 size={24} className="chats-spin" /></div>
              )}

              {!loadingConversations && chatsError && (
                <div className="chats-empty-list">
                  <MessageSquare size={32} />
                  <p>{chatsError}</p>
                </div>
              )}

              {!loadingConversations && !chatsError && filteredConversations.map(c => {
                const active = c.id === activeConversationId;
                const unread = (c.unread_count || 0) > 0;
                return (
                  <div
                    key={c.id}
                    className={`chats-item ${active ? 'active' : ''} ${unread ? 'unread' : ''}`}
                    onClick={() => setActiveConversationId(c.id)}
                  >
                    <div className="chats-item-avatar-wrap">
                      <img className="chats-avatar-img" src={generatedAvatarUrl(conversationAvatarSeed(c))} alt={conversationDisplayName(c)} />
                    </div>

                    <div className="chats-item-body">
                      <div className="chats-item-head">
                        <span className="chats-item-name">
                          <span className="chats-name-full">{conversationDisplayName(c)}</span>
                          <span className="chats-name-short">{conversationShortName(c)}</span>
                        </span>
                        <span className="chats-item-time">{formatTime(c.updated_at)}</span>
                      </div>
                      <div className="chats-item-preview-row">
                        <p className="chats-item-preview">{conversationPreviewText(c, currentUser?.id)}</p>
                        {unread && (
                          <span className="chats-unread-badge">
                            {c.unread_count! > 9 ? '9+' : c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loadingConversations && !chatsError && filteredConversations.length === 0 && (
                <div className="chats-empty-list">
                  <MessageSquare size={32} />
                  <p>No tienes conversaciones aquí todavía. Usa el botón + para empezar una.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Lista: Comunidad (placeholder) ── */}
          {section === 'community' && (
            <div className="chats-empty-list">
              <Users size={32} />
              <p>La Comunidad Médica estará disponible próximamente.</p>
            </div>
          )}
        </aside>

        {/* ── COLUMNA DERECHA/CENTRAL ── */}
        {section === 'chats' && (
          <main
            className={`chats-main-panel chats-conversation-panel ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropFile}
          >
            {/* Input oculto para cargar archivos */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />

            {/* Overlay visual cuando se arrastra un archivo sobre la pantalla */}
            <AnimatePresence>
              {isDragOver && (
                <motion.div
                  className="chats-global-drag-overlay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="chats-drag-card">
                    <UploadCloud size={48} className="chats-drag-icon" />
                    <h3>Suelta tu archivo aquí</h3>
                    <p>Soporta imágenes, informes en PDF, laboratorios y viñetas clínicas.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!activeConversation ? (
              <div className="chats-empty-list" style={{ height: '100%', justifyContent: 'center' }}>
                <MessageSquare size={40} />
                <p>Selecciona una conversación o inicia una nueva con el botón +.</p>
              </div>
            ) : (
              <>
                {/* Header del Chat Activo */}
                <header className="chats-main-header">
                  <div className="chats-mh-left">
                    <button
                      type="button"
                      className="chats-mh-back-btn"
                      title="Volver a la lista de chats"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveConversationId(null);
                      }}
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <div className="chats-mh-avatar">
                      <img className="chats-avatar-img large" src={generatedAvatarUrl(conversationAvatarSeed(activeConversation))} alt={conversationDisplayName(activeConversation)} />
                    </div>

                    <div>
                      <h2 className="chats-mh-name">
                        <span className="chats-name-full">{conversationDisplayName(activeConversation)}</span>
                        <span className="chats-name-short">{conversationShortName(activeConversation)}</span>
                      </h2>
                      <p className="chats-mh-status">{conversationSubtitle(activeConversation)}</p>
                    </div>
                  </div>

                  <div className="chats-mh-actions">
                    <button className="chats-mh-btn" title="Opciones"><MoreHorizontal size={18} /></button>
                  </div>
                </header>

                {/* Área de Mensajes */}
                <div className="chats-messages-body">
                  <AnimatePresence initial={false}>
                    {currentChatMsgs.map((m, idx) => {
                      const isOwn = m.sender_id === currentUser?.id;
                      const msgId = m.client_id || m._id;
                      // Audios "seguidos": si el mensaje inmediatamente después
                      // de este también es una nota de voz, se encadenan solas.
                      const nextMsg = currentChatMsgs[idx + 1];
                      const autoPlayNextId = m.audio && nextMsg?.audio ? (nextMsg.client_id || nextMsg._id) : null;
                      const isImageMsg = m.file_attachment?.mime_type.startsWith('image/');
                      return (
                        <motion.div
                          key={msgId}
                          className={`chats-bubble-wrapper ${isOwn ? 'user' : 'contact'}`}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className={`chats-bubble ${isOwn ? 'user' : 'contact'} ${isImageMsg ? 'chats-bubble-has-image' : ''}`}>
                            {m.audio ? (
                              <VoiceMessagePlayer
                                id={msgId}
                                src={`data:${m.audio.mime_type};base64,${m.audio.data}`}
                                waveform={m.audio.waveform}
                                durationSeconds={m.audio.duration_seconds}
                                variant={isOwn ? 'user' : 'contact'}
                                autoPlayNextId={autoPlayNextId}
                              />
                            ) : m.file_attachment ? (
                              <>
                                <FileAttachmentPreview
                                  file={m.file_attachment}
                                  variant={isOwn ? 'user' : 'contact'}
                                  onImageClick={() => setLightboxIndex(chatImages.findIndex(img => img.msgId === msgId))}
                                />
                                {m.content && <p className="chats-bubble-text">{m.content}</p>}
                              </>
                            ) : (
                              <>
                                <p className="chats-bubble-text">{m.content}</p>
                                {extractFirstUrl(m.content) && <LinkPreviewCard url={extractFirstUrl(m.content)!} />}
                              </>
                            )}
                          </div>

                          <div className={`chats-bubble-meta ${isOwn ? 'user' : 'contact'}`}>
                            <span>{formatTime(m.created_at)}</span>
                            {isOwn && (
                              isMessageReadByOthers(m, activeConversation) ? (
                                <CheckCheck size={14} className="chats-check-icon read" />
                              ) : (
                                <Check size={14} className="chats-check-icon" />
                              )
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {currentChatMsgs.length === 0 && (
                    <div className="chats-empty-list" style={{ height: '100%', justifyContent: 'center' }}>
                      <p>Todavía no hay mensajes. Escribe el primero.</p>
                    </div>
                  )}

                  <AnimatePresence>
                    {typingParticipant && (
                      <motion.div
                        className="chats-typing-indicator"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                      >
                        <img
                          className="chats-typing-avatar"
                          src={generatedAvatarUrl(typingParticipant.email)}
                          alt={typingParticipant.first_name}
                        />
                        <span className="chats-typing-dots"><span /><span /><span /></span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                {/* ── FOOTER DE ENTRADA / BARRA DE ESCRIBIR ── */}
                <div className="chats-input-footer">

                  {/* CASO 1: Grabación de Nota de Voz en Progreso */}
                  {recorder.isRecording ? (
                    <motion.div
                      className="chats-voice-bar-active"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="chats-voice-timer-row">
                        <span className={`chats-voice-red-dot ${recorder.isPaused ? 'paused' : ''}`} />
                        <span className="chats-voice-timer-big">{timerDisplay}</span>
                      </div>

                      <div className={`chats-voice-live-waveform ${recorder.isPaused ? 'paused' : ''}`}>
                        {recorder.liveAmplitude.map((level, i) => (
                          <span
                            key={i}
                            className="chats-voice-live-bar"
                            style={{ height: `${Math.max(12, Math.min(100, level * 100))}%` }}
                          />
                        ))}
                      </div>

                      {recorder.error && <p className="chats-voice-error">{recorder.error}</p>}

                      <div className="chats-voice-controls-row">
                        <button
                          type="button"
                          className="chats-voice-cancel-btn"
                          onClick={handleCancelVoiceNote}
                          title="Cancelar"
                        >
                          <Trash2 size={18} />
                        </button>

                        <button
                          type="button"
                          className="chats-voice-pause-btn"
                          onClick={() => (recorder.isPaused ? recorder.resume() : recorder.pause())}
                          title={recorder.isPaused ? 'Reanudar' : 'Pausar'}
                        >
                          {recorder.isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
                        </button>

                        <button
                          type="button"
                          className="chats-voice-send-btn"
                          onClick={handleSendVoiceNote}
                          title="Enviar nota de voz"
                        >
                          <Check size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ) : showDropZoneModal ? (
                    /* CASO 2: Zona de Arrastrar y Soltar Archivos */
                    <motion.div
                      className="chats-dropzone-embed-box"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="chats-dz-close-row">
                        <button onClick={() => setShowDropZoneModal(false)}><X size={16} /></button>
                      </div>

                      <div className="chats-dz-content">
                        <p className="chats-dz-title">Arrastra algo aquí o explora tus archivos</p>
                        <p className="chats-dz-sub">Documentos, imágenes, videos, audios, enlaces y más</p>

                        <div className="chats-dz-buttons-row">
                          <button
                            className="chats-dz-icon-circle"
                            title="Subir archivo o paraclínico"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadCloud size={18} />
                          </button>
                          <button
                            className="chats-dz-icon-circle"
                            title="Grabar nota de voz"
                            onClick={() => { setShowDropZoneModal(false); recorder.start(); }}
                          >
                            <Mic size={18} />
                          </button>
                          <button
                            className="chats-dz-icon-circle"
                            title="Compartir enlace o referencia"
                            onClick={() => handleSendMessage('🔗 Referencia médica: https://clerkship.med.co/caso-gastro-1')}
                          >
                            <LinkIcon size={18} />
                          </button>
                          <button
                            className="chats-dz-icon-circle"
                            title="Compartir libro de la biblioteca"
                            onClick={() => handleSendMessage('📚 Compartido desde la Biblioteca: "Harrison - Principios de Medicina Interna (21ª ed.)"')}
                          >
                            <BookOpen size={18} />
                          </button>
                          <button
                            className="chats-dz-icon-circle"
                            title="Compartir caso clínico realizado"
                            onClick={() => handleSendMessage('📋 Caso realizado compartido: "Dolor abdominal urente y sangrado digestivo alto - Puntuación: 94%"')}
                          >
                            <FileCheck size={18} />
                          </button>
                        </div>

                        {isProcessingFile && (
                          <div className="chats-dz-preview-tag">
                            <Loader2 size={14} className="chats-spin" /> Leyendo archivo...
                          </div>
                        )}
                        {fileError && <p className="auth-field-error">{fileError}</p>}
                        {attachedFile && (
                          <div className="chats-dz-preview-tag">
                            <span>📄 {attachedFile.name} ({formatFileSize(attachedFile.size_bytes)})</span>
                            <button onClick={() => setAttachedFile(null)}><X size={12} /></button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    /* CASO 3: BARRA DE ESCRITURA ── */
                    <div className="chats-input-bar-wrap">
                      {attachedFile && (
                        <div className="chats-dz-preview-tag chats-attached-preview">
                          <span>📄 {attachedFile.name} ({formatFileSize(attachedFile.size_bytes)})</span>
                          <button onClick={() => setAttachedFile(null)} title="Quitar archivo">
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      <div className="chats-input-bar">
                      <button
                        className="chats-attach-btn"
                        title="Adjuntar archivo o paraclínico"
                        onClick={() => setShowDropZoneModal(true)}
                      >
                        <Paperclip size={18} />
                      </button>

                      <input
                        type="text"
                        className="chats-text-input"
                        placeholder="Escribe un mensaje o consulta clínica aquí..."
                        value={input}
                        onChange={e => handleInputChange(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      />

                      <button
                        type="button"
                        className="chats-attach-btn"
                        title="Grabar nota de voz"
                        onClick={() => recorder.start()}
                      >
                        <Mic size={18} />
                      </button>

                      <button
                        className="chats-send-btn"
                        onClick={() => handleSendMessage()}
                        disabled={(!input.trim() && !attachedFile) || isProcessingFile}
                        title="Enviar mensaje"
                      >
                        <Send size={16} />
                      </button>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </main>
        )}

        {section === 'community' && (
          <main className="chats-main-panel">
            <div className="mail-empty-main">
              <Users size={40} />
              <h2>Comunidad Médica</h2>
              <p>Estamos trabajando en este espacio para conectar con otros estudiantes y preceptores. Vuelve pronto.</p>
            </div>
          </main>
        )}

      </div>

      {lightboxIndex !== null && chatImages[lightboxIndex] && (
        <ImageLightbox
          images={chatImages}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
