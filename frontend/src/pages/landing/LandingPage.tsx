import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, PenTool, Code, CheckCircle, Settings,
  BrainCircuit, Database, FileText, Network, Sparkles, Layout, Cloud
} from 'lucide-react';
import logoUrl from '../../assets/Logo Clerkship.svg';
import InteractiveBackgroundCanvas from '../../components/shared/InteractiveBackgroundCanvas';

/* ══════════════════════════════════════════════════════
   Data
══════════════════════════════════════════════════════ */
const STATS = [
  { n: '100%',        label: 'Formativo' },
  { n: 'Fine-Tuning', label: 'Motor de IA' },
  { n: '3',           label: 'Agentes Especializados' },
  { n: 'GI',          label: 'Dominio Clínico' },
];

const DEVS = [
  { initials: 'ZQ', name: 'Zabdiel Julian Quintero Monroy', seed: 'Felix', color: '#3B82F6',
    focus: 'Agentes de IA · Motor LLM · Prompts CoT · RAG',
    desc: 'Líder en arquitectura de IA. Diseña y optimiza los modelos de lenguaje, el motor RAG y el razonamiento Chain-of-Thought para la generación de casos clínicos.',
    skills: [
      { label: 'Agentes IA', icon: <BrainCircuit size={13} /> },
      { label: 'LLM & RAG', icon: <Database size={13} /> },
      { label: 'Prompts CoT', icon: <FileText size={13} /> },
    ]
  },
  { initials: 'JR', name: 'Juan Camilo Rojas', seed: 'Leo', color: '#EC4899',
    focus: 'Agentes de IA · Multi-Agente · CoT · Arquitectura IA',
    desc: 'Especialista en agentes inteligentes. Orquesta el flujo multi-agente, la simulación del paciente virtual y el análisis automatizado de sesgos cognitivos.',
    skills: [
      { label: 'Agentes IA', icon: <BrainCircuit size={13} /> },
      { label: 'Multi-Agente', icon: <Network size={13} /> },
      { label: 'Fine-Tuning', icon: <Sparkles size={13} /> },
    ]
  },
  { initials: 'SA', name: 'Santiago Steven Arias Estupiñan', seed: 'Aneka', color: '#10B981',
    focus: 'Frontend · React · UI/UX · Conexión del Sistema',
    desc: 'Líder de desarrollo Frontend. Diseña y construye la interfaz interactiva en React 19, los visores 3D y la conexión integral con el motor clínico.',
    skills: [
      { label: 'React', icon: <Code size={13} /> },
      { label: 'TypeScript', icon: <Layout size={13} /> },
      { label: 'UI/UX', icon: <Sparkles size={13} /> },
    ]
  },
  { initials: 'CB', name: 'Camilo Andres Bueno Rey', seed: 'Jasper', color: '#8B5CF6',
    focus: 'Backend · Node.js · API REST · Conexión del Sistema',
    desc: 'Líder de arquitectura Backend. Construye el servidor API REST en Node.js, la gestión de datos y la infraestructura de conexión entre sistemas.',
    skills: [
      { label: 'Node.js', icon: <Cloud size={13} /> },
      { label: 'API REST', icon: <Database size={13} /> },
      { label: 'Backend', icon: <Network size={13} /> },
    ]
  },
];

/* ══════════════════════════════════════════════════════
   Metodología Timeline Data
══════════════════════════════════════════════════════ */
const MET_STEPS = [
  { id: 0, title: 'Planear',     Icon: ClipboardList, desc: 'Historias de usuario, Criterios de aceptación, Plan de iteración' },
  { id: 1, title: 'Diseñar',     Icon: PenTool,       desc: 'Arquitectura técnica, Prototipos de sprint, Revisión de diseño' },
  { id: 2, title: 'Desarrollar', Icon: Code,          desc: 'Implementación iterativa, Integración continua' },
  { id: 3, title: 'Verificar',   Icon: CheckCircle,   desc: 'Pruebas de aceptación, Revisión académica' },
  { id: 4, title: 'Gestionar',   Icon: Settings,      desc: 'Dirección del sprint, Longitud de iteración' },
];

/* ══════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [activeMetStep, setActiveMetStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveMetStep((prev) => (prev + 1) % MET_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handleMetStepClick = (index: number) => {
    setActiveMetStep(index);
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 7000);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="lp-root"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <InteractiveBackgroundCanvas />
      {/* ── Navbar ── */}
      <nav className="lp-nav">
        <div className="lp-nav-left">
          <button className="lp-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logoUrl} alt="Clerkship" className="lp-logo-img" />
            Clerkship
          </button>
        </div>

        <div className="lp-navlinks-wrap">
          <div className="lp-navlinks">
            <button className="lp-navlink lp-navlink-on" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Inicio</button>
            <button className="lp-navlink" onClick={() => scrollTo('tecnologia')}>Casos clínicos</button>
            <a href="/proyecto" className="lp-navlink">Cómo funciona</a>
          </div>
          <button className="lp-menu-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </svg>
          </button>
        </div>

        <div className="lp-nav-actions">
          <div className="lp-lang-toggle">
            <span className="lp-lang-on">ES</span>
            <div className="lp-lang-switch"></div>
          </div>
          <a href="/login" className="lp-btn-outline">Ingresar</a>
          <a href="/register" className="lp-btn-solid">Registrarse</a>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════
          Hero
      ══════════════════════════════════════════════ */}
      <section className="lp-hero-new">
        
        {/* LEFT COLUMN */}
        <div className="lp-hero-new-left">
          
          <div className="lp-hero-top-text">
            <span className="lp-hero-inline-pill"></span>
            PROTOTIPO ACADÉMICO DE ENTRENAMIENTO EN RAZONAMIENTO CLÍNICO
            UNAB · FOSCAL FLORIDA
            <svg className="lp-hero-star-dec" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="currentColor"/>
            </svg>
          </div>

          <h1 className="lp-hero-giant-title">
            Razonamiento<br/>
            Clínico Entrenado<br/>
            con Inteligencia<br/>
            Artificial
          </h1>

          <div className="lp-hero-bottom-actions">
            <button className="lp-btn-action" onClick={() => scrollTo('tecnologia')}>
              <span className="lp-btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              </span>
              Iniciar Caso Clínico
            </button>
            <a href="/proyecto" className="lp-btn-action">
              <span className="lp-btn-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>
              </span>
              Conocer el Proyecto
            </a>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lp-hero-new-right">
          <div className="lp-hero-canvas">
            
            <button className="lp-top-right-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
            </button>

            <div className="lp-float-pill lp-float-search">
               <div className="lp-float-circle"></div>
               <div className="lp-float-line"></div>
            </div>

            <div className="lp-float-card lp-ortho-card">
              <div className="lp-ortho-top">
                <div className="lp-ortho-icon"></div>
                <div className="lp-ortho-text">
                  <span className="lp-ortho-title">Gastroenterología</span>
                  <div className="lp-ortho-docs">
                    <div className="lp-docs-avs">
                      <div className="lp-doc-av"></div>
                      <div className="lp-doc-av"></div>
                      <div className="lp-doc-av"></div>
                    </div>
                    <span className="lp-docs-count">Sistema gastrointestinal</span>
                  </div>
                </div>
                <div className="lp-ortho-consult">Iniciar</div>
              </div>
              <div className="lp-ortho-bottom">
                <span className="lp-ortho-time">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Anamnesis · EF · Paraclínicos
                </span>
                <span className="lp-ortho-days">Caso interactivo</span>
              </div>
            </div>

            <div className="lp-float-pill lp-float-eye">
               <div className="lp-float-circle-small"></div>
               <span>Diagnóstico Diferencial</span>
            </div>

            <div className="lp-float-card lp-plan-card">
              <div className="lp-plan-img"></div>
              <p className="lp-plan-text">Aprende con casos clínicos diseñados por agentes especializados y retroalimentación experta.</p>
              <div className="lp-plan-divider"></div>
              <div className="lp-plan-dr">
                <span className="lp-dr-name">Agente Validador-Pedagogo</span>
                <span className="lp-dr-spec">Retroalimentación formativa</span>
              </div>
            </div>


            <div className="lp-filter-extension">
              <button className="lp-filter-btn">Dx Diferencial</button>
              <button className="lp-filter-btn">Plan de Manejo</button>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Stats strip
      ══════════════════════════════════════════════ */}
      <div className="lp-stats">
        {STATS.map((s, i) => (
          <motion.div
            key={s.n}
            className="lp-stat-item"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.07, duration: 0.32 }}
          >
            <span className="lp-stat-n">{s.n}</span>
            <span className="lp-stat-l">{s.label}</span>
          </motion.div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════
          Sobre el proyecto (Image Mockup Layout)
      ══════════════════════════════════════════════ */}
      <div className="lp-about-block">
        <div className="lp-ab-container">
          
          {/* Top Row: Quote Only */}
          <div className="lp-ab-top">
            <div className="lp-ab-quote-wrap">
              <span className="lp-ab-badge">NUEVO · MOTOR AGÉNTICO v1</span>
              <p className="lp-ab-quote">
                "Clerkship convierte cada caso clínico en una oportunidad de aprendizaje activo. Tres agentes de IA especializados orquestan la simulación, resuelven hipótesis y generan retroalimentación formativa basada en el razonamiento real del estudiante."
              </p>
            </div>
          </div>

          {/* Middle Row: 3 Stats */}
          <div className="lp-ab-stats">
            {/* Stat 1 */}
            <div className="lp-ab-stat-item">
              <div className="lp-ab-stat-icon">
                <div className="lp-ab-lime-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                </div>
              </div>
              <div className="lp-ab-stat-text">
                <span className="lp-ab-stat-val">MOTOR AGÉNTICO</span>
                <span className="lp-ab-stat-label">Orquestador · Resolvedor · Pedagogo</span>
                <button className="lp-ab-link" onClick={() => scrollTo('tecnologia')}>Ver arquitectura</button>
              </div>
            </div>
            
            {/* Stat 2 */}
            <div className="lp-ab-stat-item">
              <div className="lp-ab-stat-icon">
                <div className="lp-ab-lime-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </div>
              </div>
              <div className="lp-ab-stat-text">
                <span className="lp-ab-stat-val">RETROALIMENTACIÓN FORMATIVA</span>
                <span className="lp-ab-stat-label">Detecta sesgos cognitivos y vacíos diagnósticos</span>
                <button className="lp-ab-link" onClick={() => scrollTo('tecnologia')}>Ver ejemplo</button>
              </div>
            </div>
            {/* Stat 3 */}
            <div className="lp-ab-stat-item">
              <div className="lp-ab-stat-icon">
                <div className="lp-ab-lime-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                </div>
              </div>
              <div className="lp-ab-stat-text">
                <span className="lp-ab-stat-val">DESPLIEGUE PROPIO</span>
                <span className="lp-ab-stat-label">React · FastAPI · LangGraph</span>
                <button className="lp-ab-link" onClick={() => scrollTo('tecnologia')}>Ver stack</button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Logos */}
        <div className="lp-ab-logos">
          <p className="lp-ab-logos-header">CONSTRUIDO SOBRE TECNOLOGÍA ABIERTA</p>
          <div className="lp-ab-logos-row">
            <div className="lp-ab-logo-box"><img src="/apps/huggingface.svg" alt="HuggingFace" className="lp-ab-logo-img" /></div>
            <div className="lp-ab-logo-box"><img src="/apps/langgraph.svg"   alt="LangGraph"   className="lp-ab-logo-img" /></div>
            <div className="lp-ab-logo-box"><img src="/apps/fastapi.svg"     alt="FastAPI"     className="lp-ab-logo-img" /></div>
            <div className="lp-ab-logo-box"><img src="/apps/pytorch.svg"     alt="PyTorch"     className="lp-ab-logo-img" /></div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          Metodología
      ══════════════════════════════════════════════ */}
      <section className="lp-met-wave-section" id="metodologia">
        {/* Top Wave Transition */}
        <div className="lp-met-wave-top">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path fill="rgba(255, 255, 255, 0.75)" d="M0,40L60,48C120,56,240,72,360,74.7C480,77,600,67,720,53.3C840,40,960,21,1080,16C1200,11,1320,21,1380,26.7L1440,32L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"></path>
          </svg>
        </div>

        <div className="lp-met-inner-wrap">
          <div className="lp-sec-header lp-met-header">
            <p className="lp-sec-pretitle">Proceso de desarrollo</p>
            <h2 className="lp-sec-title">Metodología</h2>
            <p className="lp-sec-desc">
              Desarrollo ágil con sprints iterativos, revisión académica continua
              y validación con el aliado clínico en cada incremento.
            </p>
            <a href="/proyecto" className="lp-proyecto-link">
              Ver contexto del proyecto
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </a>
          </div>

          {/* Animated Timeline */}
          <div className="lp-met-timeline">
            
            {/* Background Line Wrapper */}
            <div style={{ position: 'absolute', top: '63px', left: '24px', right: '24px', height: '2px', background: '#E2E8F0', zIndex: 0 }}>
              {/* Animated Progress Line */}
              <motion.div 
                style={{ position: 'absolute', top: '0', left: '0', bottom: '0', zIndex: 1, background: '#1976D2' }}
                animate={{ width: `${(activeMetStep / (MET_STEPS.length - 1)) * 100}%` }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            </div>

            {MET_STEPS.map((step, index) => {
              const isActive = activeMetStep === index;
              const isPast = activeMetStep >= index;

              return (
                <div 
                  key={step.id} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    position: 'relative',
                    zIndex: 2,
                    width: '120px'
                  }}
                >
                  {/* Node Circle */}
                  <motion.div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isActive ? '#1976D2' : (isPast ? '#0D47A1' : '#FFFFFF'),
                      color: isActive || isPast ? '#FFFFFF' : '#94A3B8',
                      cursor: 'pointer',
                      border: isPast ? `2px solid #0D47A1` : `2px solid #CFD8DC`,
                      boxShadow: isActive ? '0 0 0 8px rgba(25, 118, 210, 0.15)' : 'none'
                    }}
                    animate={{
                      scale: isActive ? 1.15 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={() => handleMetStepClick(index)}
                  >
                    <step.Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>

                  {/* Node Label */}
                  <div style={{ marginTop: '16px', fontWeight: isActive ? 700 : 600, color: isActive ? '#0D47A1' : '#78909C', fontSize: '0.85rem', transition: 'all 0.3s' }}>
                    {step.title}
                  </div>

                  {/* Popover Card */}
                  <div style={{ 
                    position: 'absolute', 
                    top: '100px', 
                    left: '50%', 
                    transform: index === 0 ? 'translateX(0)' : index === MET_STEPS.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)', 
                    width: '280px',
                    display: 'flex', 
                    justifyContent: index === 0 ? 'flex-start' : index === MET_STEPS.length - 1 ? 'flex-end' : 'center',
                    pointerEvents: isActive ? 'auto' : 'none',
                    marginLeft: index === 0 ? '-24px' : index === MET_STEPS.length - 1 ? '24px' : '0',
                  }}>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          style={{
                            background: '#FFFFFF',
                            padding: '24px',
                            borderRadius: '16px',
                            boxShadow: '0 20px 40px -10px rgba(13,71,161,0.12)',
                            width: '100%',
                            textAlign: 'left',
                            border: '1px solid #E3F2FD',
                            position: 'relative'
                          }}
                        >
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0D47A1', marginBottom: '8px' }}>
                            {step.title}
                          </h3>
                          <p style={{ fontSize: '0.85rem', color: '#455A64', lineHeight: 1.6, margin: 0 }}>
                            {step.desc}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Wave Transition */}
        <div className="lp-met-wave-bottom">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path fill="rgba(255, 255, 255, 0.75)" d="M0,64L60,69.3C120,75,240,85,360,80C480,75,600,53,720,48C840,43,960,53,1080,64C1200,75,1320,85,1380,90.7L1440,96L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"></path>
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Tecnología
      ══════════════════════════════════════════════ */}
      <section className="lp-tec-section" id="tecnologia">
        {/* Header row */}
        <div className="lp-tec-header-img">
          <h2 className="lp-tec-main-title-img">
            Explora nuestra arquitectura<br />& únete a la experiencia
          </h2>
          <p className="lp-tec-main-desc-img">
            CLERKSHIP COMBINA LLM, RAG Y CHAIN-OF-THOUGHT PARA PRODUCIR
            SIMULACIONES CLÍNICAS PRECISAS Y RETROALIMENTACIÓN FORMATIVA
            AUTOMATIZADA.
          </p>
        </div>

        {/* 3 Columns */}
        <div className="lp-tec-3cols">
          {/* Col 1 */}
          <motion.div className="lp-tec-col-1" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} viewport={{ once: true }}>
            <div className="lp-tec-img-card lp-tec-tall-card">
               <div className="lp-tec-card-bottom">
                 <button className="lp-tec-pill-btn">Learn More</button>
                 <button className="lp-tec-circle-btn">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                 </button>
               </div>
            </div>
          </motion.div>
          
          {/* Col 2 */}
          <motion.div className="lp-tec-col-2" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} viewport={{ once: true }}>
            <div className="lp-tec-col-top">
               <span className="lp-tec-blog-label">BLOG/ARTICLE</span>
               <button className="lp-tec-outline-btn">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
               </button>
            </div>
            <div className="lp-tec-img-card lp-tec-short-card">
               <div className="lp-tec-card-bottom">
                 <button className="lp-tec-pill-btn">Learn More</button>
                 <button className="lp-tec-circle-btn">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                 </button>
               </div>
            </div>
          </motion.div>

          {/* Col 3 */}
          <motion.div className="lp-tec-col-3" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} viewport={{ once: true }}>
            <div className="lp-tec-col-top">
               <span className="lp-tec-blog-label">BLOG/ARTICLE</span>
               <button className="lp-tec-outline-btn">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
               </button>
            </div>
            <div className="lp-tec-img-card lp-tec-short-card">
               <div className="lp-tec-card-bottom">
                 <button className="lp-tec-pill-btn">Learn More</button>
                 <button className="lp-tec-circle-btn">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                 </button>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Equipo
      ══════════════════════════════════════════════ */}
      <section className="lp-equipo-section" id="equipo">
        <div className="lp-equipo-header">
           <div className="lp-equipo-title-area">
             <h2 className="lp-equipo-title">Las mentes detrás<br/>de Clerkship</h2>
             <p className="lp-equipo-subtitle">
               Ingenieros de sistemas construyendo el futuro de la educación médica:
               Zabdiel y Juan Camilo en los Agentes de IA, y Santiago y Camilo en Frontend, Backend y Conexión.
             </p>
           </div>
        </div>

        <div className="lp-equipo-cards">
          {DEVS.map((d, i) => (
            <motion.div 
              key={d.initials} 
              className="lp-equipo-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              style={{ borderTop: `4px solid ${d.color}` }}
            >
               <div className="lp-equipo-avatar-box" style={{ borderColor: `${d.color}40` }}>
                 <img 
                   src={`https://api.dicebear.com/7.x/notionists/svg?seed=${d.seed}&backgroundColor=${d.color.replace('#','')}`} 
                   alt={d.name} 
                   className="lp-equipo-avatar" 
                 />
               </div>

               <div className="lp-equipo-card-top">
                 <h4 className="lp-equipo-card-name">{d.name}</h4>
                 <p className="lp-equipo-card-focus" style={{ color: d.color }}>{d.focus}</p>
                 <p className="lp-equipo-card-desc">{d.desc}</p>
               </div>

               <div className="lp-equipo-skills-wrap">
                 <div className="lp-equipo-skills-divider" />
                 <div className="lp-equipo-skills">
                   {d.skills.map((s, j) => (
                     <span key={j} className="lp-equipo-skill-tag">
                       {s.icon} {s.label}
                     </span>
                   ))}
                 </div>
               </div>
               
               <div className="lp-equipo-pill">
                 <span className="lp-equipo-initials" style={{ color: d.color }}>{d.initials}</span>
               </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          Footer
      ══════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <span className="lp-footer-copy">© 2026 Clerkship · Proyecto de Grado</span>
        <div className="lp-tagline">
          <img src="/corazon_signos.svg" alt="" className="lp-tagline-ico" />
          <span>Sistema para la mejora del aprendizaje en la salud</span>
        </div>
        <a href="https://github.com/Steven08Ar/Prototipo-clinico"
          target="_blank" rel="noreferrer" className="lp-gh">
          <img src="/github.svg" alt="GitHub" />
        </a>
      </footer>

    </div>
  );
}
