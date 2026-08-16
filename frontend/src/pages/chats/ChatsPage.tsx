import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Send, Paperclip, Phone, Video, MoreHorizontal,
  CheckCheck, MessageSquare, Users, Bell, UserPlus, Sparkles, ShieldCheck
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
}

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

/* ── Notifications and Suggestions for Right Panel ────── */
const NOTIFICATIONS = [
  { id: 'n1', text: '@Dra. Elena te mencionó en "Evaluación de Úlcera Péptica"', timeStr: 'Hace 10 min' },
  { id: 'n2', text: 'Dr. Harshit te añadió al grupo "Discusión Gastroenterología"', timeStr: 'Hace 1 hora' },
  { id: 'n3', text: 'Agente Orquestador completó el feedback de tu última simulación', timeStr: 'Hace 3 horas' },
];

const SUGGESTIONS = [
  { id: 's1', name: 'Dr. Abhiman Singh', role: 'Especialista Hepatología', mutuals: '12 casos compartidos' },
  { id: 's2', name: 'Dra. Ved Prakash', role: 'Preceptora Gastro', mutuals: '15 estudiantes en común' },
  { id: 's3', name: 'Dr. Amit Trivedi', role: 'Residente R3 Gastro', mutuals: '7 discusiones activas' },
];

/* ═══════════════════════════════════════════════════════════
   ChatsPage Component
   ═══════════════════════════════════════════════════════════ */
export default function ChatsPage() {
  const [tab, setTab] = useState<'direct' | 'group' | 'public'>('direct');
  const [search, setSearch] = useState('');
  const [activeContactId, setActiveContactId] = useState<string>('c1');
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = MOCK_CONTACTS.find(c => c.id === activeContactId) || MOCK_CONTACTS[0];

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

  /* Handle Send Message */
  function handleSendMessage() {
    if (!input.trim()) return;
    const nowStr = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: input.trim(),
      timeStr: nowStr,
    };

    setMessages(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), userMsg],
    }));

    const sentText = input.trim();
    setInput('');

    /* Auto Simulated Reply for AI / Preceptor */
    setTimeout(() => {
      let replyText = 'Entendido. Continúa con tu análisis clínico.';
      if (activeContact.isAi) {
        replyText = `He analizado tu aporte ("${sentText.slice(0, 30)}..."). En patología gastroenterológica, este hallazgo apoya la necesidad de evaluar paraclínicos específicos.`;
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

  const currentChatMsgs = messages[activeContactId] || [];

  return (
    <div className="dash-root">
      <Sidebar />

      <div className="chats-page-wrapper">
        
        {/* ── COLUMNA IZQUIERDA: LISTA DE CHATS ── */}
        <aside className="chats-sidebar-panel">
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

        {/* ── COLUMNA CENTRAL: CONVERSACIÓN ACTIVA ── */}
        <main className="chats-main-panel">
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

          {/* Input de Mensaje */}
          <div className="chats-input-footer">
            <div className="chats-input-bar">
              <button className="chats-attach-btn" title="Adjuntar archivo o paraclínico">
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
                className="chats-send-btn"
                onClick={handleSendMessage}
                disabled={!input.trim()}
                title="Enviar mensaje"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </main>

        {/* ── COLUMNA DERECHA: NOTIFICACIONES & SUGERENCIAS ── */}
        <aside className="chats-right-panel">
          {/* Sección Notificaciones */}
          <div className="chats-rp-section">
            <div className="chats-rp-head">
              <Bell size={16} className="chats-rp-icon" />
              <h3>Notificaciones</h3>
            </div>

            <div className="chats-rp-list">
              {NOTIFICATIONS.map(n => (
                <div key={n.id} className="chats-rp-item">
                  <p className="chats-rp-item-text">{n.text}</p>
                  <span className="chats-rp-item-time">{n.timeStr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sección Sugerencias de Preceptores / Contactos */}
          <div className="chats-rp-section">
            <div className="chats-rp-head">
              <Users size={16} className="chats-rp-icon" />
              <h3>Sugerencias</h3>
            </div>

            <div className="chats-rp-list">
              {SUGGESTIONS.map(s => (
                <div key={s.id} className="chats-rp-sug-card">
                  <div className="chats-rp-sug-info">
                    <h4>{s.name}</h4>
                    <p>{s.role}</p>
                    <span className="chats-rp-sug-sub">{s.mutuals}</span>
                  </div>
                  <button className="chats-sug-add-btn">
                    <UserPlus size={13} /> Agregar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Banner Informativo */}
          <div className="chats-rp-info-card">
            <ShieldCheck size={20} className="chats-rp-shield" />
            <div>
              <h4>Simulación Segura</h4>
              <p>Todas las discusiones en chats clínicos están encriptadas y protegidas para entornos académicos.</p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
