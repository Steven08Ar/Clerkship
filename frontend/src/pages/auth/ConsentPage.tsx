import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Database, Shield, Scale,
  ChevronDown, CheckSquare, Square, AlertCircle, ArrowRight,
  Stethoscope, CheckCircle2
} from 'lucide-react';
import logoUrl from '../../assets/Logo Clerkship.svg';
import InteractiveBackgroundCanvas from '../../components/shared/InteractiveBackgroundCanvas';

/* ── Datos ─────────────────────────────────────────────── */
interface ConsentSection {
  Icon: React.ComponentType<{ size?: number }>;
  title: string;
  content?: string;
  list?: string[];
  alert?: string;
}

const sections: ConsentSection[] = [
  {
    Icon: FileText,
    title: 'Propósito del prototipo',
    content:
      'Clerkship es un prototipo académico desarrollado como Proyecto de Grado en Ingeniería de Sistemas. Su objetivo es explorar el uso de inteligencia artificial generativa (LLM + RAG) para apoyar el entrenamiento del razonamiento clínico-diagnóstico en estudiantes de ciencias de la salud, a través de la resolución guiada de casos clínicos simulados y la generación de retroalimentación formativa.\n\nEste sistema NO constituye una herramienta de diagnóstico médico, ni reemplaza la enseñanza clínica formal ni el criterio de un docente. Su uso está restringido al contexto académico del proyecto de investigación.',
  },
  {
    Icon: Database,
    title: 'Datos que se almacenan',
    list: [
      'Correo electrónico institucional (identificación de sesión)',
      'Fecha y hora de cada sesión de simulación completada',
      'Decisiones diagnósticas tomadas durante la simulación',
      'Hipótesis formuladas y pruebas clínicas solicitadas',
      'Puntajes obtenidos por dominio de razonamiento clínico',
      'Retroalimentación generada por el sistema de IA',
    ],
    alert:
      'No se almacenan datos clínicos reales de pacientes. Todos los casos son ficticios y generados por IA. Los datos recopilados serán usados únicamente con fines de evaluación académica del prototipo.',
  },
  {
    Icon: Shield,
    title: 'Sus derechos como titular (Ley 1581/2012)',
    content: 'De conformidad con la Ley 1581 de 2012 de Protección de Datos Personales, usted tiene derecho a:',
    list: [
      'Conocer, actualizar y rectificar sus datos personales en cualquier momento',
      'Solicitar la supresión de sus datos cuando lo estime pertinente',
      'Revocar la autorización otorgada para el tratamiento de sus datos',
      'Acceder de forma gratuita a sus datos que hayan sido objeto de tratamiento',
      'Presentar quejas ante la Superintendencia de Industria y Comercio',
    ],
  },
  {
    Icon: Scale,
    title: 'Marco normativo aplicable',
    content:
      '• Ley 1581 de 2012 — Protección de datos personales en Colombia\n• Decreto 1377 de 2013 — Consentimiento informado para tratamiento de datos\n• Resolución 8430 de 1993 del Min. Salud — Investigación sin riesgo (sin datos clínicos reales)\n• Política de propiedad intelectual de la institución educativa participante en el proyecto',
  },
];

const LOADING_MESSAGES = [
  'Creando tu perfil clínico y espacio de trabajo...',
  'Inicializando agentes de Inteligencia Artificial (LLM + RAG)...',
  'Cargando corpus de simulación del sistema gastrointestinal...',
  'Configurando motor pedagógico de retroalimentación formativa...',
  'Optimizando tu panel de control y métricas de aprendizaje...',
  '¡Casi listo! Preparando tu primer caso clínico...'
];

/* ══════════════════════════════════════════════════════════
   ConsentPage
══════════════════════════════════════════════════════════ */
export default function ConsentPage() {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [accepted, setAccepted] = useState(false);
  const [showError, setShowError] = useState(false);

  // States for medical loading screen
  const [isPreparing, setIsPreparing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  function toggleSection(i: number) {
    setOpenIdx(prev => (prev === i ? null : i));
  }

  function handleAccept() {
    if (!accepted) { setShowError(true); return; }
    localStorage.setItem('clerkship_consent', 'accepted');
    setIsPreparing(true);

    const startTime = Date.now();
    const minDuration = 2200; // 2.2 seconds minimum to complete progress

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.floor((elapsed / minDuration) * 100), 100);
      setProgress(pct);

      const msgStep = Math.min(
        Math.floor((elapsed / minDuration) * LOADING_MESSAGES.length),
        LOADING_MESSAGES.length - 1
      );
      setMsgIdx(msgStep);

      if (elapsed >= minDuration) {
        clearInterval(interval);
        setProgress(100);
        setIsFinished(true); // Trigger "Chulo de terminado / Creado exitosamente" animation

        // After showing success checkmark animation, navigate smoothly to dashboard
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1200);
      }
    }, 80);
  }

  function handleReject() {
    localStorage.removeItem('clerkship_consent');
    navigate('/', { replace: true });
  }

  return (
    <div className="cp-shell">

      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="cp-nav">
        <button className="cp-logo" onClick={() => navigate('/')}>
          <img src={logoUrl} alt="Clerkship" />
          Clerkship
        </button>
        <span className="cp-pill">
          <FileText size={12} />
          Consentimiento informado
        </span>
      </nav>

      {/* ── Cuerpo ─────────────────────────────────────── */}
      <div className="cp-body">
        <motion.div
          className="cp-wrap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className="cp-header">
            <p className="cp-pretitle">Decreto 1377 de 2013 · Ley 1581 de 2012</p>
            <h1 className="cp-title">Autorización para tratamiento<br />de datos personales</h1>
            <p className="cp-meta">
              Lea cada sección antes de aceptar. Este documento es requerido para
              participar en el prototipo de investigación.
            </p>
          </div>

          {/* Acordeón */}
          <div className="cp-sections">
            {sections.map(({ Icon, title, content, list, alert }, i) => (
              <div key={i} className="cp-section">
                <button
                  className={`cp-sec-btn${openIdx === i ? ' open' : ''}`}
                  onClick={() => toggleSection(i)}
                  aria-expanded={openIdx === i}
                >
                  <div className="cp-sec-left">
                    <div className="cp-sec-icon">
                      <Icon size={16} />
                    </div>
                    <span className="cp-sec-label">{title}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`cp-chevron${openIdx === i ? ' open' : ''}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {openIdx === i && (
                    <motion.div
                      className="cp-sec-body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.26, ease: 'easeInOut' }}
                    >
                      <div className="cp-content">
                        {content && <p className="cp-text">{content}</p>}
                        {list && (
                          <ul className="cp-list">
                            {list.map((item, j) => (
                              <li key={j} className="cp-list-item">{item}</li>
                            ))}
                          </ul>
                        )}
                        {alert && (
                          <div className="cp-alert">
                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>{alert}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Zona de aceptación */}
          <div className="cp-accept">
            <div
              className="cp-check-row"
              onClick={() => { setAccepted(v => !v); setShowError(false); }}
              role="checkbox"
              aria-checked={accepted}
              tabIndex={0}
              onKeyDown={e => e.key === ' ' && setAccepted(v => !v)}
            >
              <span className="cp-check-icon">
                {accepted
                  ? <CheckSquare size={20} style={{ color: 'var(--ink)' }} />
                  : <Square size={20} style={{ color: showError ? '#ef4444' : 'var(--ink3)' }} />
                }
              </span>
              <span className={`cp-check-text${showError && !accepted ? ' error' : ''}`}>
                He leído y comprendido la información anterior. Autorizo el
                tratamiento de mis datos personales con los propósitos y
                condiciones descritos, conforme al Decreto 1377 de 2013 y la
                Ley 1581 de 2012.
              </span>
            </div>
            <AnimatePresence>
              {showError && !accepted && (
                <motion.p
                  className="cp-check-error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle size={12} />
                  Debes aceptar los términos para continuar.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Acciones */}
          <div className="cp-actions">
            <motion.button
              className="cp-btn-reject"
              onClick={handleReject}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              Rechazar y salir
            </motion.button>
            <motion.button
              className={`cp-btn-accept${!accepted ? ' disabled' : ''}`}
              onClick={handleAccept}
              whileHover={accepted ? { scale: 1.02 } : {}}
              whileTap={accepted ? { scale: 0.97 } : {}}
            >
              Aceptar y continuar
              <ArrowRight size={15} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* ── Overlay de Pantalla de Carga Médica Interactiva ────────────────────── */}
      <AnimatePresence>
        {isPreparing && (
          <motion.div 
            className="cp-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <InteractiveBackgroundCanvas />

            <motion.div 
              className="cp-loading-card"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {!isFinished ? (
                <>
                  {/* Pulse Medical Icon */}
                  <div className="cp-loading-icon-wrap">
                    <div className="cp-loading-ripple"></div>
                    <div className="cp-loading-ripple r2"></div>
                    <div className="cp-loading-icon">
                      <Stethoscope size={36} />
                    </div>
                  </div>

                  <h2 className="cp-loading-title">
                    Dejando todo listo para que tengas la mejor experiencia...
                  </h2>
                  <p className="cp-loading-subtitle">
                    Configurando tu entorno clínico agéntico de simulación en la UNAB.
                  </p>

                  {/* Progress Bar */}
                  <div className="cp-progress-bar-bg">
                    <motion.div 
                      className="cp-progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Changing Message */}
                  <div className="cp-loading-msg-box">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={msgIdx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="cp-loading-msg"
                      >
                        {LOADING_MESSAGES[msgIdx]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <motion.div
                  key="finished"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="cp-finished-wrap"
                >
                  <div className="cp-finished-icon-box">
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                    >
                      <CheckCircle2 size={68} className="cp-finished-check" />
                    </motion.div>
                  </div>

                  <h2 className="cp-finished-title">¡Creado exitosamente!</h2>
                  <p className="cp-finished-sub">
                    Tu espacio de simulación y agentes de IA están listos. Abriendo tu panel de control...
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
