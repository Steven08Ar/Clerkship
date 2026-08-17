import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Send, Paperclip, MoreHorizontal,
  CheckCheck, MessageSquare, Mic, Pause, Play, Check, X,
  UploadCloud, Link as LinkIcon, FileText,
  Mail, Users, BookOpen, FileCheck, Archive, Info, Trash2, Reply, Forward,
  BadgeCheck, Inbox, ArrowLeft, UserPlus, Loader2,
} from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import { useCurrentUser } from '../../utils/currentUser';
import { generatedAvatarUrl } from '../../utils/avatar';
import { useAudioRecorder } from '../../utils/audioRecorder';
import VoiceMessagePlayer from '../../components/chats/VoiceMessagePlayer';
import { mainAuthErrorMessage, getStoredUser } from '../../data/mainAuth';
import {
  listConversations, createDirectConversation, listMessages, sendMessage, searchUsers,
  pingTyping, getTypingUsers,
  type ConversationSummary, type ChatMessage, type ParticipantInfo, type VoiceNoteData,
} from '../../data/chatsApi';

/* ── Interfaces: Correo (sigue mock — Buzón real usará Mailgun más adelante) ── */
interface EmailBody {
  paragraphs: string[];
  bullets?: string[];
  closing?: string;
}
interface EmailAttachment {
  name: string;
}
interface EmailItem {
  id: string;
  sender: string;
  senderEmail: string;
  verified?: boolean;
  avatarText: string;
  avatarBg: string;
  dateLabel: string;
  fullDateLabel: string;
  subject: string;
  preview: string;
  read: boolean;
  to: string;
  body: EmailBody;
  attachment?: EmailAttachment;
}

/* ── Mock Correos (pendiente de conectar a Mailgun) ─────── */
const EMAILS: EmailItem[] = [
  {
    id: 'e1',
    sender: 'Clerkship Plataforma',
    senderEmail: 'notificaciones@clerkship.app',
    verified: true,
    avatarText: 'CP',
    avatarBg: '#0284C7',
    dateLabel: '16 Nov',
    fullDateLabel: '16 Nov, 11:45 p. m.',
    subject: '¡Tu caso clínico ha sido aprobado!',
    preview: 'Nos complace informarte que tu presentación del caso de Gastroenterología ha superado la revisión...',
    read: false,
    to: 'Santiago Arias',
    body: {
      paragraphs: [
        'Nos complace informarte que tu presentación del caso de Gastroenterología ha superado la revisión del comité académico y ya está disponible en tu portafolio de Clerkship. Profesores y compañeros del programa pueden ahora acceder a tu análisis y aprender de tu trabajo.',
        'Para revisar tu caso y su desempeño:',
      ],
      bullets: [
        'Accede a tu portafolio: consulta calificaciones, comentarios y retroalimentación en tiempo real.',
        'Participa en la discusión: responde preguntas de tus compañeros y mejora tu razonamiento clínico.',
        'Actualiza tu caso: mantenlo vigente incorporando nueva evidencia u observaciones.',
      ],
      closing: '¡Gracias por tu dedicación al programa de Clerkship! Estamos deseosos de ver el impacto de tu trabajo.',
    },
    attachment: { name: 'Informe_Caso_Clinico.pdf' },
  },
  {
    id: 'e2',
    sender: 'Comité Editorial WGO',
    senderEmail: 'guias@wgo-clinical.org',
    verified: true,
    avatarText: 'WG',
    avatarBg: '#8B5CF6',
    dateLabel: '15 Nov',
    fullDateLabel: '15 Nov, 9:10 a. m.',
    subject: 'Nuevas guías clínicas disponibles',
    preview: 'Ya están publicadas las guías actualizadas de pancreatitis aguda y enfermedad por reflujo...',
    read: true,
    to: 'Santiago Arias',
    body: {
      paragraphs: [
        'Ya están publicadas las guías actualizadas de pancreatitis aguda y enfermedad por reflujo gastroesofágico, con nueva evidencia incorporada este trimestre.',
        'Puedes consultarlas directamente desde la Biblioteca de Clerkship, en la sección de guías por especialidad.',
      ],
    },
  },
  {
    id: 'e3',
    sender: 'Dra. Elena Rostova',
    senderEmail: 'e.rostova@clerkship.app',
    avatarText: 'ER',
    avatarBg: '#E11D48',
    dateLabel: '14 Nov',
    fullDateLabel: '14 Nov, 4:32 p. m.',
    subject: 'Revisé tu caso, ¡buen trabajo!',
    preview: 'Santiago, tu razonamiento bayesiano en la sesión de úlcera péptica estuvo muy acertado...',
    read: true,
    to: 'Santiago Arias',
    body: {
      paragraphs: [
        'Santiago, tu razonamiento bayesiano en la sesión de úlcera péptica estuvo muy acertado. Justificaste bien la endoscopia digestiva alta y el orden de tus hipótesis diagnósticas.',
        'Sigamos así — nos vemos en la próxima sesión de discusión clínica.',
      ],
    },
  },
  {
    id: 'e4',
    sender: 'Biblioteca Médica Clerkship',
    senderEmail: 'biblioteca@clerkship.app',
    verified: true,
    avatarText: 'BM',
    avatarBg: '#10B981',
    dateLabel: '13 Nov',
    fullDateLabel: '13 Nov, 8:00 a. m.',
    subject: 'Tu recurso solicitado está listo',
    preview: 'El capítulo de Harrison sobre hepatología que solicitaste ya está disponible para consulta...',
    read: true,
    to: 'Santiago Arias',
    body: {
      paragraphs: [
        'El capítulo de Harrison sobre hepatología que solicitaste ya está disponible para consulta en tu Biblioteca personal.',
      ],
    },
  },
  {
    id: 'e5',
    sender: 'Dr. Ashish Singh',
    senderEmail: 'a.singh@clerkship.app',
    avatarText: 'AS',
    avatarBg: '#F59E0B',
    dateLabel: '12 Nov',
    fullDateLabel: '12 Nov, 4:00 p. m.',
    subject: 'Resultados del perfil hepático — Caso 7',
    preview: 'Te comparto los últimos resultados del perfil hepático del caso 7 para que los revises antes de...',
    read: true,
    to: 'Santiago Arias',
    body: {
      paragraphs: [
        'Te comparto los últimos resultados del perfil hepático del caso 7 para que los revises antes de la sesión de mañana.',
      ],
    },
  },
  {
    id: 'e6',
    sender: 'Clerkship Comunidad',
    senderEmail: 'comunidad@clerkship.app',
    verified: true,
    avatarText: 'CC',
    avatarBg: '#0EA5E9',
    dateLabel: '11 Nov',
    fullDateLabel: '11 Nov, 7:00 a. m.',
    subject: 'Tu resumen semanal de actividad',
    preview: 'Esta semana completaste 4 casos clínicos y participaste en 2 discusiones grupales. ¡Sigue así!...',
    read: true,
    to: 'Santiago Arias',
    body: {
      paragraphs: [
        'Esta semana completaste 4 casos clínicos y participaste en 2 discusiones grupales. ¡Sigue así!',
      ],
    },
  },
];

type Section = 'chats' | 'mail' | 'community';

/* ── Helpers de presentación para conversaciones reales ─── */
function conversationDisplayName(c: ConversationSummary): string {
  if (c.name) return c.name;
  if (c.type === 'DIRECT' && c.participants[0]) {
    return `${c.participants[0].first_name} ${c.participants[0].last_name}`.trim();
  }
  if (c.type === 'GROUP') return 'Grupo sin nombre';
  return 'Conversación pública';
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
   ChatsPage Component — Chats, Correo y Comunidad en un solo
   lugar: cambiar de sección NUNCA navega a otra ruta, solo
   cambia qué se muestra dentro de este mismo panel.

   Chats habla con el backend real (pruebas/back/flask-api,
   rutas /api/chats y /api/usuarios/buscar). Buzón sigue con
   datos de ejemplo — el Buzón real usará Mailgun más adelante.
   Comunidad sigue como placeholder (su backend ya existe en
   /api/comunidad, pero no fue lo priorizado en este batch).
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

  /* ── Estado: Correo (mock) ── */
  const [mailSearch, setMailSearch] = useState('');
  const [mailTab, setMailTab] = useState<'all' | 'read' | 'unread'>('all');
  const [activeMailId, setActiveMailId] = useState<string>(EMAILS[0].id);
  const [mailReplyText, setMailReplyText] = useState('');

  /* 📁 Estados de Archivos & Drag and Drop */
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; sizeStr: string; type: string } | null>(null);
  const [showDropZoneModal, setShowDropZoneModal] = useState(false);
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

  /* Auto-seleccionar la primera conversación disponible */
  useEffect(() => {
    if (!activeConversationId && filteredConversations.length > 0) {
      setActiveConversationId(filteredConversations[0].id);
    }
  }, [filteredConversations, activeConversationId]);

  const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
  const typingParticipant = activeConversation?.participants.find(p => typingUserIds.includes(p.id)) || null;

  /* Poll de mensajes + "está escribiendo" de la conversación activa
     (sin WebSockets todavía — esto se acerca a tiempo real cada ~1s, pero
     no es instantáneo para los mensajes que llegan de la otra persona). */
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
      } catch (err) {
        if (!cancelled) setChatsError(mainAuthErrorMessage(err));
      }
    }

    poll();
    const interval = setInterval(poll, 1000);
    return () => { cancelled = true; clearInterval(interval); setTypingUserIds([]); };
  }, [activeConversationId]);

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

  /* Filter emails by search & tab */
  const filteredEmails = useMemo(() => {
    return EMAILS.filter((e) => {
      if (mailTab === 'read' && !e.read) return false;
      if (mailTab === 'unread' && e.read) return false;
      if (mailSearch && !`${e.sender} ${e.subject} ${e.preview}`.toLowerCase().includes(mailSearch.toLowerCase())) return false;
      return true;
    });
  }, [mailSearch, mailTab]);

  const activeEmail = EMAILS.find((e) => e.id === activeMailId) || EMAILS[0];
  const unreadMailCount = EMAILS.filter((e) => !e.read).length;

  const currentChatMsgs = activeConversationId ? (messagesByConversation[activeConversationId] || []) : [];

  /* Auto scroll chat messages to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatMsgs.length, activeConversationId, typingParticipant]);

  /* Envío optimista: el mensaje aparece YA (0ms, local), y se reconcilia
     con la respuesta real del servidor apenas llega — así enviar nunca
     se siente como esperar un F5. Si el envío falla, se retira solo. */
  async function sendChatMessage(
    content: string,
    extra: { file_attachment?: { name: string; sizeStr: string; type: string }; audio?: VoiceNoteData } = {},
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

  /* File Selection Handler */
  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile({
        name: file.name,
        sizeStr: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type.includes('image') ? 'image' : 'doc',
      });
      setShowDropZoneModal(false);
    }
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setAttachedFile({
        name: file.name,
        sizeStr: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type.includes('image') ? 'image' : 'doc',
      });
    }
  }

  /* Formato del Temporizador mm:ss (simple, no el formato "0:00:02" de antes) */
  const recMinutes = Math.floor(recorder.elapsedSeconds / 60);
  const recSecsRem = recorder.elapsedSeconds % 60;
  const timerDisplay = `${recMinutes}:${recSecsRem < 10 ? '0' : ''}${recSecsRem}`;

  return (
    <div className="dash-root">
      <Sidebar />

      <div className="chats-page-wrapper">

        {/* ── COLUMNA IZQUIERDA: LISTA (Chats / Correo / Comunidad) ── */}
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
                className={`chats-nav-icon-btn ${section === 'mail' ? 'active' : ''}`}
                title="Buzón"
                onClick={() => setSection('mail')}
              >
                <Mail size={20} />
                {section === 'mail' && <span className="chats-nav-icon-label">Buzón</span>}
                {unreadMailCount > 0 && <span className="chats-nav-badge">{unreadMailCount}</span>}
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

            {/* ── Encabezado de sección: Correo ── */}
            {section === 'mail' && (
              <>
                <div className="chats-sb-title-row">
                  <h1 className="chats-sb-title">Buzón</h1>
                </div>

                <div className="chats-search-box">
                  <Search size={15} className="chats-search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar"
                    value={mailSearch}
                    onChange={(e) => setMailSearch(e.target.value)}
                  />
                </div>

                <div className="mail-tab-group">
                  <button className={`mail-tab-btn ${mailTab === 'all' ? 'active' : ''}`} onClick={() => setMailTab('all')}>Todos</button>
                  <button className={`mail-tab-btn ${mailTab === 'read' ? 'active' : ''}`} onClick={() => setMailTab('read')}>Leídos</button>
                  <button className={`mail-tab-btn ${mailTab === 'unread' ? 'active' : ''}`} onClick={() => setMailTab('unread')}>No leídos</button>
                </div>
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
                      <span className="chats-item-name">{u.first_name} {u.last_name}</span>
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
                return (
                  <div
                    key={c.id}
                    className={`chats-item ${active ? 'active' : ''}`}
                    onClick={() => setActiveConversationId(c.id)}
                  >
                    <div className="chats-item-avatar-wrap">
                      <img className="chats-avatar-img" src={generatedAvatarUrl(conversationAvatarSeed(c))} alt={conversationDisplayName(c)} />
                    </div>

                    <div className="chats-item-body">
                      <div className="chats-item-head">
                        <span className="chats-item-name">{conversationDisplayName(c)}</span>
                        <span className="chats-item-time">{formatTime(c.updated_at)}</span>
                      </div>
                      <p className="chats-item-preview">{conversationSubtitle(c)}</p>
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

          {/* ── Lista: Correo ── */}
          {section === 'mail' && (
            <div className="chats-list">
              {filteredEmails.map((e) => {
                const active = e.id === activeMailId;
                return (
                  <div
                    key={e.id}
                    className={`mail-item ${active ? 'active' : ''} ${!e.read ? 'unread' : ''}`}
                    onClick={() => setActiveMailId(e.id)}
                  >
                    <div className="mail-item-head">
                      <span className="mail-item-sender">{e.sender}</span>
                      <span className="mail-item-date">{e.dateLabel}</span>
                    </div>
                    <p className="mail-item-subject">{e.subject}</p>
                    <p className="mail-item-preview">{e.preview}</p>
                    <div className="mail-item-chip">
                      <span className="mail-item-chip-avatar" style={{ background: e.avatarBg }}>{e.avatarText}</span>
                      <span>{e.sender}</span>
                      {e.verified && <BadgeCheck size={12} className="mail-verified-icon" />}
                    </div>
                  </div>
                );
              })}

              {filteredEmails.length === 0 && (
                <div className="chats-empty-list">
                  <Inbox size={32} />
                  <p>No se encontraron correos.</p>
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
            className={`chats-main-panel ${isDragOver ? 'drag-over' : ''}`}
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
                    <div className="chats-mh-avatar">
                      <img className="chats-avatar-img large" src={generatedAvatarUrl(conversationAvatarSeed(activeConversation))} alt={conversationDisplayName(activeConversation)} />
                    </div>

                    <div>
                      <h2 className="chats-mh-name">{conversationDisplayName(activeConversation)}</h2>
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
                    {currentChatMsgs.map(m => {
                      const isOwn = m.sender_id === currentUser?.id;
                      return (
                        <motion.div
                          key={m.client_id || m._id}
                          className={`chats-bubble-wrapper ${isOwn ? 'user' : 'contact'}`}
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className={`chats-bubble ${isOwn ? 'user' : 'contact'}`}>
                            {m.audio ? (
                              <VoiceMessagePlayer
                                src={`data:${m.audio.mime_type};base64,${m.audio.data}`}
                                waveform={m.audio.waveform}
                                durationSeconds={m.audio.duration_seconds}
                                variant={isOwn ? 'user' : 'contact'}
                              />
                            ) : (
                              <p className="chats-bubble-text">{m.content}</p>
                            )}

                            {m.file_attachment && (
                              <div className="chats-msg-attachment">
                                <FileText size={16} />
                                <span>{m.file_attachment.name} ({m.file_attachment.sizeStr})</span>
                              </div>
                            )}
                          </div>

                          <div className={`chats-bubble-meta ${isOwn ? 'user' : 'contact'}`}>
                            <span>{formatTime(m.created_at)}</span>
                            {isOwn && <CheckCheck size={14} className="chats-check-icon" />}
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

                      <div className="chats-voice-live-waveform">
                        {recorder.liveAmplitude.map((level, i) => (
                          <span key={i} className="chats-voice-live-bar" style={{ height: `${Math.max(15, level * 100)}%` }} />
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

                        {attachedFile && (
                          <div className="chats-dz-preview-tag">
                            <span>📄 {attachedFile.name} ({attachedFile.sizeStr})</span>
                            <button onClick={() => setAttachedFile(null)}><X size={12} /></button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    /* CASO 3: BARRA DE ESCRITURA ── */
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
                        disabled={!input.trim() && !attachedFile}
                        title="Enviar mensaje"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  )}

                </div>
              </>
            )}
          </main>
        )}

        {section === 'mail' && (
          <main className="chats-main-panel mail-main-panel">
            <header className="mail-toolbar">
              <div className="mail-toolbar-left">
                <button className="mail-toolbar-btn" title="Volver a Mensajes" onClick={() => setSection('chats')}>
                  <ArrowLeft size={17} />
                </button>
                <button className="mail-toolbar-btn" title="Archivar"><Archive size={17} /></button>
                <button className="mail-toolbar-btn" title="Información"><Info size={17} /></button>
                <button className="mail-toolbar-btn" title="Eliminar"><Trash2 size={17} /></button>
                <button className="mail-toolbar-btn" title="Responder"><Reply size={17} /></button>
                <button className="mail-toolbar-btn" title="Reenviar"><Forward size={17} /></button>
              </div>
              <span className="mail-toolbar-count">1-{EMAILS.length} de {EMAILS.length}</span>
            </header>

            <div className="mail-detail-body">
              <div className="mail-detail-head">
                <div className="mail-detail-sender-row">
                  <span className="mail-detail-avatar" style={{ background: activeEmail.avatarBg }}>
                    {activeEmail.avatarText}
                  </span>
                  <div className="mail-detail-sender-info">
                    <div className="mail-detail-sender-name">
                      {activeEmail.sender}
                      {activeEmail.verified && <BadgeCheck size={14} className="mail-verified-icon" />}
                      <span className="mail-detail-sender-email">{activeEmail.senderEmail}</span>
                    </div>
                    <span className="mail-detail-to">para {activeEmail.to}</span>
                  </div>
                </div>
                <span className="mail-detail-date">{activeEmail.fullDateLabel}</span>
              </div>

              <h2 className="mail-detail-subject">{activeEmail.subject}</h2>

              <div className="mail-detail-content">
                {activeEmail.body.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {activeEmail.body.bullets && (
                  <ul>
                    {activeEmail.body.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {activeEmail.body.closing && <p>{activeEmail.body.closing}</p>}
              </div>

              {activeEmail.attachment && (
                <div className="mail-attachment-card">
                  <span className="mail-attachment-label">Adjunto</span>
                  <div className="mail-attachment-row">
                    <div className="mail-attachment-icon"><FileText size={18} /></div>
                    <div className="mail-attachment-info">
                      <span className="mail-attachment-name">{activeEmail.attachment.name}</span>
                      <span className="mail-attachment-actions">
                        <button type="button">Ver</button>
                        <span>|</span>
                        <button type="button">Descargar</button>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mail-action-row">
                <button className="mail-action-btn"><Reply size={15} /> Responder</button>
                <button className="mail-action-btn"><Forward size={15} /> Reenviar</button>
              </div>
            </div>

            <div className="mail-compose-bar">
              <input
                type="text"
                placeholder="Escribe algo..."
                value={mailReplyText}
                onChange={(e) => setMailReplyText(e.target.value)}
              />
              <div className="mail-compose-right">
                {currentUser && (
                  <div className="mail-compose-user">
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt={currentUser.name} />
                    ) : null}
                    <span>{currentUser.name}</span>
                  </div>
                )}
                <button type="button" className="mail-compose-send" title="Enviar" disabled={!mailReplyText.trim()}>
                  <Send size={16} />
                </button>
              </div>
            </div>
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
    </div>
  );
}
