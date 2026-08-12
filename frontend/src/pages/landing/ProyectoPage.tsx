import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoUrl from '../../assets/Clerkship.svg';
import {
  Stethoscope, Activity, Microscope,
  ShieldCheck, Database, BrainCircuit,
  Users, CheckCircle2, FlaskConical, MapPin,
  Code, Layout, Cloud, Cpu, Sparkles, User, FileText,
  Network
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   Types
══════════════════════════════════════════════════════ */
interface TitleSlide  { v:'title';   title:string; subtitle:string; }
interface TeamSlide   { v:'team';    tag:string; title:string; members:{name:string;role:string;color:string;desc:string;skills:{label:string;icon:any}[];location:string;seed:string}[] }
interface StatSlide   { v:'stat';    tag:string; title:string; body:string; stats:{n:string;label:string}[] }
interface QSlide      { v:'question';tag:string; title:string; question:string; hypothesis:string }
interface CardsSlide  { v:'cards';   tag:string; title:string; subtitle?:string; cols?:2|3; cards:{title:string;body:string;accent?:boolean;icon?:any}[] }
interface ObjSlide    { v:'obj';     tag:string; title:string; general:string; specifics:string[] }
interface CmpSlide    { v:'compare'; tag:string; title:string; subtitle:string; tools:{name:string;ours:boolean;checks:{ok:boolean;text:string}[]}[] }
interface PhaseSlide  { v:'phases';  tag:string; title:string; subtitle:string; phases:{num:string;title:string;body:string;badge?:string;icon?:any}[] }
interface BudgetSlide { v:'budget';  tag:string; title:string; subtitle:string; cats:{name:string;items:string[];accent?:boolean;icon?:any}[] }
interface RefSlide    { v:'refs';    tag:string; title:string; refs:{authors:string;title:string;where:string}[] }
type Slide = TitleSlide|TeamSlide|StatSlide|QSlide|CardsSlide|ObjSlide|CmpSlide|PhaseSlide|BudgetSlide|RefSlide;

/* ══════════════════════════════════════════════════════
   Slide data
══════════════════════════════════════════════════════ */
const SLIDES: Slide[] = [

  /* 0 — Portada */
  {
    v:'title',
    title:'Prototipo basado en inteligencia artificial para entrenar y evaluar el razonamiento clínico en la UNAB',
    subtitle:'Universidad Autónoma de Bucaramanga · 2026',
  },

  /* 1 — Equipo */
  {
    v:'team', tag:'EQUIPO DE DESARROLLO',
    title:'Las mentes detrás del proyecto',
    members:[
      {
        name:'Zabdiel Julian Quintero Monroy',
        role:'Especialista en Agentes de IA',
        color:'#3B82F6',
        seed:'Felix',
        desc:'Mente detrás de los agentes de IA, arquitecturas multi-agente, generación RAG y motor de razonamiento Chain-of-Thought.',
        skills:[
          { label:'Agentes IA', icon: <BrainCircuit size={14}/> },
          { label:'LLM & RAG', icon: <Database size={14}/> },
          { label:'Prompts CoT', icon: <FileText size={14}/> },
        ],
        location:'Colombia | AI Lead Architect',
      },
      {
        name:'Juan Camilo Rojas',
        role:'Especialista en Agentes de IA',
        color:'#EC4899',
        seed:'Leo',
        desc:'Mente detrás de la orquestación de agentes de IA, simulación de pacientes virtuales y análisis de razonamiento.',
        skills:[
          { label:'Agentes IA', icon: <BrainCircuit size={14}/> },
          { label:'Multi-Agente', icon: <Network size={14}/> },
          { label:'Fine-Tuning', icon: <Sparkles size={14}/> },
        ],
        location:'Colombia | AI Agent Specialist',
      },
      {
        name:'Santiago Steven Arias Estupiñan',
        role:'Desarrollador Frontend & Conexión',
        color:'#10B981',
        seed:'Aneka',
        desc:'Mente detrás de la interfaz de usuario, diseño interactivo, experiencia visual y conexión directa del sistema.',
        skills:[
          { label:'React', icon: <Code size={14}/> },
          { label:'TypeScript', icon: <Layout size={14}/> },
          { label:'UI/UX', icon: <Sparkles size={14}/> },
        ],
        location:'Colombia | Frontend Engineer',
      },
      {
        name:'Camilo Andres Bueno Rey',
        role:'Desarrollador Backend & Conexión',
        color:'#8B5CF6',
        seed:'Jasper',
        desc:'Mente detrás del servidor backend, consumo de APIs, servicios REST y la arquitectura de conexión de componentes.',
        skills:[
          { label:'Node.js', icon: <Cloud size={14}/> },
          { label:'API REST', icon: <Database size={14}/> },
          { label:'Backend', icon: <Network size={14}/> },
        ],
        location:'Colombia | Backend & Integration',
      }
    ]
  },

  /* 2 — Planteamiento del problema */
  {
    v:'stat', tag:'PLANTEAMIENTO DEL PROBLEMA',
    title:'Los estudiantes no reciben retroalimentación sobre cómo razonan',
    body:'Tres causas directas se refuerzan entre sí: el currículo dedica apenas 6,4 horas al razonamiento clínico en toda la carrera; los simuladores existentes evalúan solo el diagnóstico final, no el proceso cognitivo; y la Ley 100 de 1993 convirtió los hospitales universitarios en centros asistenciales, reduciendo el tiempo para enseñar y retroalimentar. En Colombia, estudios en dos centros de Bogotá confirman que el aprendizaje del razonamiento clínico es percibido como predominantemente implícito, sin proceso formal de enseñanza en ninguna etapa.',
    stats:[
      { n:'795k', label:'Muertes o discapacidades al año por errores diagnósticos prevenibles (EE.UU.)' },
      { n:'75 %', label:'De esos errores tienen factores cognitivos identificables' },
      { n:'6,4 h', label:'Dedicadas al razonamiento clínico en toda la carrera médica' },
    ],
  },

  /* 3 — Pregunta e hipótesis */
  {
    v:'question', tag:'PREGUNTA E HIPÓTESIS DE INVESTIGACIÓN',
    title:'La pregunta que guía la investigación',
    question:'¿Cómo desarrollar una plataforma educativa con enfoque principal en un prototipo interactivo de casos clínicos basado en modelos de inteligencia artificial, orientado al proceso cognitivo del diagnóstico, para contribuir al entrenamiento y la evaluación del razonamiento clínico en la comunidad de ciencias de la salud de la UNAB?',
    hypothesis:'Un sistema que retroalimenta las decisiones intermedias —no solo el diagnóstico final— puede identificar y corregir patrones cognitivos disfuncionales que los simuladores tradicionales no detectan. (Kononowicz et al., 2019 — efecto d = 0,90)',
  },

  /* 4 — Justificación y alcance */
  {
    v:'cards', tag:'JUSTIFICACIÓN Y ALCANCE',
    title:'Por qué este proyecto y cuál es su alcance',
    cols:2,
    cards:[
      { title:'Evidencia científica', body:'Los errores diagnósticos responden a patrones cognitivos identificables y entrenables. Un simulador orientado al proceso —no al producto— tiene capacidad formativa real.', icon: <Microscope size={24}/> },
      { title:'Contexto colombiano', body:'55 programas de medicina forman alrededor de 5.000 estudiantes al año sin garantías de exposición sistemática ni retroalimentación individualizada sobre el proceso de razonamiento.', icon: <MapPin size={24}/> },
      { title:'Ingeniería de sistemas', body:'El proyecto moviliza el perfil del ingeniero UNAB: análisis de requerimientos complejos, diseño de arquitecturas inteligentes, implementación de retroalimentación adaptativa y validación con usuarios reales.', icon: <Cpu size={24}/> },
      { title:'Alcance', body:'UNAB + Clínica Foscal Florida · Dominio: sistema gastrointestinal · Usuarios: estudiantes pre-grado · Entrega: finales de 2026 · TRL objetivo: 4', accent:true, icon: <Stethoscope size={24}/> },
    ],
  },

  /* 5 — Objetivos */
  {
    v:'obj', tag:'OBJETIVOS',
    title:'Objetivo general y objetivos específicos',
    general:'Construir un prototipo interactivo de casos clínicos basado en inteligencia artificial, a través de la resolución guiada de escenarios diagnósticos con retroalimentación formativa, para el entrenamiento y evaluación de los componentes del razonamiento clínico en la comunidad académica y profesional de las ciencias de la salud.',
    specifics:[
      'Recopilar información clínica, pedagógica y tecnológica mediante revisión de literatura científica sobre razonamiento clínico, educación médica basada en simulación y sistemas de inteligencia artificial aplicados a las ciencias de la salud.',
      'Diseñar el prototipo interactivo basado en inteligencia artificial mediante la identificación de requerimientos funcionales, pedagógicos y técnicos, y el diseño de la arquitectura del sistema y los modelos de casos clínicos.',
      'Desarrollar el prototipo interactivo integrando módulos de presentación de casos clínicos, toma de decisiones diagnósticas y retroalimentación formativa.',
      'Validar el prototipo mediante la evaluación por parte de expertos, analizando la pertinencia clínica de los casos generados y la coherencia y calidad de la retroalimentación formativa producida.',
    ],
  },

  /* 6 — Resultados esperados */
  {
    v:'cards', tag:'RESULTADOS ESPERADOS',
    title:'Tres productos concretos al cierre del proyecto',
    subtitle:'En español · disponible en cualquier momento · sin costo de licenciamiento',
    cols:3,
    cards:[
      { title:'Corpus GI curado', body:'Corpus clínico del dominio gastrointestinal, estructurado para fine-tuning y validado por expertos médicos de la UNAB. Insumo reutilizable para investigaciones futuras del grupo.', icon: <Database size={24}/> },
      { title:'3 modelos fine-tuned', body:'Agente generador de casos · Resolvedor diagnóstico · Agente pedagogo — evaluados cuantitativamente con métricas estándar de la literatura.', accent:true, icon: <BrainCircuit size={24}/> },
      { title:'Prototipo web funcional', body:'Presentación del caso → interacción con paciente virtual → toma de decisiones → retroalimentación formativa sobre el proceso de razonamiento.', icon: <Layout size={24}/> },
    ],
  },

  /* 7 — Marco teórico-conceptual */
  {
    v:'cards', tag:'MARCO TEÓRICO-CONCEPTUAL',
    title:'Cuatro áreas que convergen en la propuesta',
    cols:2,
    cards:[
      { title:'Procesamiento dual (S1 / S2)', body:'El razonamiento médico opera en dos sistemas: S1 rápido e intuitivo, y S2 analítico y deliberado. La formación de pregrado debe cultivar explícitamente el Sistema 2.', icon: <Activity size={24}/> },
      { title:'Modelos de lenguaje (LLM)', body:'GPT-4 superó al 99,98 % de lectores médicos en casos complejos del NEJM. Los LLMs generan casos clínicos dinámicos que se adaptan a las decisiones del usuario.', icon: <BrainCircuit size={24}/> },
      { title:'Retroalimentación formativa', body:'Para ser efectiva debe ser oportuna, específica sobre qué pasos fueron correctos o erróneos, y explicativa. Los sistemas digitales tienen ventaja estructural: entregan feedback consistente e inmediato.', icon: <CheckCircle2 size={24}/> },
      { title:'Simulación clínica digital', body:'Entorno de práctica sin riesgo para pacientes reales que replica el proceso cognitivo real del diagnóstico, permitiendo repetición deliberada y retroalimentación inmediata.', accent:true, icon: <Stethoscope size={24}/> },
    ],
  },

  /* 8 — Marco normativo */
  {
    v:'cards', tag:'MARCO NORMATIVO',
    title:'Normativa que enmarca el proyecto',
    cols:2,
    cards:[
      { title:'Ley 1581/2012 + Decreto 1377/2013', body:'Protección de datos personales en Colombia. Orienta el diseño de autenticación, control de acceso y manejo de las interacciones del estudiante como datos personales.', icon: <ShieldCheck size={24}/> },
      { title:'Resolución 8430 de 1993', body:'Clasifica el proyecto como investigación sin riesgo: no involucra intervención sobre pacientes ni datos clínicos reales; los participantes en la fase de validación son expertos adultos voluntarios.', icon: <FlaskConical size={24}/> },
      { title:'ISO/IEC 25010 · ISO/IEC 27001', body:'Calidad de software (funcionalidad, confiabilidad, usabilidad, eficiencia) y seguridad de la información. Marco para el diseño de las métricas técnicas de validación.', icon: <CheckCircle2 size={24}/> },
      { title:'Transparencia algorítmica', body:'El sistema declarará explícitamente al usuario que la retroalimentación es generada por IA —no por un docente humano—, cumpliendo los principios de IA responsable.', accent:true, icon: <Database size={24}/> },
    ],
  },

  /* 9 — Antecedentes */
  {
    v:'cards', tag:'ANTECEDENTES',
    title:'Evidencia que valida y delimita la propuesta',
    cols:2,
    cards:[
      { title:'Kononowicz et al. (2019)', body:'Metaanálisis: 51 ensayos, 4.696 participantes. Pacientes virtuales mejoran habilidades clínicas con efecto d = 0,90, especialmente cuando incluyen retroalimentación sobre el proceso de toma de decisiones.', icon: <Activity size={24}/> },
      { title:'Cook et al. (2025)', body:'LLM como paciente virtual: autenticidad evaluada en 5,14/6 por médicos expertos. Costo por conversación: $0,02. Viable técnica y económicamente para programas académicos.', icon: <BrainCircuit size={24}/> },
      { title:'Peralta Ramírez et al. (2025)', body:'El 97 % de estudiantes hispanohablantes encontró útil la retroalimentación automatizada en simulación clínica. Confirma la aceptación en el contexto latinoamericano.', icon: <CheckCircle2 size={24}/> },
      { title:'e-Clinic (Rosario, 2020) — Vacío', body:'Antecedente colombiano más cercano: valida viabilidad técnica, pero no está disponible a escala ni retroalimenta el proceso cognitivo. No existe plataforma en español que combine LLM + doble proceso + retroalimentación del proceso.', accent:true, icon: <Microscope size={24}/> },
    ],
  },

  /* 10 — Marco contextual */
  {
    v:'cards', tag:'MARCO CONTEXTUAL',
    title:'El contexto institucional y su brecha',
    cols:3,
    cards:[
      { title:'UNAB · Medicina acreditada', body:'Programa acreditado de alta calidad desde 1996. Alianza con Clínica Foscal. Laboratorio de simulación clínica desde 2018 — por encima del promedio regional en infraestructura física.', icon: <Users size={24}/> },
      { title:'Infraestructura procedimental', body:'El laboratorio está orientado a habilidades procedimentales —examinar, suturar, reanimar—, no al entrenamiento del razonamiento diagnóstico como proceso cognitivo explícito.', icon: <Stethoscope size={24}/> },
      { title:'La brecha que cerramos', body:'No existe en la UNAB —ni en el contexto latinoamericano— una plataforma en español que entrene y retroalimente el proceso cognitivo del diagnóstico, disponible y sin costo de licenciamiento.', accent:true, icon: <Microscope size={24}/> },
    ],
  },

  /* 11 — Revisión de literatura */
  {
    v:'phases', tag:'REVISIÓN DE LITERATURA',
    title:'PRISMA — 1.285 registros → 25 estudios incluidos',
    subtitle:'6 bases de datos + SciELO + Redalyc · Período 2019–2025 · 5 ejes temáticos',
    phases:[
      { num:'Ejes 1–2', title:'LLM y pacientes virtuales', body:'Capacidad diagnóstica de los LLMs en medicina · Eficacia de pacientes virtuales en educación médica. Kononowicz (2019), Cook (2025), Singhal (2023).', badge:'Viabilidad tecnológica', icon: <BrainCircuit size={24}/> },
      { num:'Ejes 3–4', title:'Evaluación y simulación en AL', body:'Métodos de evaluación del razonamiento clínico · Infraestructura de simulación en América Latina. Norman (2024), Savage (2024), Peralta Ramírez (2025).', badge:'Contexto regional', icon: <MapPin size={24}/> },
      { num:'Eje 5', title:'Prompts y arquitectura RAG', body:'Ingeniería de prompts y arquitectura RAG para sistemas clínicos. Hallazgos: viabilidad técnica y pedagógica confirmada · vacío claramente delimitado.', badge:'Fundamento técnico', icon: <Network size={24}/> },
    ],
  },

  /* 12 — Aspectos metodológicos */
  {
    v:'phases', tag:'ASPECTOS METODOLÓGICOS',
    title:'Metodología iterativa · Scrum · 3 fases',
    subtitle:'Métricas: Accuracy ≥ 65 % · Recall ≥ 60 % · Alucinaciones ≤ 5 % · BERTScore ≥ 0,80 · Latencia ≤ 8 s',
    phases:[
      { num:'FASE 1 · TRL 2', title:'Recopilación y tratamiento de datos', body:'Corpus GI curado desde PMC Open Access, MedCaseReasoning (Stanford, 14.489 casos), MedQA-ES, corpus E3C, GPC colombianas e iberoamericanas y casos validados por expertos UNAB.', badge:'TRL 2', icon: <Database size={24}/> },
      { num:'FASE 2 · TRL 3', title:'Modelos fine-tuned y frontend', body:'3 agentes con LoRA/QLoRA (Llama 3.1, Mistral, Qwen 2.5, BioMistral, Meditron). Frontend React 18 + TypeScript — 13 pantallas. Backend FastAPI + LangGraph.', badge:'TRL 3', icon: <Code size={24}/> },
      { num:'FASE 3 · TRL 4', title:'Integración y validación', body:'Pipeline LangGraph: Agente 1 genera caso y simula paciente → Agente 2 resuelve como ground truth → Agente 3 compara y genera retroalimentación formativa sobre el proceso cognitivo.', badge:'TRL 4', icon: <ShieldCheck size={24}/> },
    ],
  },

  /* 13 — Cronograma */
  {
    v:'phases', tag:'CRONOGRAMA',
    title:'Tres fases alineadas a niveles TRL',
    subtitle:'Entrega del prototipo funcional: finales de 2026',
    phases:[
      { num:'FASE 1', title:'Corpus · TRL 2', body:'Extracción, tratamiento y validación experta del corpus clínico gastrointestinal.', badge:'TRL 2', icon: <FlaskConical size={24}/> },
      { num:'FASE 2', title:'Modelos + Frontend · TRL 3', body:'Fine-tuning de los 3 agentes y desarrollo del frontend en paralelo.', badge:'TRL 3', icon: <Cpu size={24}/> },
      { num:'FASE 3', title:'Integración · TRL 4', body:'Orquestación de los tres agentes, integración completa y validación del prototipo funcional.', badge:'TRL 4', icon: <CheckCircle2 size={24}/> },
    ],
  },

  /* 14 — Presupuesto */
  {
    v:'budget', tag:'PRESUPUESTO',
    title:'Estructura de costos del proyecto',
    subtitle:'Modelos open-weights + capas gratuitas — principal costo: recurso humano del equipo',
    cats:[
      { name:'Recursos humanos (principal)', items:['3 investigadores-estudiantes (trabajo académico)','Tiempo de dirección y co-dirección UNAB','Tiempo del aliado clínico FOSCAL Florida'], accent:true, icon: <Users size={24}/> },
      { name:'Fine-tuning — open-weights', items:['Modelos base open-weights con licencia permisiva','Unsloth: reduce VRAM un 70 % respecto al estándar','Google Colab Pro+ para entrenamiento GPU'], icon: <Cpu size={24}/> },
      { name:'Despliegue — capas gratuitas', items:['Vercel — frontend (capa gratuita)','Render — backend FastAPI (capa gratuita)','Costo por caso en producción: $0,02–$0,51'], icon: <Cloud size={24}/> },
      { name:'Corpus y validación', items:['PMC Open Access, MedCaseReasoning, MedQA-ES','GPC colombianas e iberoamericanas (acceso público)','Validación experta UNAB y FOSCAL (in-kind)'], icon: <Database size={24}/> },
      { name:'Socialización', items:['Impresión del documento final de grado','Material para presentaciones y sustentación','Posible publicación en congreso académico'], icon: <Sparkles size={24}/> },
      { name:'Contingencias', items:['10 % del presupuesto total estimado','Imprevistos técnicos o administrativos','Ajustes de alcance aprobados por director'], icon: <ShieldCheck size={24}/> },
    ],
  },

  /* 15 — Avances del trabajo */
  {
    v:'cards', tag:'AVANCES DEL TRABAJO',
    title:'Estado actual — inicio de Fase 1',
    subtitle:'Tratamiento y curación del corpus clínico gastrointestinal en curso',
    cols:3,
    cards:[
      { title:'Revisión PRISMA', body:'Revisión sistemática completada: 1.285 registros cribados → 25 estudios incluidos. Vacío tecnológico identificado y documentado.', icon: <CheckCircle2 size={24}/> },
      { title:'Arquitectura de los 3 agentes', body:'Diseño del pipeline: Agente 1 (caso/paciente) → Agente 2 (ground truth) → Agente 3 (feedback formativo). Orquestado con LangGraph.', icon: <Network size={24}/> },
      { title:'Stack tecnológico', body:'Frontend: React 18 + TypeScript. Backend: FastAPI. Modelos: Llama 3.1 / Mistral / Qwen 2.5. Fine-tuning: Unsloth + LoRA/QLoRA.', accent:true, icon: <Code size={24}/> },
      { title:'Fuentes del corpus', body:'PMC Open Access, MedCaseReasoning (Stanford), MedQA-ES, E3C, GPC colombianas, casos validados por expertos UNAB. Identificadas y evaluadas.', icon: <Database size={24}/> },
      { title:'Métricas diseñadas', body:'Accuracy ≥ 65 % · Recall ≥ 60 % · Alucinaciones ≤ 5 % · BERTScore ≥ 0,80 · Latencia ≤ 8 s. Protocolo de validación con FOSCAL definido.', icon: <Activity size={24}/> },
      { title:'Fase 1 en curso', body:'Extracción y tratamiento del corpus clínico gastrointestinal en progreso. Primera revisión con el director completada.', icon: <FlaskConical size={24}/> },
    ],
  },

  /* 16 — Referencias bibliográficas */
  {
    v:'refs', tag:'REFERENCIAS BIBLIOGRÁFICAS',
    title:'25 estudios · Revisión sistemática PRISMA',
    refs:[
      { authors:'Kononowicz, A. A., et al.', title:'Virtual patient simulations in health professions education: systematic review and meta-analysis.', where:'Journal of Medical Internet Research, 21(7). 2019.' },
      { authors:'Cook, D. A., et al.', title:'Artificial intelligence for clinical education: a systematic review.', where:'Academic Medicine, 100(3). 2025.' },
      { authors:'Norman, G., & Eva, K.', title:'Diagnostic error and clinical reasoning.', where:'Medical Education, 58(1). 2024.' },
      { authors:'Savage, T., et al.', title:'Diagnostic reasoning prompts reveal a core tension between clinical LLMs.', where:'NPJ Digital Medicine, 7(1). 2024.' },
      { authors:'Newman-Toker, D. E., et al.', title:'Burden of serious harms from diagnostic error in the USA.', where:'BMJ Quality & Safety, 33(2), 109–120. 2024.' },
      { authors:'Graber, M. L., Franklin, N., & Gordon, R.', title:'Diagnostic error in internal medicine.', where:'Archives of Internal Medicine, 165(13), 1493–1499. 2005.' },
      { authors:'Peralta Ramírez, J., et al.', title:'IA generativa para simulación clínica en educación médica latinoamericana.', where:'Revista Latinoamericana de Educación Médica. 2025.' },
      { authors:'Kahneman, D.', title:'Thinking, Fast and Slow.', where:'Farrar, Straus and Giroux. 2011.' },
      { authors:'Singhal, K., et al.', title:'Large language models encode clinical knowledge (Med-PaLM).', where:'Nature, 620, 172–180. 2023.' },
      { authors:'Hu, E. J., et al.', title:'LoRA: Low-rank adaptation of large language models.', where:'ICLR. 2022.' },
    ],
  },

  /* 17 — Cierre */
  {
    v:'title',
    title:'¡Gracias!',
    subtitle:'Retroalimentación estructurada sobre el razonamiento diagnóstico — disponible, consistente, en español, sin depender de la carga asistencial hospitalaria.',
  },
];

/* ══════════════════════════════════════════════════════
   Animation
══════════════════════════════════════════════════════ */
const pageVariants = {
  enter:  (d:number) => ({ x: d > 0 ? 72 : -72, opacity:0 }),
  center: { x:0, opacity:1, transition:{ duration:0.42, ease:[0.25,0.1,0.25,1] as [number,number,number,number] } },
  exit:   (d:number) => ({ x: d > 0 ? -72 : 72, opacity:0, transition:{ duration:0.28 } }),
};

const stagger = (i:number, base=0.1) => ({
  initial:{ opacity:0, y:14 },
  animate:{ opacity:1, y:0 },
  transition:{ delay: base + i*0.07, duration:0.34 },
});

/* ══════════════════════════════════════════════════════
   Slide renderers
══════════════════════════════════════════════════════ */
function Meta({ tag, num }:{ tag:string; num:number }) {
  return (
    <div className="proy-slide-meta">
      <span className="proy-slide-num">{String(num).padStart(2,'0')}</span>
      <span className="proy-slide-tag">{tag}</span>
    </div>
  );
}

function renderSlide(slide:Slide, idx:number) {
  const num = idx + 1;

  if (slide.v === 'title') return (
    <div className="proy-fullcol proy-title-slide" style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', gap: '32px' }}>
      <motion.img 
        src={logoUrl} 
        alt="Clerkship Logo" 
        className="proy-title-logo"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25,0.1,0.25,1] }}
        style={{ width: '120px', height: 'auto', marginBottom: '16px' }}
      />
      <motion.div {...stagger(1, 0.2)}>
        <h1 className="proy-slide-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '16px' }}>{slide.title}</h1>
        <p className="proy-slide-sub" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', color: 'var(--ink2)' }}>{slide.subtitle}</p>
      </motion.div>
    </div>
  );

  if (slide.v === 'team') return (
    <div className="proy-fullcol">
      <div className="proy-fullcol-head" style={{ marginBottom: '24px', alignItems: 'center', textAlign: 'center' }}>
        <h1 className="proy-title-md">{slide.title}</h1>
      </div>
      <div className="proy-team-grid">
        {slide.members.map((m, i) => (
          <motion.div key={i} className="proy-team-card" {...stagger(i, 0.1)} style={{ borderTop: `4px solid ${m.color}` }}>
            <div className="proy-team-avatar-box">
              <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${m.seed}&backgroundColor=${m.color.replace('#','')}`} alt={m.name} className="proy-team-avatar" />
              <div className="proy-team-role-icon" style={{ backgroundColor: m.color }}><User size={14} color="#fff" /></div>
            </div>
            <div className="proy-team-info">
              <h3 className="proy-team-name">{m.name}</h3>
              <span className="proy-team-role" style={{ color: m.color }}>{m.role}</span>
              <p className="proy-team-desc">{m.desc}</p>
            </div>
            <div className="proy-team-skills">
              {m.skills.map((s, j) => (
                <span key={j} className="proy-team-skill">
                  {s.icon} {s.label}
                </span>
              ))}
            </div>
            <div className="proy-team-loc">
              <MapPin size={12} style={{ color: m.color }} />
              <span>{m.location}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (slide.v === 'stat') return (
    <div className="proy-twocol">
      <div className="proy-col-left">
        <Meta tag={slide.tag} num={num} />
        <h1 className="proy-slide-title">{slide.title}</h1>
        <p className="proy-slide-body">{slide.body}</p>
      </div>
      <div className="proy-statcol">
        {slide.stats.map((s,i) => (
          <motion.div key={i} className="proy-stat" {...stagger(i,0.18)}>
            <span className="proy-stat-n">{s.n}</span>
            <span className="proy-stat-l">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (slide.v === 'question') return (
    <div className="proy-fullcol">
      <Meta tag={slide.tag} num={num} />
      <h1 className="proy-title-md">{slide.title}</h1>
      <motion.div className="proy-qbox" {...stagger(0,0.12)}>
        <p className="proy-box-label">Pregunta de investigación</p>
        <p className="proy-box-text">{slide.question}</p>
      </motion.div>
      <motion.div className="proy-hbox" {...stagger(1,0.12)}>
        <p className="proy-box-label proy-box-label-dim">Hipótesis</p>
        <p className="proy-box-text proy-box-text-dim">{slide.hypothesis}</p>
      </motion.div>
    </div>
  );

  if (slide.v === 'cards') {
    const cols = slide.cols ?? (slide.cards.length > 4 ? 3 : 2);
    return (
      <div className="proy-fullcol">
        <div className="proy-fullcol-head">
          <Meta tag={slide.tag} num={num} />
          <h1 className="proy-title-md">{slide.title}</h1>
          {slide.subtitle && <p className="proy-slide-sub">{slide.subtitle}</p>}
        </div>
        <div className={`proy-cards-grid proy-grid-${cols}`}>
          {slide.cards.map((c,i) => (
            <motion.div key={i} className={`proy-card${c.accent?' proy-card-accent':''}`} {...stagger(i,0.1)}>
              {c.icon && <div className="proy-card-icon" style={{ marginBottom: '8px', color: c.accent ? '#fff' : 'var(--p)' }}>{c.icon}</div>}
              <p className="proy-card-title">{c.title}</p>
              <p className="proy-card-body">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.v === 'obj') return (
    <div className="proy-fullcol">
      <div className="proy-fullcol-head">
        <Meta tag={slide.tag} num={num} />
        <h1 className="proy-title-md">{slide.title}</h1>
      </div>
      <motion.div className="proy-qbox" {...stagger(0,0.1)}>
        <p className="proy-box-label">Objetivo general</p>
        <p className="proy-box-text">{slide.general}</p>
      </motion.div>
      <div className="proy-obj-grid">
        {slide.specifics.map((s,i) => (
          <motion.div key={i} className="proy-obj-sp" {...stagger(i,0.2)}>
            <span className="proy-obj-num">0{i+1}</span>
            <p className="proy-obj-body">{s}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (slide.v === 'compare') return (
    <div className="proy-fullcol">
      <div className="proy-fullcol-head">
        <Meta tag={slide.tag} num={num} />
        <h1 className="proy-title-md">{slide.title}</h1>
        <p className="proy-slide-sub">{slide.subtitle}</p>
      </div>
      <div className="proy-cmp-grid">
        {slide.tools.map((t,i) => (
          <motion.div key={i} className={`proy-cmp-card${t.ours?' proy-cmp-ours':''}`} {...stagger(i,0.1)}>
            <p className="proy-cmp-name">{t.ours && <span className="proy-cmp-star">★ </span>}{t.name}</p>
            <div className="proy-cmp-list">
              {t.checks.map((c,j) => (
                <span key={j} className={`proy-cmp-item${c.ok?' cmp-ok':' cmp-no'}`}>
                  {c.ok
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  }
                  {c.text}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (slide.v === 'phases') return (
    <div className="proy-fullcol">
      <div className="proy-fullcol-head">
        <Meta tag={slide.tag} num={num} />
        <h1 className="proy-title-md">{slide.title}</h1>
        <p className="proy-slide-sub">{slide.subtitle}</p>
      </div>
      <div className="proy-phases-row">
        {slide.phases.map((p,i) => (
          <motion.div key={i} className="proy-phase" {...stagger(i,0.12)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="proy-phase-num">{p.num}</p>
              {p.icon && <div style={{ color: 'var(--p)' }}>{p.icon}</div>}
            </div>
            <p className="proy-phase-title">{p.title}</p>
            <p className="proy-phase-body">{p.body}</p>
            {p.badge && <span className="proy-phase-badge">{p.badge}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (slide.v === 'budget') return (
    <div className="proy-fullcol">
      <div className="proy-fullcol-head">
        <Meta tag={slide.tag} num={num} />
        <h1 className="proy-title-md">{slide.title}</h1>
        <p className="proy-slide-sub">{slide.subtitle}</p>
      </div>
      <div className="proy-budget-grid">
        {slide.cats.map((c,i) => (
          <motion.div key={i} className={`proy-card${c.accent?' proy-card-accent':''}`} {...stagger(i,0.08)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: c.accent ? '#fff' : 'var(--p)' }}>
              {c.icon}
              <p className="proy-card-title" style={{ marginBottom: 0 }}>{c.name}</p>
            </div>
            {c.items.map((it,j) => <p key={j} className="proy-budget-item">· {it}</p>)}
          </motion.div>
        ))}
      </div>
    </div>
  );

  if (slide.v === 'refs') return (
    <div className="proy-fullcol">
      <div className="proy-fullcol-head">
        <Meta tag={slide.tag} num={num} />
        <h1 className="proy-title-md">{slide.title}</h1>
      </div>
      <div className="proy-refs-list">
        {slide.refs.map((r,i) => (
          <motion.div key={i} className="proy-ref" {...stagger(i,0.06)}>
            <span className="proy-ref-num">[{i+1}]</span>
            <p className="proy-ref-text">
              <strong className="proy-ref-authors">{r.authors}</strong>{' '}
              {r.title}{' '}
              <em className="proy-ref-where">{r.where}</em>
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return null;
}

/* ══════════════════════════════════════════════════════
   Page
══════════════════════════════════════════════════════ */
export default function ProyectoPage() {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const go = useCallback((d:number) => {
    setDir(d);
    setIdx(prev => (prev + d + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const h = (e:KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft')  go(-1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  return (
    <div className="proy-root" onContextMenu={e => e.preventDefault()}>

      {/* ── Top bar ── */}
      <header className="proy-topbar">
        <a href="/" className="proy-back">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver
        </a>
        <a href="/" className="proy-brand">
          <img src={logoUrl} alt="Clerkship" className="proy-brand-img" />
          <span>Clerkship</span>
        </a>
        <span className="proy-idx-label">
          {String(idx+1).padStart(2,'0')} / {String(SLIDES.length).padStart(2,'0')}
        </span>
      </header>

      {/* ── Progress bar ── */}
      <div className="proy-progress-track">
        <motion.div
          className="proy-progress-fill"
          animate={{ width:`${((idx+1)/SLIDES.length)*100}%` }}
          transition={{ duration:0.4, ease:'easeInOut' }}
        />
      </div>

      {/* ── Main ── */}
      <main className="proy-main">
        <button className="proy-nav" onClick={() => go(-1)} aria-label="Anterior">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <div className="proy-viewport">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={idx}
              className="proy-slide"
              custom={dir}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {renderSlide(SLIDES[idx], idx)}
            </motion.div>
          </AnimatePresence>
        </div>

        <button className="proy-nav" onClick={() => go(1)} aria-label="Siguiente">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </main>

      {/* ── Dots ── */}
      <div className="proy-dots">
        {SLIDES.map((_,i) => (
          <button
            key={i}
            className={`proy-dot${i===idx?' active':''}`}
            onClick={() => { setDir(i>idx?1:-1); setIdx(i); }}
            aria-label={`Diapositiva ${i+1}`}
          />
        ))}
      </div>

      <p className="proy-hint">← → para navegar entre diapositivas</p>
    </div>
  );
}
