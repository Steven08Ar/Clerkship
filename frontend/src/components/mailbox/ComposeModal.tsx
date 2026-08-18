import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, Send, Loader2, AlertCircle } from 'lucide-react';
import { buildFileAttachment, formatFileSize, type FileAttachmentData } from '../../utils/fileUpload';
import type { ComposePayload } from '../../data/mailboxApi';

export interface ComposeDefaults {
  to?: string;
  subject?: string;
  body?: string;
  inReplyTo?: string;
}

interface ComposeModalProps {
  defaults: ComposeDefaults;
  onClose: () => void;
  onSend: (payload: ComposePayload) => Promise<void>;
}

/** Redactar / responder / reenviar — manda por el buzón real, a cualquier
 *  dirección (no hay restricción de dominio ni de "destinatario autorizado",
 *  el dominio ya está verificado en Mailgun). */
export default function ComposeModal({ defaults, onClose, onSend }: ComposeModalProps) {
  const [to, setTo] = useState(defaults.to || '');
  const [cc, setCc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState(defaults.subject || '');
  const [body, setBody] = useState(defaults.body || '');
  const [attachments, setAttachments] = useState<(FileAttachmentData & { id: string })[]>([]);
  const [attaching, setAttaching] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseAddresses(raw: string): string[] {
    return raw.split(/[,;]/).map(s => s.trim()).filter(Boolean);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setAttaching(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const built = await buildFileAttachment(file);
        setAttachments(prev => [...prev, { ...built, id: `${Date.now()}-${Math.random()}` }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo adjuntar el archivo.');
    } finally {
      setAttaching(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSend() {
    const toList = parseAddresses(to);
    if (toList.length === 0) {
      setError('Agregá al menos un destinatario.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await onSend({
        to: toList,
        cc: parseAddresses(cc),
        subject: subject.trim() || '(sin asunto)',
        text: body,
        attachments: attachments.map(a => ({ name: a.name, mime_type: a.mime_type, data: a.data })),
        in_reply_to: defaults.inReplyTo,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo.');
      setSending(false);
    }
  }

  return (
    <motion.div
      className="mbx-compose-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="mbx-compose-modal"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mbx-compose-header">
          <span>Nuevo mensaje</span>
          <button type="button" className="mbx-icon-btn" onClick={onClose} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="mbx-compose-field">
          <span>Para</span>
          <input
            type="text"
            value={to}
            onChange={e => setTo(e.target.value)}
            placeholder="correo@dominio.com, otro@dominio.com"
            autoFocus
          />
          {!showCc && (
            <button type="button" className="mbx-compose-cc-toggle" onClick={() => setShowCc(true)}>Cc</button>
          )}
        </div>

        {showCc && (
          <div className="mbx-compose-field">
            <span>Cc</span>
            <input type="text" value={cc} onChange={e => setCc(e.target.value)} placeholder="opcional" />
          </div>
        )}

        <div className="mbx-compose-field">
          <span>Asunto</span>
          <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Asunto" />
        </div>

        <textarea
          className="mbx-compose-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Escribí tu mensaje..."
        />

        {attachments.length > 0 && (
          <div className="mbx-compose-attachments">
            {attachments.map(a => (
              <span key={a.id} className="mbx-attachment-chip">
                <Paperclip size={12} />
                {a.name} ({formatFileSize(a.size_bytes)})
                <button type="button" onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              className="mbx-compose-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <AlertCircle size={14} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mbx-compose-footer">
          <button type="button" className="mbx-send-btn" onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 size={16} className="mbx-spin" /> : <Send size={15} />}
            Enviar
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          <button
            type="button"
            className="mbx-icon-btn"
            title="Adjuntar archivo"
            onClick={() => fileInputRef.current?.click()}
            disabled={attaching}
          >
            {attaching ? <Loader2 size={16} className="mbx-spin" /> : <Paperclip size={17} />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
