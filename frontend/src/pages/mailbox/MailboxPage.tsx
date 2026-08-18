import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Inbox, Send as SendIcon, Trash2, PenSquare, Star, Paperclip,
  Reply, Forward, Trash, Loader2, RefreshCw, Mail as MailIcon, Search, Download,
  GraduationCap, ShieldAlert,
} from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import ComposeModal, { type ComposeDefaults } from '../../components/mailbox/ComposeModal';
import { useCurrentUser } from '../../utils/currentUser';
import { mainAuthErrorMessage } from '../../data/mainAuth';
import { MAILBOX_READ_EVENT } from '../../utils/mailboxUnread';
import {
  getMailboxStatus, setupMailbox, listMailboxMessages, getMailboxMessage,
  sendMailboxMessage, updateMailboxMessage, deleteMailboxMessage,
  type MailboxStatus, type MailboxFolder, type MailboxMessageSummary, type MailboxMessageDetail,
  type ComposePayload,
} from '../../data/mailboxApi';
import '../../styles/mailbox.css';

const FOLDER_TABS: { id: MailboxFolder; label: string; Icon: typeof Inbox }[] = [
  { id: 'inbox', label: 'Recibidos', Icon: Inbox },
  { id: 'sent', label: 'Enviados', Icon: SendIcon },
  { id: 'trash', label: 'Papelera', Icon: Trash2 },
];

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

function addressLabel(address: string): string {
  const match = address.match(/^"?([^"<]*)"?\s*<?([^>]*)>?$/);
  const name = match?.[1]?.trim();
  return name || address;
}

export default function MailboxPage() {
  const currentUser = useCurrentUser();

  const [status, setStatus] = useState<MailboxStatus | null>(null);
  const [settingUp, setSettingUp] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [authStep, setAuthStep] = useState<1 | 2 | 3>(1);

  const [folder, setFolder] = useState<MailboxFolder>('inbox');
  const [messages, setMessages] = useState<MailboxMessageSummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MailboxMessageDetail | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDefaults, setComposeDefaults] = useState<ComposeDefaults>({});

  /* Estado real: ¿ya autorizó crear su buzón? */
  useEffect(() => {
    getMailboxStatus()
      .then(setStatus)
      .catch(err => setSetupError(mainAuthErrorMessage(err)));
  }, []);

  async function handleAuthorize() {
    setSettingUp(true);
    setSetupError(null);
    try {
      const res = await setupMailbox();
      setStatus(prev => ({ ...(prev as MailboxStatus), mailbox_created: true, address: res.address }));
    } catch (err) {
      setSetupError(mainAuthErrorMessage(err));
    } finally {
      setSettingUp(false);
    }
  }

  async function refreshMessages(silent = false) {
    if (!status?.mailbox_created) return;
    if (!silent) setLoadingMessages(true);
    setListError(null);
    try {
      const { messages: msgs } = await listMailboxMessages(folder);
      setMessages(msgs);
    } catch (err) {
      setListError(mainAuthErrorMessage(err));
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }

  useEffect(() => {
    if (!status?.mailbox_created) return;
    refreshMessages();
    const interval = setInterval(() => refreshMessages(true), 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.mailbox_created, folder]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(m =>
      m.subject.toLowerCase().includes(q) ||
      m.from_address.toLowerCase().includes(q) ||
      m.to_addresses.some(a => a.toLowerCase().includes(q)),
    );
  }, [messages, search]);

  async function openMessage(id: string) {
    setSelectedId(id);
    try {
      const { message } = await getMailboxMessage(id);
      setSelected(message);
      if (!message.read) {
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, read: true } : m)));
        window.dispatchEvent(new Event(MAILBOX_READ_EVENT));
      }
    } catch (err) {
      setListError(mainAuthErrorMessage(err));
    }
  }

  async function handleToggleStar(m: MailboxMessageSummary) {
    const next = !m.starred;
    setMessages(prev => prev.map(x => (x.id === m.id ? { ...x, starred: next } : x)));
    if (selected?.id === m.id) setSelected(prev => (prev ? { ...prev, starred: next } : prev));
    try {
      await updateMailboxMessage(m.id, { starred: next });
    } catch {
      // Silencioso — se corrige solo con el próximo refresh.
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await deleteMailboxMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedId === id) { setSelectedId(null); setSelected(null); }
      if (!res.deleted) {
        // Se movió a Papelera — si no estamos ahí, ya no pertenece a esta lista, que es justo lo que se hizo arriba.
      }
    } catch (err) {
      setListError(mainAuthErrorMessage(err));
    }
  }

  function openCompose(defaults: ComposeDefaults) {
    setComposeDefaults(defaults);
    setComposeOpen(true);
  }

  function handleReply(m: MailboxMessageDetail) {
    openCompose({
      to: m.from_address,
      subject: m.subject.toLowerCase().startsWith('re:') ? m.subject : `Re: ${m.subject}`,
      body: `\n\n---\nEl ${formatDate(m.created_at)}, ${m.from_address} escribió:\n${m.text_body}`,
      inReplyTo: m.id,
    });
  }

  function handleForward(m: MailboxMessageDetail) {
    openCompose({
      to: '',
      subject: m.subject.toLowerCase().startsWith('fwd:') ? m.subject : `Fwd: ${m.subject}`,
      body: `\n\n---------- Mensaje reenviado ----------\nDe: ${m.from_address}\nAsunto: ${m.subject}\n\n${m.text_body}`,
    });
  }

  async function handleSend(payload: ComposePayload) {
    await sendMailboxMessage(payload);
    setComposeOpen(false);
    if (folder === 'sent') refreshMessages(true);
  }

  /* Mientras no sepamos con certeza si ya autorizó el buzón, no mostramos
   * NADA del buzón real — ni por un instante — para no filtrar contenido
   * antes de que el wizard de consentimiento decida si corresponde. */
  if (!status) {
    return (
      <div className="dash-root">
        <Sidebar />
        <div className="mbx-authorize-wrap">
          {setupError ? <p className="mbx-authorize-error">{setupError}</p> : <Loader2 size={26} className="mbx-spin" />}
        </div>
      </div>
    );
  }

  /* ── Pantalla de autorización (primera vez, wizard de 3 pasos) ── */
  if (!status.mailbox_created) {
    return (
      <div className="dash-root">
        <Sidebar />
        <div className="mbx-authorize-wrap">
          <div className="mbx-authorize-panel">

            <AnimatePresence mode="wait">
              {authStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="mbx-authorize-step"
                >
                  <div className="mbx-authorize-icon"><MailIcon size={30} /></div>
                  <h1>Creá tu buzón real</h1>
                  <p>Vas a tener una dirección de correo real y propia:</p>
                  <div className="mbx-authorize-address">
                    {currentUser?.name ? currentUser.email?.split('@')[0] : '...'}
                    <span>@clerk-ship.online</span>
                  </div>
                  <p className="mbx-authorize-note">
                    Vas a poder mandar y recibir correos de verdad, con cualquier dirección de cualquier dominio —
                    no es una simulación. Al autorizar, se crea tu dirección y queda activa de inmediato.
                  </p>
                </motion.div>
              )}

              {authStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="mbx-authorize-step"
                >
                  <div className="mbx-authorize-icon mbx-icon-edu"><GraduationCap size={30} /></div>
                  <h1>Con fines educativos</h1>
                  <p>
                    Este buzón es parte del prototipo de Clerkship, pensado para fines educativos de la
                    plataforma — no reemplaza tu correo institucional ni personal.
                  </p>
                </motion.div>
              )}

              {authStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                  className="mbx-authorize-step"
                >
                  <div className="mbx-authorize-icon mbx-icon-warn"><ShieldAlert size={30} /></div>
                  <h1>Uso responsable</h1>
                  <p>
                    La idea es que este correo se use con fines educativos, para enviar y recibir información
                    relacionada con la plataforma. Clerkship no se hace responsable por el mal uso que se le dé
                    al dominio de correo.
                  </p>

                  <label className="mbx-terms-check">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                    />
                    <span>
                      Acepto los{' '}
                      <Link to="/buzon/terminos" target="_blank" rel="noreferrer">términos y condiciones</Link>
                    </span>
                  </label>

                  {setupError && <p className="mbx-authorize-error">{setupError}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mbx-authorize-nav">
              {authStep > 1 && (
                <button
                  type="button"
                  className="mbx-authorize-back"
                  onClick={() => setAuthStep(authStep === 3 ? 2 : 1)}
                >
                  Atrás
                </button>
              )}
              {authStep < 3 ? (
                <button
                  type="button"
                  className="mbx-authorize-btn"
                  onClick={() => setAuthStep(authStep === 1 ? 2 : 3)}
                >
                  Siguiente
                </button>
              ) : (
                <button
                  type="button"
                  className="mbx-authorize-btn"
                  onClick={handleAuthorize}
                  disabled={settingUp || !acceptedTerms}
                >
                  {settingUp ? <Loader2 size={18} className="mbx-spin" /> : 'Aceptar y crear'}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-root">
      <Sidebar />
      <div className="mbx-page">
        {/* ── Columna izquierda: carpetas ── */}
        <aside className="mbx-folders">
          <button type="button" className="mbx-compose-btn" onClick={() => openCompose({})}>
            <PenSquare size={16} /> <span>Redactar</span>
          </button>

          <nav className="mbx-folder-list">
            {FOLDER_TABS.map(f => (
              <button
                key={f.id}
                type="button"
                className={`mbx-folder-item ${folder === f.id ? 'active' : ''}`}
                onClick={() => { setFolder(f.id); setSelectedId(null); setSelected(null); }}
              >
                <f.Icon size={16} /> <span>{f.label}</span>
              </button>
            ))}
          </nav>

          {status?.address && (
            <div className="mbx-address-chip" title={status.address}>{status.address}</div>
          )}
        </aside>

        {/* ── Columna central: lista de mensajes ── */}
        <section className="mbx-list-panel">
          <div className="mbx-list-header">
            <div className="mbx-search-box">
              <Search size={15} />
              <input
                type="text"
                placeholder="Buscar en el correo"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button type="button" className="mbx-icon-btn" onClick={() => refreshMessages()} title="Actualizar">
              <RefreshCw size={15} />
            </button>
          </div>

          {loadingMessages && (
            <div className="mbx-empty"><Loader2 size={22} className="mbx-spin" /></div>
          )}
          {!loadingMessages && listError && <div className="mbx-empty">{listError}</div>}
          {!loadingMessages && !listError && filtered.length === 0 && (
            <div className="mbx-empty">
              <MailIcon size={28} />
              <p>No hay mensajes acá.</p>
            </div>
          )}

          <div className="mbx-list">
            {!loadingMessages && filtered.map(m => (
              <div
                key={m.id}
                className={`mbx-list-item ${!m.read ? 'unread' : ''} ${selectedId === m.id ? 'active' : ''}`}
                onClick={() => openMessage(m.id)}
              >
                <button
                  type="button"
                  className={`mbx-star-btn ${m.starred ? 'active' : ''}`}
                  onClick={e => { e.stopPropagation(); handleToggleStar(m); }}
                  title="Destacar"
                >
                  <Star size={14} fill={m.starred ? 'currentColor' : 'none'} />
                </button>
                <div className="mbx-list-item-body">
                  <div className="mbx-list-item-top">
                    <span className="mbx-list-item-from">
                      {addressLabel(folder === 'sent' ? m.to_addresses.join(', ') : m.from_address)}
                    </span>
                    <span className="mbx-list-item-date">{formatDate(m.created_at)}</span>
                  </div>
                  <div className="mbx-list-item-subject">
                    {m.subject}
                    {m.attachments.length > 0 && <Paperclip size={12} />}
                  </div>
                  <p className="mbx-list-item-preview">{m.text_body.slice(0, 90)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Columna derecha: lectura ── */}
        <section className="mbx-reading-panel">
          {!selected ? (
            <div className="mbx-empty mbx-empty-reading">
              <MailIcon size={34} />
              <p>Seleccioná un mensaje para leerlo.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mbx-reading-content"
              >
                <div className="mbx-reading-header">
                  <h2>{selected.subject}</h2>
                  <div className="mbx-reading-meta">
                    <span><strong>De:</strong> {selected.from_address}</span>
                    <span><strong>Para:</strong> {selected.to_addresses.join(', ')}</span>
                    {selected.cc_addresses.length > 0 && (
                      <span><strong>Cc:</strong> {selected.cc_addresses.join(', ')}</span>
                    )}
                    <span className="mbx-reading-date">{formatDate(selected.created_at)}</span>
                  </div>
                </div>

                <div className="mbx-reading-actions">
                  <button type="button" onClick={() => handleReply(selected)}><Reply size={14} /> Responder</button>
                  <button type="button" onClick={() => handleForward(selected)}><Forward size={14} /> Reenviar</button>
                  <button type="button" className="danger" onClick={() => handleDelete(selected.id)}>
                    <Trash size={14} /> {folder === 'trash' ? 'Eliminar definitivo' : 'Eliminar'}
                  </button>
                </div>

                <div className="mbx-reading-body">
                  {selected.text_body.split('\n').map((line, i) => <p key={i}>{line || ' '}</p>)}
                </div>

                {selected.attachments.length > 0 && (
                  <div className="mbx-reading-attachments">
                    {selected.attachments.map((a, i) => (
                      <a
                        key={i}
                        className="mbx-attachment-download"
                        href={`data:${a.mime_type};base64,${a.data}`}
                        download={a.name}
                      >
                        <Paperclip size={14} />
                        <span>{a.name}</span>
                        <Download size={13} />
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </section>
      </div>

      <AnimatePresence>
        {composeOpen && (
          <ComposeModal
            defaults={composeDefaults}
            onClose={() => setComposeOpen(false)}
            onSend={handleSend}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
