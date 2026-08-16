import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Send, Paperclip, MoreHorizontal,
  CheckCheck, MessageSquare, Sparkles, Mic, Pause, Check, X,
  UploadCloud, Link as LinkIcon, ChevronDown, ArrowUp, Wand2, FileText,
  Mail, Users, BookOpen, FileCheck, Archive, Info, Trash2, Reply, Forward,
  BadgeCheck, Inbox, ArrowLeft,
} from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import { useCurrentUser } from '../../utils/currentUser';
import logoUrl from '../../assets/Logo Clerkship.svg';

/* ── Interfaces: Chats ─────────────────────────────────── */
interface Contact {
  id: string;
  name: string;
  role: string;
  avatarText?: string;
  isAi?: boolean;
  avatarBg?: string;
  online: boolean;
  lastSeen?: string;
  type: 'direct' | 'group' | 'public';
  unreadCount?: number;
  lastMessage: string;
  timeStr: string;
}

interface Message {
  id: string;
  sender: 'user' | 'contact';
  text: string;
  timeStr: string;
  fileAttachment?: { name: string; sizeStr: string; type: string };
  audioDuration?: string;
}

interface AiAgent {
  id: string;
  name: string;
}

/* ── Interfaces: Correo ────────────────────────────────── */
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

/* ── 3 Agentes IA de Clerkship ──────────────────────────── */
const CLERKSHIP_AI_AGENTS: AiAgent[] = [
  { id: 'agent-orchestrator', name: 'Clerkship: Orquestador Diagnóstico' },
  { id: 'agent-bayesian',     name: 'Clerkship: Razonamiento Bayesiano' },
  { id: 'agent-guidelines',   name: 'Clerkship: Guías Clínicas WGO & Gastro' },
];

/* ── Mock Contacts ─────────────────────────────────────── */
const MOCK_CONTACTS: Contact[] = [
  {
    id: 'c1',
    name: 'Agente Orquestador IA',
    role: 'Tutor Clínico Inteligente',
    isAi: true,
    online: true,
    lastSeen: 'En línea ahora',
    type: 'direct',
    unreadCount: 2,
    lastMessage: 'Excelente precisión en la anamnesis del caso de gastroenterología. ¿Revisamos las hipótesis?',
    timeStr: '11:32 a. m.',
  },
  {
    id: 'c2',
    name: 'Dra. Elena Rostova',
    role: 'Preceptora Principal de Gastroenterología',
    avatarText: 'ER',
    avatarBg: '#E11D48',
    online: true,
    lastSeen: 'En línea ahora',
    type: 'direct',
    unreadCount: 1,
    lastMessage: 'Revisé tu razonamiento bayesiano en la sesión de úlcera. Muy acertado el abordaje.',
    timeStr: '10:15 a. m.',
  },
  {
    id: 'c3',
    name: 'Grupo Discusión Gastroenterología',
    role: '6 Estudiantes · 1 Preceptor',
    avatarText: 'GG',
    avatarBg: '#0284C7',
    online: true,
    lastSeen: 'Activo hace 5 min',
    type: 'group',
    unreadCount: 4,
    lastMessage: 'Dr. Harshit: ¿Alguien tiene la guía WGO 2023 sobre pancreatitis aguda?',
    timeStr: '09:40 a. m.',
  },
  {
    id: 'c4',
    name: 'Dra. Kirti Yadav',
    role: 'Residente de Gastroenterología (R2)',
    avatarText: 'KY',
    avatarBg: '#9333EA',
    online: false,
    lastSeen: 'Hace 3 horas',
    type: 'direct',
    lastMessage: '¿Nos reunimos hoy para analizar el diagnóstico diferencial de ictericia?',
    timeStr: 'Ayer',
  },
  {
    id: 'c5',
    name: 'Comunidad Clínica Abierta',
    role: '24 Miembros Activos',
    avatarText: 'CA',
    avatarBg: '#10B981',
    online: true,
    lastSeen: 'En línea',
    type: 'public',
    lastMessage: 'Nuevo caso clínico disponible: Dolor abdominal recurrente en paciente joven.',
    timeStr: 'Ayer',
  },
  {
    id: 'c6',
    name: 'Dr. Ashish Singh',
    role: 'Especialista en Hepatología',
    avatarText: 'AS',
    avatarBg: '#F59E0B',
    online: false,
    lastSeen: 'Ayer a las 4:00 p. m.',
    type: 'direct',
    lastMessage: 'Te compartí los últimos resultados del perfil hepático del caso 7.',
    timeStr: '14/05',
  },
];

/* ── Mock Initial Chat Messages per Contact ─────────────── */
const INITIAL_MESSAGES: Record<string, Message[]> = {
  c1: [
    { id: 'm1', sender: 'contact', text: '¡Hola, Santiago! He registrado tu progreso en el módulo de Gastroenterología.', timeStr: '11:20 a. m.' },
    { id: 'm2', sender: 'user', text: 'Hola. Estaba revisando la viñeta clínica del caso de dolor epigástrico urente.', timeStr: '11:25 a. m.' },
    { id: 'm3', sender: 'contact', text: 'Excelente precisión en la anamnesis del caso de gastroenterología. ¿Revisamos las hipótesis?', timeStr: '11:32 a. m.' },
  ],
  c2: [
    { id: 'm4', sender: 'contact', text: 'Santiago, felicitaciones por la puntuación del 87% en el caso de Úlcera Péptica.', timeStr: '10:10 a. m.' },
    { id: 'm5', sender: 'user', text: 'Muchas gracias, Dra. Elena. Justifiqué adecuadamente la endoscopia digestiva alta.', timeStr: '10:12 a. m.' },
    { id: 'm6', sender: 'contact', text: 'Revisé tu razonamiento bayesiano en la sesión de úlcera. Muy acertado el abordaje.', timeStr: '10:15 a. m.' },
  ],
  c3: [
    { id: 'm7', sender: 'contact', text: 'Dr. Harshit: ¿Alguien tiene la guía WGO 2023 sobre pancreatitis aguda?', timeStr: '09:40 a. m.' },
  ],
};

/* ── Mock Correos ──────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════
   ChatsPage Component — Chats, Correo y Comunidad en un solo
   lugar: cambiar de sección NUNCA navega a otra ruta, solo
   cambia qué se muestra dentro de este mismo panel.
   ═══════════════════════════════════════════════════════════ */
export default function ChatsPage() {
  const currentUser = useCurrentUser();
  const [section, setSection] = useState<Section>('chats');

  /* ── Estado: Chats ── */
  const [tab, setTab] = useState<'direct' | 'group' | 'public'>('direct');
  const [search, setSearch] = useState('');
  const [activeContactId, setActiveContactId] = useState<string>('c1');
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

  /* ── Estado: Correo ── */
  const [mailSearch, setMailSearch] = useState('');
  const [mailTab, setMailTab] = useState<'all' | 'read' | 'unread'>('all');
  const [activeMailId, setActiveMailId] = useState<string>(EMAILS[0].id);
  const [mailReplyText, setMailReplyText] = useState('');

  /* 🤖 Agentes IA de Clerkship */
  const [selectedAgent, setSelectedAgent] = useState<AiAgent>(CLERKSHIP_AI_AGENTS[0]);
  const [agentMenuOpen, setAgentMenuOpen] = useState(false);
  const agentMenuRef = useRef<HTMLDivElement>(null);

  /* 📁 Estados de Archivos & Drag and Drop */
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; sizeStr: string; type: string } | null>(null);
  const [showDropZoneModal, setShowDropZoneModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* 🎙️ Estados de Grabación de Audio */
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeContact = MOCK_CONTACTS.find(c => c.id === activeContactId) || MOCK_CONTACTS[0];

  /* Timer de Grabación de Nota de Voz */
  useEffect(() => {
    let timer: any = null;
    if (isRecording && !isRecordingPaused) {
      timer = setInterval(() => {
        setRecSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isRecording, isRecordingPaused]);

  /* Outside click listener para cerrar menu de agentes */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (agentMenuRef.current && !agentMenuRef.current.contains(e.target as Node)) {
        setAgentMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* Filter contacts by search & tab */
  const filteredContacts = useMemo(() => {
    return MOCK_CONTACTS.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.role.toLowerCase().includes(search.toLowerCase());
      const matchTab = c.type === tab;
      return matchSearch && matchTab;
    });
  }, [search, tab]);

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

  /* Auto scroll chat messages to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContactId]);

  /* Handle Send Text / File Message */
  function handleSendMessage(customText?: string) {
    const textToSend = customText || input;
    if (!textToSend.trim() && !attachedFile) return;

    const nowStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: textToSend.trim(),
      timeStr: nowStr,
      fileAttachment: attachedFile || undefined,
    };

    setMessages(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), userMsg],
    }));

    const sentText = textToSend.trim();
    setInput('');
    setAttachedFile(null);
    setShowDropZoneModal(false);

    /* Auto Simulated Reply for AI / Preceptor */
    setTimeout(() => {
      let replyText = 'Entendido. Continúa con tu análisis clínico.';
      if (activeContact.isAi) {
        replyText = `[${selectedAgent.name}] He analizado tu mensaje ("${sentText.slice(0, 35)}..."). Con base en las guías gastroenterológicas, este dato ayuda a precisar el diagnóstico diferencial.`;
      } else if (activeContact.name.includes('Elena')) {
        replyText = 'Excelente observación. Asegúrate de incluir el plan farmacológico en el diagnóstico final.';
      }

      const replyMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'contact',
        text: replyText,
        timeStr: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => ({
        ...prev,
        [activeContactId]: [...(prev[activeContactId] || []), replyMsg],
      }));
    }, 1200);
  }

  /* Handle Finish Voice Note Recording */
  function handleSendVoiceNote() {
    const nowStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const mins = Math.floor(recSeconds / 60);
    const secs = recSeconds % 60;
    const durStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const voiceMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: `🎤 Nota de voz grabada (${durStr})`,
      timeStr: nowStr,
      audioDuration: durStr,
    };

    setMessages(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), voiceMsg],
    }));

    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecSeconds(0);
  }

  function handleCancelVoiceNote() {
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecSeconds(0);
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

  const currentChatMsgs = messages[activeContactId] || [];

  /* Formato del Temporizador mm:ss */
  const recMinutes = Math.floor(recSeconds / 60);
  const recSecsRem = recSeconds % 60;
  const timerDisplay = `0:${recMinutes < 10 ? '0' : ''}${recMinutes}:${recSecsRem < 10 ? '0' : ''}${recSecsRem}`;

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
                title="Chats y Mensajes"
                onClick={() => setSection('chats')}
              >
                <MessageSquare size={20} />
              </button>

              <button
                className={`chats-nav-icon-btn ${section === 'mail' ? 'active' : ''}`}
                title="Correo e Historial de Comunicados"
                onClick={() => setSection('mail')}
              >
                <Mail size={20} />
                {unreadMailCount > 0 && <span className="chats-nav-badge">{unreadMailCount}</span>}
              </button>

              <button
                className={`chats-nav-icon-btn ${section === 'community' ? 'active' : ''}`}
                title="Comunidad Médica"
                onClick={() => setSection('community')}
              >
                <Users size={20} />
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
                  <h1 className="chats-sb-title">Chats</h1>
                  <button className="chats-add-btn" title="Nuevo chat">
                    <Plus size={18} />
                  </button>
                </div>

                <div className="chats-tab-group">
                  <button
                    className={`chats-tab-btn ${tab === 'direct' ? 'active' : ''}`}
                    onClick={() => setTab('direct')}
                  >
                    DIRECT <span className="chats-red-dot" />
                  </button>
                  <button
                    className={`chats-tab-btn ${tab === 'group' ? 'active' : ''}`}
                    onClick={() => setTab('group')}
                  >
                    GROUPS <span className="chats-red-dot" />
                  </button>
                  <button
                    className={`chats-tab-btn ${tab === 'public' ? 'active' : ''}`}
                    onClick={() => setTab('public')}
                  >
                    PUBLIC <span className="chats-red-dot" />
                  </button>
                </div>

                <div className="chats-search-box">
                  <Search size={15} className="chats-search-icon" />
                  <input
                    type="text"
                    placeholder="Buscar conversación o preceptor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* ── Encabezado de sección: Correo ── */}
            {section === 'mail' && (
              <>
                <div className="chats-sb-title-row">
                  <h1 className="chats-sb-title">Inbox</h1>
                </div>

                <div className="chats-search-box">
                  <Search size={15} className="chats-search-icon" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={mailSearch}
                    onChange={(e) => setMailSearch(e.target.value)}
                  />
                </div>

                <div className="mail-tab-group">
                  <button className={`mail-tab-btn ${mailTab === 'all' ? 'active' : ''}`} onClick={() => setMailTab('all')}>All</button>
                  <button className={`mail-tab-btn ${mailTab === 'read' ? 'active' : ''}`} onClick={() => setMailTab('read')}>Read</button>
                  <button className={`mail-tab-btn ${mailTab === 'unread' ? 'active' : ''}`} onClick={() => setMailTab('unread')}>Unread</button>
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

          {/* ── Lista: Chats ── */}
          {section === 'chats' && (
            <div className="chats-list">
              {filteredContacts.map(c => {
                const active = c.id === activeContactId;
                return (
                  <div
                    key={c.id}
                    className={`chats-item ${active ? 'active' : ''}`}
                    onClick={() => setActiveContactId(c.id)}
                  >
                    <div className="chats-item-avatar-wrap">
                      {c.isAi ? (
                        <div className="chats-avatar-ai">
                          <img src={logoUrl} alt="AI" />
                        </div>
                      ) : (
                        <div className="chats-avatar-text" style={{ background: c.avatarBg || '#0284C7' }}>
                          {c.avatarText}
                        </div>
                      )}
                      {c.online && <span className="chats-online-dot" />}
                    </div>

                    <div className="chats-item-body">
                      <div className="chats-item-head">
                        <span className="chats-item-name">{c.name}</span>
                        <span className="chats-item-time">{c.timeStr}</span>
                      </div>
                      <p className="chats-item-preview">{c.lastMessage}</p>
                    </div>

                    {c.unreadCount && c.unreadCount > 0 && !active && (
                      <span className="chats-unread-badge">{c.unreadCount}</span>
                    )}
                  </div>
                );
              })}

              {filteredContacts.length === 0 && (
                <div className="chats-empty-list">
                  <MessageSquare size={32} />
                  <p>No se encontraron conversaciones.</p>
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

            {/* Header del Chat Activo */}
            <header className="chats-main-header">
              <div className="chats-mh-left">
                <div className="chats-mh-avatar">
                  {activeContact.isAi ? (
                    <div className="chats-avatar-ai large">
                      <img src={logoUrl} alt="AI" />
                    </div>
                  ) : (
                    <div className="chats-avatar-text large" style={{ background: activeContact.avatarBg || '#0284C7' }}>
                      {activeContact.avatarText}
                    </div>
                  )}
                  {activeContact.online && <span className="chats-online-dot large" />}
                </div>

                <div>
                  <h2 className="chats-mh-name">
                    {activeContact.name}
                    {activeContact.isAi && <span className="chats-ai-tag"><Sparkles size={11} /> IA</span>}
                  </h2>
                  <p className="chats-mh-status">{activeContact.role} · {activeContact.lastSeen}</p>
                </div>
              </div>

              <div className="chats-mh-actions">
                <button className="chats-mh-btn" title="Opciones"><MoreHorizontal size={18} /></button>
              </div>
            </header>

            {/* Área de Mensajes */}
            <div className="chats-messages-body">
              <div className="chats-date-divider">
                <span>Hoy 12:21 p. m.</span>
              </div>

              <AnimatePresence initial={false}>
                {currentChatMsgs.map(m => (
                  <motion.div
                    key={m.id}
                    className={`chats-bubble-wrapper ${m.sender === 'user' ? 'user' : 'contact'}`}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`chats-bubble ${m.sender === 'user' ? 'user' : 'contact'}`}>
                      <p className="chats-bubble-text">{m.text}</p>

                      {/* Previsualización de archivo adjunto si existe */}
                      {m.fileAttachment && (
                        <div className="chats-msg-attachment">
                          <FileText size={16} />
                          <span>{m.fileAttachment.name} ({m.fileAttachment.sizeStr})</span>
                        </div>
                      )}

                      <div className="chats-bubble-meta">
                        <span>{m.timeStr}</span>
                        {m.sender === 'user' && <CheckCheck size={14} className="chats-check-icon" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* ── FOOTER DE ENTRADA / BARRA DE ESCRIBIR ── */}
            <div className="chats-input-footer">

              {/* CASO 1: Grabación de Nota de Voz en Progreso */}
              {isRecording ? (
                <motion.div
                  className="chats-voice-bar-active"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="chats-voice-top-label">Go ahead, record a quick note</div>
                  <div className="chats-voice-controls-row">
                    <button
                      type="button"
                      className="chats-voice-cancel-btn"
                      onClick={handleCancelVoiceNote}
                    >
                      Cancel
                    </button>

                    <div className="chats-voice-status-center">
                      <span className="chats-voice-red-dot" />
                      <span className="chats-voice-timer">{timerDisplay}</span>
                    </div>

                    <div className="chats-voice-actions-right">
                      <button
                        type="button"
                        className="chats-voice-pause-btn"
                        onClick={() => setIsRecordingPaused(v => !v)}
                        title={isRecordingPaused ? 'Reanudar' : 'Pausar'}
                      >
                        <Pause size={18} />
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
                    <p className="chats-dz-title">Drop anything here or browse</p>
                    <p className="chats-dz-sub">Docs, images, videos, audio files, links & more</p>

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
                        onClick={() => { setShowDropZoneModal(false); setIsRecording(true); }}
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
              ) : activeContact.isAi ? (
                /* CASO 3: BARRA EXCLUSIVA PARA EL CHAT DE LA IA DE CLERKSHIP */
                <div className="chats-ai-input-wrapper">

                  <div className="chats-ai-top-write-row">
                    <input
                      type="text"
                      className="chats-text-input chats-ai-input"
                      placeholder="Escribe una pregunta o consulta a la IA de Clerkship..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />

                    <div className="chats-ai-right-controls">
                      <button
                        type="button"
                        className="chats-ai-mic-btn"
                        title="Grabar nota de voz"
                        onClick={() => setIsRecording(true)}
                      >
                        <Mic size={18} />
                      </button>

                      <button
                        type="button"
                        className="chats-ai-send-arrow-btn"
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() && !attachedFile}
                        title="Enviar mensaje a la IA"
                      >
                        <ArrowUp size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="chats-ai-bottom-tools-row">
                    <button
                      type="button"
                      className="chats-ai-plus-btn"
                      title="Agregar archivo o contexto"
                      onClick={() => setShowDropZoneModal(true)}
                    >
                      <Plus size={18} />
                    </button>

                    <div className="chats-ai-agent-picker" ref={agentMenuRef}>
                      <button
                        type="button"
                        className="chats-ai-agent-pill"
                        onClick={() => setAgentMenuOpen(v => !v)}
                      >
                        <svg viewBox="0 0 600 600" fill="none" className="chats-ai-pill-logo" aria-hidden="true">
                          <path d="M281 162.706C213.776 171.963 162 229.639 162 299.408C162 369.177 213.776 426.852 281 436.109V395.565C235.97 386.718 202 347.031 202 299.408C202 251.785 235.97 212.097 281 203.25V162.706Z" fill="currentColor" />
                          <path d="M281 0C124.167 9.80161 0 140.105 0 299.408C0 458.712 124.167 589.014 281 598.815V558.723C146.277 548.992 40 436.612 40 299.408C40 162.204 146.277 49.8229 281 40.0928V0Z" fill="currentColor" />
                          <path d="M281 81.7217C168.946 91.3515 81 185.359 81 299.908C81 414.457 168.946 508.464 281 518.094V477.908C191.074 468.42 121 392.349 121 299.908C121 207.467 191.074 131.395 281 121.907V81.7217Z" fill="currentColor" />
                          <path d="M381 10.4707C361.456 5.20365 350.513 3.2851 331 0.990432V599.408H381V10.4707Z" fill="currentColor" />
                          <path d="M490 67.2329C471.749 52.3211 460.342 45.7459 440 34.0101V599.408H490V67.2329Z" fill="currentColor" />
                          <path d="M600 299.408C597.743 227.434 581.5 182.408 550 133.518V599.408H600V299.408Z" fill="currentColor" />
                        </svg>
                        <span className="chats-ai-pill-name">{selectedAgent.name}</span>
                        <ChevronDown size={14} className={`chats-ai-pill-chevron ${agentMenuOpen ? 'open' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {agentMenuOpen && (
                          <motion.div
                            className="chats-ai-agent-dropdown"
                            initial={{ opacity: 0, y: 8, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                          >
                            {CLERKSHIP_AI_AGENTS.map(agent => (
                              <button
                                key={agent.id}
                                type="button"
                                className={`chats-agent-drop-item ${selectedAgent.id === agent.id ? 'active' : ''}`}
                                onClick={() => {
                                  setSelectedAgent(agent);
                                  setAgentMenuOpen(false);
                                }}
                              >
                                <span className="chats-agent-item-title">{agent.name}</span>
                                {selectedAgent.id === agent.id && <Check size={14} className="chats-agent-check" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="chats-ai-tools-row">
                      <button
                        type="button"
                        className="chats-ai-tool-chip"
                        title="Sugerir hipótesis diagnósticas"
                        onClick={() => handleSendMessage('✨ Sugerir hipótesis diagnósticas')}
                      >
                        <Sparkles size={14} />
                      </button>
                      <button
                        type="button"
                        className="chats-ai-tool-chip"
                        title="Buscar literatura médica"
                        onClick={() => handleSendMessage('🔍 Buscar evidencia y guías WGO')}
                      >
                        <Search size={14} />
                      </button>
                      <button
                        type="button"
                        className="chats-ai-tool-chip"
                        title="Generar resumen de viñeta"
                        onClick={() => handleSendMessage('🪄 Generar resumen clínico')}
                      >
                        <Wand2 size={14} />
                      </button>
                    </div>
                  </div>

                  {attachedFile && (
                    <div className="chats-ai-file-preview-bar">
                      <FileText size={14} />
                      <span>{attachedFile.name} ({attachedFile.sizeStr})</span>
                      <button onClick={() => setAttachedFile(null)}><X size={12} /></button>
                    </div>
                  )}
                </div>
              ) : (
                /* CASO 4: BARRA PARA CHATS HUMANOS / PRECEPTORES */
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
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />

                  <button
                    type="button"
                    className="chats-attach-btn"
                    title="Grabar nota de voz"
                    onClick={() => setIsRecording(true)}
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
          </main>
        )}

        {section === 'mail' && (
          <main className="chats-main-panel mail-main-panel">
            <header className="mail-toolbar">
              <div className="mail-toolbar-left">
                <button className="mail-toolbar-btn" title="Volver a Chats" onClick={() => setSection('chats')}>
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
                    <span className="mail-detail-to">to {activeEmail.to}</span>
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
                  <span className="mail-attachment-label">Attachment</span>
                  <div className="mail-attachment-row">
                    <div className="mail-attachment-icon"><FileText size={18} /></div>
                    <div className="mail-attachment-info">
                      <span className="mail-attachment-name">{activeEmail.attachment.name}</span>
                      <span className="mail-attachment-actions">
                        <button type="button">View</button>
                        <span>|</span>
                        <button type="button">Download</button>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mail-action-row">
                <button className="mail-action-btn"><Reply size={15} /> Reply</button>
                <button className="mail-action-btn"><Forward size={15} /> Continue</button>
              </div>
            </div>

            <div className="mail-compose-bar">
              <input
                type="text"
                placeholder="Type anything..."
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
