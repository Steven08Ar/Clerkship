import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, CheckCircle, Plus, Trash2, Send,
  Clock, ChevronRight,
  Info, BookOpen, BarChart2, ArrowLeft, LogOut, Paperclip,
  Stethoscope, FlaskConical, MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoUrl from '../../assets/Logo Clerkship.svg';

/* ═══════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════ */
interface Hypothesis {
  id: string; text: string; probability: number;
  argument: string; status: 'active' | 'discarded';
}
interface ChatMsg { role: 'student' | 'patient'; text: string; ts: number; }
interface PhysicalFinding { id: string; result: string; }
interface DiagTest {
  id: string; name: string; category: string;
  justification: string; result: string | null; justified: boolean;
}
type Stage = 1 | 2 | 3 | 4 | 5 | 6;

/* ═══════════════════════════════════════════════════════════
   Static data
   ═══════════════════════════════════════════════════════════ */
const CASE = {
  name: 'Carlos Mendoza', age: 42, sex: 'Masculino', occupation: 'Contador',
  motivo: 'Dolor abdominal agudo en paciente joven',
  vignette: `Paciente masculino de 42 años, contador, que consulta por dolor abdominal de 3 semanas de evolución localizado en epigastrio, de carácter urente, asociado a náuseas postprandiales. Refiere pérdida de peso no intencional de aproximadamente 4 kg en el último mes. No refiere vómito ni cambios en el hábito intestinal.`,
};

const MOCK_RESPONSES: [string[], string][] = [
  [['dolor','duele','molestia','siente'],
    'El dolor es como una quemazón, aquí en la boca del estómago. Aparece especialmente después de comer, pero a veces también en ayunas de madrugada. Le daré un valor de 6 sobre 10.'],
  [['irradia','espalda','hacia'],
    'Sí, a veces siento que el dolor se va un poco hacia la espalda, aunque no siempre.'],
  [['medicamento','pastilla','ibuprofeno','antiinflamatorio'],
    'Solo tomo ibuprofeno cuando el dolor es muy fuerte. Llevo casi dos meses tomándolo casi todos los días.'],
  [['comer','comida','alimento'],
    'El dolor empeora después de comer, sobre todo con comidas grasosas o picantes. A veces también en la madrugada.'],
  [['náusea','nausea','vómito','vomito'],
    'Sí, tengo náuseas seguido, especialmente después de las comidas más grandes. Vomitar no he vomitado.'],
  [['peso','adelgaz','kilos'],
    'Sí, he perdido como cuatro kilos en el último mes. No estoy a dieta, simplemente no tengo apetito.'],
  [['antecedente','enfermedad','historia'],
    'No tengo enfermedades conocidas. Nunca me han operado. No tomo otro medicamento aparte del ibuprofeno.'],
  [['fiebre','temperatura'],
    'No, no he tenido fiebre ni escalofríos.'],
  [['alcohol','bebida'],
    'Tomo algo ocasionalmente en reuniones de trabajo, una cerveza cada dos semanas.'],
  [['familiar','familia','padre','madre'],
    'Mi padre tuvo algo en el estómago hace años, creo que lo trataron con antibióticos.'],
  [['estrés','trabajo','tensión'],
    'Sí, estoy bajo mucha presión en el trabajo. Es temporada de impuestos y los clientes me llaman a todas horas.'],
  [['cuánto','tiempo','empezó','inicio'],
    'Esto empezó hace como tres semanas. Al principio era leve y lo ignoré, pero fue empeorando.'],
  [['sangre','heces','negro'],
    'No he notado sangre. Aunque... sí he notado que a veces están un poco más oscuras de lo normal.'],
  [['alergia'],
    'No conozco ninguna alergia a medicamentos.'],
];

const PHYSICAL_EXAMS = [
  { id: 'inspeccion', label: 'Inspección abdominal', cat: 'Inspección',
    result: 'Abdomen plano, simétrico, sin cicatrices previas, sin distensión visible.' },
  { id: 'auscultacion', label: 'Auscultación abdominal', cat: 'Auscultación',
    result: 'Ruidos hidroaéreos presentes y normales en los cuatro cuadrantes.' },
  { id: 'palp_sup', label: 'Palpación superficial', cat: 'Palpación',
    result: 'Abdomen blando, sin resistencia muscular. Leve hipersensibilidad difusa.' },
  { id: 'palp_prof', label: 'Palpación profunda', cat: 'Palpación',
    result: '⚠️ Dolor a la palpación profunda en epigastrio. Sin masas palpables.' },
  { id: 'percusion', label: 'Percusión abdominal', cat: 'Percusión',
    result: 'Timpanismo en área gástrica. Sin matidez desplazable.' },
  { id: 'murphy', label: 'Signo de Murphy', cat: 'Signos específicos',
    result: 'Negativo.' },
  { id: 'blumberg', label: 'Signo de Blumberg', cat: 'Signos específicos',
    result: 'Negativo. Sin dolor de rebote.' },
  { id: 'mcburney', label: 'Punto de McBurney', cat: 'Signos específicos',
    result: 'Negativo.' },
];

const ALL_TESTS: Omit<DiagTest, 'justification'|'result'|'justified'>[] = [
  { id: 'hemograma',  name: 'Hemograma completo',          category: 'Laboratorio'   },
  { id: 'pcr',        name: 'Proteína C reactiva (PCR)',   category: 'Laboratorio'   },
  { id: 'hepatograma',name: 'Perfil hepático',             category: 'Laboratorio'   },
  { id: 'amilasa',    name: 'Amilasa y lipasa',            category: 'Laboratorio'   },
  { id: 'hpylori',    name: 'Test H. pylori (antígeno)',   category: 'Laboratorio'   },
  { id: 'coagulacion',name: 'Tiempos de coagulación',     category: 'Laboratorio'   },
  { id: 'rx_abdomen', name: 'Radiografía de abdomen',     category: 'Imagenología'  },
  { id: 'eco',        name: 'Ecografía abdominal',         category: 'Imagenología'  },
  { id: 'tac',        name: 'TAC abdomen y pelvis',        category: 'Imagenología'  },
  { id: 'evda',       name: 'Endoscopia digestiva alta',   category: 'Endoscopia'    },
];

const TEST_RESULTS: Record<string, string> = {
  hemograma:  'Hb: 11.8 g/dL · GB: 9.200/μL · Plaquetas: 285.000/μL. Leve anemia normocítica.',
  eco:        'Hígado, páncreas y vesícula sin alteraciones. Sin líquido libre.',
  tac:        'Engrosamiento leve de mucosa gástrica en antro. Sin masas.',
  evda:       '⚠️ HALLAZGO CLAVE - Úlcera péptica en antro gástrico 1.2 cm (Forrest IIc). Gastritis eritematosa difusa.',
};

/* ═══════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════ */
function uid() { return Math.random().toString(36).slice(2); }
function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
}
function getPatientReply(msg: string): string {
  const m = msg.toLowerCase();
  for (const [keys, reply] of MOCK_RESPONSES)
    if (keys.some(k => m.includes(k))) return reply;
  return 'No entiendo muy bien a qué se refiere. ¿Puede explicarme de otra manera?';
}
function wordCount(t: string) { return t.trim() ? t.trim().split(/\s+/).length : 0; }

/* ═══════════════════════════════════════════════════════════
   Top bar
   ═══════════════════════════════════════════════════════════ */
function SimTopbar({ onBack, onExit }: { onBack: () => void; onExit: () => void }) {
  return (
    <header className="sim-topbar">
      <div className="sim-tb-left">
        <img src={logoUrl} alt="Clerkship" className="sim-tb-logo" />
        <button className="sim-tb-back" onClick={onBack}>
          <ArrowLeft size={14} /> Volver al dashboard
        </button>
      </div>
      <div className="sim-tb-center">
        <span className="sim-tb-case-ico"><Stethoscope size={16} /></span>
        <span className="sim-tb-case-title">Caso: {CASE.motivo}</span>
      </div>
      <div className="sim-tb-right">
        <button className="sim-tb-exit" onClick={onExit}>
          <LogOut size={14} /> Salir del caso
        </button>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════
   Tab stepper
   ═══════════════════════════════════════════════════════════ */
const TAB_STAGES = [
  { s: 2 as Stage, label: 'Anamnesis',      Icon: MessageSquare },
  { s: 3 as Stage, label: 'Examen físico',  Icon: Stethoscope   },
  { s: 4 as Stage, label: 'Paraclínicos',   Icon: FlaskConical  },
];

function SimTabs({ stage, progress }: { stage: Stage; progress: Record<number, number> }) {
  return (
    <div className="sim-tabs-bar">
      {TAB_STAGES.map(({ s, label }) => {
        const active = stage === s;
        const done   = stage > s;
        const pct    = progress[s] ?? 0;
        return (
          <div key={s} className={`sim-tab${active ? ' sim-tab-active' : done ? ' sim-tab-done' : ''}`}>
            <span className="sim-tab-label">
              {label}
              {(active || done) && (
                <span className="sim-tab-pct"> {pct}%</span>
              )}
            </span>
            <div className="sim-tab-track">
              <div className="sim-tab-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Historia Clínica panel (right column)
   ═══════════════════════════════════════════════════════════ */
function HistoriaClinica({ messages, examsDone, testsDone }: {
  messages: ChatMsg[];
  examsDone: string[];
  testsDone: string[];
}) {
  const student = messages.filter(m => m.role === 'student').map(m => m.text.toLowerCase());
  const has = (...kw: string[]) => student.some(m => kw.some(k => m.includes(k)));

  const sec1Done = messages.length >= 1;
  const sec2Done = has('antecedente','alergia','medicamento','operado','cirug');
  const sec3Done = has('dolor','duele','cuánto','empezó','irradia','caracte','empeora');
  const sec4Done = has('náusea','vómito','fiebre','peso','sangre','heces');

  return (
    <aside className="sim-hc-panel">
      <div className="sim-hc-header">
        <h2 className="sim-hc-title">Historia Clínica</h2>
        <button className="sim-hc-summary-btn">
          <FileText size={13} /> Ver resumen
        </button>
      </div>

      <div className="sim-hc-sections">

        {/* 1. Motivo de consulta */}
        <div className="sim-hc-section">
          <div className="sim-hc-sec-head">
            <span className="sim-hc-sec-num-title">1. Motivo de consulta</span>
            {sec1Done && <CheckCircle size={18} className="sim-hc-check" />}
          </div>
          {sec1Done && (
            <div className="sim-hc-sec-body">
              <p>Dolor abdominal de 3 semanas de evolución.</p>
            </div>
          )}
        </div>

        {/* 2. Antecedentes */}
        <div className="sim-hc-section">
          <div className="sim-hc-sec-head">
            <span className="sim-hc-sec-num-title">2. Antecedentes</span>
            {sec2Done && <CheckCircle size={18} className="sim-hc-check" />}
          </div>
          {sec2Done && (
            <ul className="sim-hc-sec-body">
              <li><strong>Personales:</strong> Niega enfermedades crónicas conocidas.</li>
              <li><strong>Quirúrgicos:</strong> Niega antecedentes quirúrgicos previos.</li>
              <li><strong>Alergias:</strong> No refiere alergias conocidas.</li>
              <li><strong>Medicamentos:</strong> Ibuprofeno frecuente (≥2 meses).</li>
            </ul>
          )}
        </div>

        {/* 3. Enfermedad actual */}
        <div className="sim-hc-section">
          <div className="sim-hc-sec-head">
            <span className="sim-hc-sec-num-title">3. Enfermedad actual</span>
            {sec3Done && <CheckCircle size={18} className="sim-hc-check" />}
          </div>
          {sec3Done && (
            <ul className="sim-hc-sec-body">
              <li><strong>Inicio:</strong> Hace 3 semanas.</li>
              <li><strong>Localización:</strong> Epigastrio.</li>
              <li><strong>Características:</strong> Urente, postprandial y nocturno.</li>
              <li><strong>Radiación:</strong> Ocasionalmente hacia espalda.</li>
              <li><strong>Factores que agravan:</strong> Comidas grasosas, ayuno prolongado.</li>
              <li><strong>Síntomas asociados:</strong> Náuseas, pérdida de peso ~4 kg.</li>
            </ul>
          )}
        </div>

        {/* 4. Revisión por sistemas */}
        <div className="sim-hc-section">
          <div className="sim-hc-sec-head">
            <span className="sim-hc-sec-num-title">4. Revisión por sistemas</span>
            {sec4Done && <CheckCircle size={18} className="sim-hc-check" />}
          </div>
          {sec4Done && (
            <ul className="sim-hc-sec-body">
              <li><strong>General:</strong> Sin fiebre. Pérdida de peso no intencional.</li>
              <li><strong>Gastrointestinal:</strong> Náuseas postprandiales. Sin vómito.</li>
              <li><strong>Genitourinario:</strong> Sin síntomas.</li>
              <li><strong>Otros:</strong> Estrés laboral significativo.</li>
            </ul>
          )}
        </div>

        {/* 5. Examen físico — only shows after stage 3 */}
        {examsDone.length > 0 && (
          <div className="sim-hc-section">
            <div className="sim-hc-sec-head">
              <span className="sim-hc-sec-num-title">5. Examen físico</span>
              <CheckCircle size={18} className="sim-hc-check" />
            </div>
            <ul className="sim-hc-sec-body">
              {examsDone.slice(0, 4).map(id => {
                const ex = PHYSICAL_EXAMS.find(e => e.id === id);
                return ex ? <li key={id}><strong>{ex.label}:</strong> {ex.result.replace('⚠️ ','')}</li> : null;
              })}
              {examsDone.length > 4 && <li>+{examsDone.length - 4} hallazgos más...</li>}
            </ul>
          </div>
        )}

        {/* 6. Paraclínicos — only shows after stage 4 */}
        {testsDone.length > 0 && (
          <div className="sim-hc-section">
            <div className="sim-hc-sec-head">
              <span className="sim-hc-sec-num-title">6. Paraclínicos</span>
              <CheckCircle size={18} className="sim-hc-check" />
            </div>
            <ul className="sim-hc-sec-body">
              {testsDone.slice(0, 3).map(id => {
                const t = ALL_TESTS.find(x => x.id === id);
                return t ? <li key={id}><strong>{t.name}:</strong> {TEST_RESULTS[id]?.slice(0,60)}...</li> : null;
              })}
              {testsDone.length > 3 && <li>+{testsDone.length - 3} exámenes más...</li>}
            </ul>
          </div>
        )}

      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stage 1 — Presentación (full width)
   ═══════════════════════════════════════════════════════════ */
function Stage1Content({ onNext }: { onNext: () => void }) {
  return (
    <div className="sim-stage1-wrap">
      <motion.div
        className="sim-stage1-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <p className="sim-stage1-eyebrow">Etapa 1 · Presentación del caso</p>
        <h2 className="sim-stage1-title">Lee la viñeta clínica</h2>
        <p className="sim-stage1-sub">
          Registra tus hipótesis iniciales antes de continuar. El sistema registra cuánto tardas y qué tan pertinentes son.
        </p>

        <div className="sim-vignette">
          <div className="sim-vignette-bar" />
          <div>
            <p className="sim-vignette-label">Viñeta clínica generada por IA</p>
            <p className="sim-vignette-text">{CASE.vignette}</p>
          </div>
        </div>

        <div className="sim-info-cards">
          {[
            { Icon: BookOpen,  label: 'Dominio',         value: 'Sistema gastrointestinal' },
            { Icon: BarChart2, label: 'Dificultad',      value: 'Moderada (Nivel 2)'       },
            { Icon: Clock,     label: 'Tiempo estimado', value: '25–35 minutos'             },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="sim-info-chip">
              <Icon size={13} />
              <span className="sim-info-chip-label">{label}:</span>
              <span className="sim-info-chip-val">{value}</span>
            </div>
          ))}
        </div>

        <button className="sim-btn-next" onClick={onNext}>
          Iniciar entrevista al paciente <ChevronRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stage 2 — Entrevista (chat)
   ═══════════════════════════════════════════════════════════ */
function Stage2Chat({
  messages, onSend, onNext,
}: {
  messages: ChatMsg[];
  onSend: (text: string) => void;
  onNext: () => void;
}) {
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || typing) return;
    setInput('');
    onSend(text);
    setTyping(true);
    setTimeout(() => setTyping(false), 1200 + Math.random() * 800);
  }, [input, typing, onSend]);

  return (
    <div className="sim-chat-col">
      {/* Agent header */}
      <div className="sim-agent-header">
        <div className="sim-agent-logo-wrap">
          <img src={logoUrl} alt="Agente" />
        </div>
        <div>
          <span className="sim-agent-name">Agente Orquestador</span>
          <span className="sim-agent-online">
            <span className="sim-agent-dot" /> en línea
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="sim-chat-messages">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            className={`sim-bubble-wrap${m.role === 'student' ? ' sim-bubble-wrap-student' : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {m.role === 'patient' && (
              <div className="sim-bubble-avatar">
                <img src={logoUrl} alt="" />
              </div>
            )}
            <div>
              <div className={`sim-bubble sim-bubble-${m.role}`}>{m.text}</div>
              <div className="sim-bubble-meta">
                {fmtTime(m.ts)}
                {m.role === 'student' && <span className="sim-bubble-check">✓</span>}
              </div>
            </div>
          </motion.div>
        ))}

        {typing && (
          <div className="sim-bubble-wrap">
            <div className="sim-bubble-avatar"><img src={logoUrl} alt="" /></div>
            <div className="sim-bubble sim-bubble-patient">
              <div className="sim-typing-dots"><span /><span /><span /></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sim-input-area">
        <div className="sim-input-row">
          <button className="sim-input-attach" tabIndex={-1}>
            <Paperclip size={16} />
          </button>
          <input
            className="sim-input-field"
            placeholder="Haz una pregunta al paciente o solicita un examen..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            disabled={typing}
          />
          <button className="sim-input-send" onClick={send} disabled={!input.trim() || typing}>
            <Send size={15} />
          </button>
        </div>
        <p className="sim-input-tip">
          Consejo: Sé claro y específico en tus preguntas para obtener información relevante.
        </p>
      </div>

      {/* Finalizar entrevista */}
      <div className="sim-chat-footer">
        <button className="sim-btn-next sim-btn-next-sm" onClick={onNext}>
          Finalizar entrevista <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stage 3 — Examen físico
   ═══════════════════════════════════════════════════════════ */
function Stage3Exam({ onDone, onNext }: { onDone: (id: string) => void; onNext: () => void }) {
  const [done, setDone] = useState<Record<string, PhysicalFinding>>({});
  const cats = [...new Set(PHYSICAL_EXAMS.map(e => e.cat))];

  const markDone = (exam: typeof PHYSICAL_EXAMS[0]) => {
    setDone(d => ({ ...d, [exam.id]: { id: exam.id, result: exam.result } }));
    onDone(exam.id);
  };

  return (
    <div className="sim-chat-col sim-exam-col">
      <div className="sim-agent-header">
        <div className="sim-agent-logo-wrap"><img src={logoUrl} alt="Agente" /></div>
        <div>
          <span className="sim-agent-name">Agente Orquestador</span>
          <span className="sim-agent-online"><span className="sim-agent-dot" /> en línea</span>
        </div>
      </div>

      <div className="sim-chat-messages">
        <div className="sim-stage-header">
          <p className="sim-stage-eyebrow">Etapa 3</p>
          <h2 className="sim-stage-title">Examen físico</h2>
          <p className="sim-stage-desc">Solicita los hallazgos del examen físico.</p>
        </div>
        <div className="sim-exam-grid-area">
          {cats.map(cat => (
            <div key={cat} className="sim-exam-cat">
              <p className="sim-exam-cat-label">{cat}</p>
              <div className="sim-exam-btn-row">
                {PHYSICAL_EXAMS.filter(e => e.cat === cat).map(exam => (
                  <button
                    key={exam.id}
                    className={`sim-exam-btn${done[exam.id] ? ' sim-exam-btn-done' : ''}`}
                    onClick={() => markDone(exam)}
                  >
                    {done[exam.id] && <CheckCircle size={12} />}
                    {exam.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {Object.values(done).length > 0 && (
            <motion.div className="sim-exam-results"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <p className="sim-exam-results-title">Hallazgos registrados</p>
              {Object.values(done).map(f => {
                const ex = PHYSICAL_EXAMS.find(e => e.id === f.id)!;
                return (
                  <div key={f.id} className="sim-exam-result-row">
                    <span className="sim-exam-result-name">{ex.label}</span>
                    <span className="sim-exam-result-val">{f.result}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="sim-chat-footer">
        <button className="sim-btn-next sim-btn-next-sm" onClick={onNext}>
          Solicitar pruebas diagnósticas <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stage 4 — Pruebas diagnósticas
   ═══════════════════════════════════════════════════════════ */
function Stage4Tests({ onDone, onNext }: { onDone: (id: string) => void; onNext: () => void }) {
  const [tests, setTests]     = useState<Record<string, DiagTest>>({});
  const [openJust, setOpenJust] = useState<string | null>(null);
  const [draftJust, setDraftJust] = useState('');
  const cats = [...new Set(ALL_TESTS.map(t => t.category))];

  const select = (id: string) => {
    if (tests[id]) return;
    const meta = ALL_TESTS.find(t => t.id === id)!;
    setTests(prev => ({ ...prev, [id]: { ...meta, justification: '', result: null, justified: false } }));
    setOpenJust(id); setDraftJust('');
  };

  const justify = (id: string) => {
    if (!draftJust.trim()) return;
    setTests(prev => ({
      ...prev,
      [id]: { ...prev[id], justification: draftJust, result: TEST_RESULTS[id] ?? 'Resultado pendiente.', justified: true },
    }));
    onDone(id);
    setOpenJust(null); setDraftJust('');
  };

  const justified = Object.values(tests).filter(t => t.justified);

  return (
    <div className="sim-chat-col sim-exam-col">
      <div className="sim-agent-header">
        <div className="sim-agent-logo-wrap"><img src={logoUrl} alt="Agente" /></div>
        <div>
          <span className="sim-agent-name">Agente Orquestador</span>
          <span className="sim-agent-online"><span className="sim-agent-dot" /> en línea</span>
        </div>
      </div>

      <div className="sim-chat-messages">
        <div className="sim-stage-header">
          <p className="sim-stage-eyebrow">Etapa 4</p>
          <h2 className="sim-stage-title">Pruebas diagnósticas</h2>
          <p className="sim-stage-desc">Selecciona y justifica cada examen antes de ver el resultado.</p>
        </div>

        <div className="sim-test-section">
          {cats.map(cat => (
            <div key={cat}>
              <p className="sim-test-cat-label">{cat}</p>
              <div className="sim-test-grid">
                {ALL_TESTS.filter(t => t.category === cat).map(t => {
                  const sel = !!tests[t.id], done = tests[t.id]?.justified;
                  return (
                    <button key={t.id}
                      className={`sim-test-btn${sel ? (done ? ' sim-test-done' : ' sim-test-pending') : ''}`}
                      onClick={() => select(t.id)} disabled={sel}
                    >
                      {done && <CheckCircle size={11} />} {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {justified.length > 0 && (
          <div className="sim-test-results">
            <p className="sim-exam-results-title">Resultados ({justified.length})</p>
            {justified.map(t => (
              <div key={t.id} className="sim-test-result-card">
                <div className="sim-test-result-head">
                  <span className="sim-test-result-name">{t.name}</span>
                </div>
                <p className="sim-test-result-val">{t.result}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Justification modal */}
      <AnimatePresence>
        {openJust && (
          <motion.div className="sim-just-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="sim-just-modal"
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }} transition={{ duration: 0.2 }}>
              <p className="sim-just-title">Justificación requerida</p>
              <p className="sim-just-exam">{ALL_TESTS.find(t => t.id === openJust)?.name}</p>
              <textarea className="sim-just-ta"
                placeholder="¿Por qué solicitas este examen? ¿Qué esperas encontrar?"
                value={draftJust} onChange={e => setDraftJust(e.target.value)}
                rows={4} autoFocus />
              <div className="sim-just-actions">
                <button className="sim-btn-ghost-sm"
                  onClick={() => { setOpenJust(null); setTests(p => { const n = { ...p }; delete n[openJust]; return n; }); }}>
                  Cancelar
                </button>
                <button className="sim-btn-next-sm2"
                  disabled={!draftJust.trim()} onClick={() => justify(openJust)}>
                  Confirmar y ver resultado
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sim-chat-footer">
        <button className="sim-btn-next sim-btn-next-sm" onClick={onNext}>
          Ir al diagnóstico diferencial <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stage 5 — Diferencial (hypotheses)
   ═══════════════════════════════════════════════════════════ */
function Stage5Content({ hypotheses, onUpdate, onNext }: {
  hypotheses: Hypothesis[]; onUpdate: (id: string, p: Partial<Hypothesis>) => void; onNext: () => void;
}) {
  const active = hypotheses.filter(h => h.status === 'active');
  return (
    <div className="sim-stage-body">
      <div className="sim-stage-header">
        <p className="sim-stage-eyebrow">Etapa 5 · Razonamiento bayesiano</p>
        <h2 className="sim-stage-title">Diagnóstico diferencial</h2>
        <p className="sim-stage-desc">Ordena tus hipótesis de mayor a menor probabilidad y argumenta cada una.</p>
      </div>
      {active.length === 0
        ? <div className="sim-empty-state"><p>No tienes hipótesis activas.</p></div>
        : <div className="sim-diff-list">
            {active.map((h, i) => (
              <div key={h.id} className="sim-diff-card">
                <div className="sim-diff-head">
                  <span className="sim-diff-rank">#{i + 1}</span>
                  <span className="sim-diff-name">{h.text}</span>
                  <div className="sim-diff-prob-wrap">
                    <input type="range" min={0} max={100} step={5}
                      value={h.probability}
                      onChange={e => onUpdate(h.id, { probability: Number(e.target.value) })}
                      className="sim-diff-slider" />
                    <span className="sim-diff-pct">{h.probability}%</span>
                  </div>
                </div>
                <textarea className="sim-diff-arg"
                  placeholder="Argumenta esta hipótesis con hallazgos del caso…"
                  value={h.argument} rows={3}
                  onChange={e => onUpdate(h.id, { argument: e.target.value })} />
              </div>
            ))}
          </div>
      }
      <div className="sim-stage-footer">
        <button className="sim-btn-next" onClick={onNext} disabled={active.length === 0}>
          Emitir diagnóstico final <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stage 6 — Diagnóstico final
   ═══════════════════════════════════════════════════════════ */
function Stage6Content({ onSubmit }: { onSubmit: () => void }) {
  const [dx, setDx] = useState('');
  const [arg, setArg] = useState('');
  const wc = wordCount(arg);
  const ready = dx.trim().length > 0 && wc >= 100;

  return (
    <div className="sim-stage-body">
      <div className="sim-stage-header">
        <p className="sim-stage-eyebrow">Etapa 6 · Final</p>
        <h2 className="sim-stage-title">Diagnóstico final y argumentación</h2>
        <p className="sim-stage-desc">Emite tu diagnóstico principal (mínimo 100 palabras de argumentación).</p>
      </div>
      <div className="sim-final-form">
        <div className="sim-final-field">
          <label className="sim-final-label">Diagnóstico principal</label>
          <input className="sim-final-input"
            placeholder="Ej: Úlcera péptica secundaria al uso de AINEs"
            value={dx} onChange={e => setDx(e.target.value)} />
        </div>
        <div className="sim-final-field">
          <div className="sim-final-label-row">
            <label className="sim-final-label">Razonamiento clínico</label>
            <span className={`sim-wc${wc >= 100 ? ' sim-wc-ok' : ''}`}>{wc} / 100 palabras</span>
          </div>
          <textarea className="sim-final-ta"
            placeholder="Describe tu razonamiento completo…"
            value={arg} rows={10} onChange={e => setArg(e.target.value)} />
        </div>
      </div>
      <div className="sim-stage-footer">
        {!ready && (
          <p className="sim-footer-hint">
            {!dx.trim() ? 'Escribe tu diagnóstico principal.' : `Faltan ${100 - wc} palabras.`}
          </p>
        )}
        <button className="sim-btn-submit" disabled={!ready} onClick={onSubmit}>
          <CheckCircle size={16} /> Enviar y recibir retroalimentación
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Hypotheses side panel (stages 2-4)
   ═══════════════════════════════════════════════════════════ */
function HypPanel({ hypotheses, onAdd, onRemove, onUpdate, stage }: {
  hypotheses: Hypothesis[]; onAdd: (t: string) => void;
  onRemove: (id: string) => void; onUpdate: (id: string, p: Partial<Hypothesis>) => void;
  stage: Stage;
}) {
  const [draft, setDraft] = useState('');
  const readOnly = stage >= 5;
  return (
    <aside className="sim-right">
      <p className="sim-right-title">Hipótesis activas</p>
      <div className="sim-hyp-list">
        <AnimatePresence>
          {hypotheses.map((h, i) => (
            <motion.div key={h.id}
              className={`sim-hyp-item${h.status === 'discarded' ? ' sim-hyp-discarded' : ''}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="sim-hyp-head">
                <span className="sim-hyp-num">{i + 1}</span>
                <span className="sim-hyp-text">{h.text}</span>
                {!readOnly && (
                  <button className="sim-hyp-del" onClick={() => onRemove(h.id)}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              {!readOnly && stage >= 2 && (
                <button className="sim-hyp-toggle"
                  onClick={() => onUpdate(h.id, { status: h.status === 'discarded' ? 'active' : 'discarded' })}>
                  {h.status === 'discarded' ? 'Reactivar' : 'Descartar hipótesis'}
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {hypotheses.length === 0 && <p className="sim-hyp-empty">Aún no has registrado hipótesis.</p>}
      </div>

      {!readOnly && (
        <div className="sim-hyp-add">
          <input className="sim-hyp-input" placeholder="Nueva hipótesis diagnóstica…"
            value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && draft.trim()) { onAdd(draft.trim()); setDraft(''); } }} />
          <button className="sim-hyp-add-btn" disabled={!draft.trim()}
            onClick={() => { onAdd(draft.trim()); setDraft(''); }}>
            <Plus size={14} />
          </button>
        </div>
      )}

      {stage >= 4 && (
        <div className="sim-evidence-box">
          <p className="sim-evidence-title"><Info size={12} /> Evidencia recopilada</p>
          <ul className="sim-evidence-list">
            <li>Dolor epigástrico postprandial y nocturno</li>
            <li>Uso de AINEs durante ≥2 meses</li>
            <li>Pérdida de peso 4 kg / 1 mes</li>
            <li>Posible antecedente familiar gástrico</li>
          </ul>
        </div>
      )}
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main
   ═══════════════════════════════════════════════════════════ */
export default function SimulacionPage() {
  const navigate = useNavigate();
  const [stage, setStage]         = useState<Stage>(1);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);
  const [messages, setMessages]   = useState<ChatMsg[]>([
    { role: 'patient',
      text: 'Buenos días, doctor. Vengo porque llevo unas semanas con un dolor en el estómago que no se me quita.',
      ts: Date.now() },
  ]);
  const [examsDone, setExamsDone] = useState<string[]>([]);
  const [testsDone, setTestsDone] = useState<string[]>([]);

  const addHyp    = useCallback((text: string) =>
    setHypotheses(h => [...h, { id: uid(), text, probability: 50, argument: '', status: 'active' }]), []);
  const removeHyp = useCallback((id: string) =>
    setHypotheses(h => h.filter(x => x.id !== id)), []);
  const updateHyp = useCallback((id: string, patch: Partial<Hypothesis>) =>
    setHypotheses(h => h.map(x => x.id === id ? { ...x, ...patch } : x)), []);
  const next      = useCallback(() => setStage(s => Math.min(s + 1, 6) as Stage), []);

  const handleSend = useCallback((text: string) => {
    const ts = Date.now();
    setMessages(m => [...m, { role: 'student', text, ts }]);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'patient', text: getPatientReply(text), ts: Date.now() }]);
    }, 1200 + Math.random() * 800);
  }, []);

  // Progress per tab
  const studentMsgs = messages.filter(m => m.role === 'student').length;
  const anamPct  = Math.min(100, Math.round(studentMsgs * 12.5));
  const examPct  = Math.min(100, Math.round((examsDone.length / PHYSICAL_EXAMS.length) * 100));
  const testsPct = Math.min(100, Math.round((testsDone.length / ALL_TESTS.length) * 100));
  const progress = { 2: anamPct, 3: examPct, 4: testsPct };

  const showTabs = stage >= 2 && stage <= 4;
  const show2col = stage >= 2 && stage <= 4;

  return (
    <div className="sim-root">

      {/* Top bar */}
      <SimTopbar onBack={() => navigate(-1)} onExit={() => navigate(-1)} />

      {/* Tab stepper */}
      {showTabs && <SimTabs stage={stage} progress={progress} />}

      {/* Stage 1 — Presentación */}
      {stage === 1 && <Stage1Content onNext={next} />}

      {/* Stages 2-4 — Two column */}
      {show2col && (
        <div className="sim-2col">
          {stage === 2 && (
            <Stage2Chat messages={messages} onSend={handleSend} onNext={next} />
          )}
          {stage === 3 && (
            <Stage3Exam onDone={id => setExamsDone(p => [...p, id])} onNext={next} />
          )}
          {stage === 4 && (
            <Stage4Tests onDone={id => setTestsDone(p => [...p, id])} onNext={next} />
          )}

          {/* Right column: Historia Clínica for stage 2, HypPanel for 3-4 */}
          {stage === 2
            ? <HistoriaClinica messages={messages} examsDone={examsDone} testsDone={testsDone} />
            : <HypPanel hypotheses={hypotheses} onAdd={addHyp} onRemove={removeHyp}
                        onUpdate={updateHyp} stage={stage} />
          }
        </div>
      )}

      {/* Stages 5-6 — Full-width forms */}
      {(stage === 5 || stage === 6) && (
        <div className="sim-body-full">
          <AnimatePresence mode="wait">
            <motion.div key={stage}
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.28 }}>
              {stage === 5 && (
                <Stage5Content hypotheses={hypotheses} onUpdate={updateHyp} onNext={next} />
              )}
              {stage === 6 && (
                <Stage6Content onSubmit={() => navigate('/dashboard')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
