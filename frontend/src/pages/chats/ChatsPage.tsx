import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Send, Paperclip, Phone, Video, MoreHorizontal,
  CheckCheck, MessageSquare, Sparkles, Mic, Pause, Check, X,
  UploadCloud, Link as LinkIcon, Folder, ChevronDown, ArrowUp, Wand2, FileText, AtSign
} from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import logoUrl from '../../assets/Logo Clerkship.svg';

/* ── Interfaces ────────────────────────────────────────── */
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
  modelBadge: string;
  description: string;
  iconName: string;
}

/* ── 3 Agentes IA de Clerkship ──────────────────────────── */
const CLERKSHIP_AI_AGENTS: AiAgent[] = [
  {
    id: 'agent-orchestrator',
    name: 'Clerkship: Orquestador Diagnóstico',
    modelBadge: 'GPT-4o / Clinical Orchestrator',
    description: 'Coordinación integral del caso clínico y evaluación sistemática.',
    iconName: 'Orquestador',
  },
  {
    id: 'agent-bayesian',
    name: 'Clerkship: Razonamiento Bayesiano',
    modelBadge: 'Bayesian Logic Agent v2',
    description: 'Cálculo de probabilidades pre/post-test y refinamiento de hipótesis.',
    iconName: 'Bayes',
  },
  {
    id: 'agent-guidelines',
    name: 'Clerkship: Guías Clínicas WGO & Gastro',
    modelBadge: 'Evidence-Based Gastro Agent',
    description: 'Soporte basado en evidencia, guías WGO, ACG y consenso médico.',
    iconName: 'Evidencia',
  },
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

/* ═══════════════════════════════════════════════════════════
   ChatsPage Component
   ═══════════════════════════════════════════════════════════ */
export default function ChatsPage() {
  const [tab, setTab] = useState<'direct' | 'group' | 'public'>('direct');
  const [search, setSearch] = useState('');
  const [activeContactId, setActiveContactId] = useState<string>('c1');
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');

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

        {/* ── COLUMNA CENTRAL: CONVERSACIÓN ACTIVA ── */}
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
              <button className="chats-mh-btn" title="Llamada simulada"><Phone size={18} /></button>
              <button className="chats-mh-btn" title="Videoconferencia"><Video size={18} /></button>
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

            {/* CASO 1: Grabación de Nota de Voz en Progreso (Para TODOS los chats) */}
            {isRecording ? (
              <motion.div
                className="chats-voice-bar-active"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  type="button"
                  className="chats-voice-cancel-btn"
                  onClick={handleCancelVoiceNote}
                >
                  Cancelar
                </button>

                <div className="chats-voice-status-center">
                  <span className="chats-voice-red-dot" />
                  <span className="chats-voice-hint">Adelante, graba una nota rápida</span>
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
              </motion.div>
            ) : showDropZoneModal ? (
              /* CASO 2: Zona de Arrastrar y Soltar Archivos (Para TODOS los chats) */
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
                  <p className="chats-dz-sub">Documentos, imágenes, videos, grabaciones de audio, enlaces y más</p>

                  <div className="chats-dz-buttons-row">
                    <button
                      className="chats-dz-icon-circle"
                      title="Subir archivo"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <UploadCloud size={18} />
                    </button>
                    <button
                      className="chats-dz-icon-circle"
                      title="Grabar audio"
                      onClick={() => { setShowDropZoneModal(false); setIsRecording(true); }}
                    >
                      <Mic size={18} />
                    </button>
                    <button
                      className="chats-dz-icon-circle"
                      title="Adjuntar enlace"
                      onClick={() => handleSendMessage('🔗 https://clerkship.med.co/caso-gastro-1')}
                    >
                      <LinkIcon size={18} />
                    </button>
                    <button
                      className="chats-dz-icon-circle"
                      title="Explorar repositorios"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Folder size={18} />
                    </button>
                  </div>

                  {attachedFile && (
                    <div className="chats-dz-preview-tag">
                      <span>📄 {attachedFile.name}</span>
                      <button onClick={() => setAttachedFile(null)}><X size={12} /></button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeContact.isAi ? (
              /* CASO 3: BARRA EXCLUSIVA PARA EL CHAT DE LA IA DE CLERKSHIP */
              <div className="chats-ai-input-wrapper">
                
                {/* Etiqueta de contexto superior (@ Onboarding / Historia Clínica) */}
                <div className="chats-ai-top-chip-bar">
                  <span className="chats-ai-context-chip">
                    <AtSign size={12} className="chats-chip-at" />
                    <span className="chats-chip-icon">📹</span>
                    <strong>Caso Gastroenterología #12</strong>
                    <span className="chats-chip-date">Hoy</span>
                  </span>
                  <span className="chats-ai-task-hint">Analizar diagnóstico diferencial y solicitar paraclínicos</span>
                </div>

                {/* Barra Principal de la IA */}
                <div className="chats-ai-main-bar">
                  {/* Botón + para agregar archivo/contexto */}
                  <button
                    type="button"
                    className="chats-ai-plus-btn"
                    title="Agregar archivo o contexto"
                    onClick={() => setShowDropZoneModal(true)}
                  >
                    <Plus size={18} />
                  </button>

                  {/* Selector desplegable entre los 3 Agentes de IA */}
                  <div className="chats-ai-agent-picker" ref={agentMenuRef}>
                    <button
                      type="button"
                      className="chats-ai-agent-pill"
                      onClick={() => setAgentMenuOpen(v => !v)}
                    >
                      <img src={logoUrl} alt="AI" className="chats-ai-pill-logo" />
                      <span className="chats-ai-pill-name">{selectedAgent.name}</span>
                      <ChevronDown size={14} className={`chats-ai-pill-chevron ${agentMenuOpen ? 'open' : ''}`} />
                    </button>

                    {/* Menú Desplegable con los 3 Agentes */}
                    <AnimatePresence>
                      {agentMenuOpen && (
                        <motion.div
                          className="chats-ai-agent-dropdown"
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="chats-agent-drop-head">Agentes Clínicos Disponibles (3)</div>
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
                              <div className="chats-agent-item-top">
                                <span className="chats-agent-item-title">{agent.name}</span>
                                {selectedAgent.id === agent.id && <Check size={14} className="chats-agent-check" />}
                              </div>
                              <span className="chats-agent-item-badge">{agent.modelBadge}</span>
                              <p className="chats-agent-item-desc">{agent.description}</p>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Accesos Rápidos de Herramientas de IA */}
                  <div className="chats-ai-tools-row">
                    <button
                      type="button"
                      className="chats-ai-tool-chip"
                      onClick={() => handleSendMessage('✨ Sugerir hipótesis diagnósticas para este caso')}
                    >
                      <Wand2 size={13} /> Sugerir hipótesis
                    </button>
                    <button
                      type="button"
                      className="chats-ai-tool-chip"
                      onClick={() => handleSendMessage('🔍 Buscar evidencia y guías WGO para dolor epigástrico')}
                    >
                      <Search size={13} /> Buscar literatura
                    </button>
                  </div>

                  {/* Campo de Entrada de Texto para IA */}
                  <input
                    type="text"
                    className="chats-text-input chats-ai-input"
                    placeholder="Haz una pregunta de seguimiento. Usa @ para etiquetar documentos..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />

                  {/* Controles del Lado Derecho: Micrófono y Botón de Enviar */}
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

                {/* Previsualización de Archivo Adjunto */}
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

        {/* ── COLUMNA DERECHA: LISTA DE CHATS Y CONVERSACIONES ── */}
        <aside className="chats-sidebar-panel right">
          <div className="chats-sb-header">
            <div className="chats-sb-title-row">
              <h1 className="chats-sb-title">Chats</h1>
              <button className="chats-add-btn" title="Nuevo chat">
                <Plus size={16} />
              </button>
            </div>

            {/* Selector de pestañas: Directos | Grupos | Públicos */}
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

            {/* Barra de Búsqueda */}
            <div className="chats-search-box">
              <Search size={15} className="chats-search-icon" />
              <input
                type="text"
                placeholder="Buscar conversación o preceptor..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de Conversaciones */}
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
        </aside>

      </div>
    </div>
  );
}
