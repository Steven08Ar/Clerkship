export interface CronogramaItem {
  id: string;
  semana: number;
  semanaNombre: string;
  area: 'P1' | 'P2' | 'Ambos'; // P1: Datos/IA, P2: Agentes/Backend, Ambos: Integración/Validación
  actividad: string;
  descripcion?: string;
  responsableDefault: string;
  fechaEstimada: string;
  esEntregable?: boolean;
  completadoDefault?: boolean;
}

export interface TechOption {
  id: string;
  nombre: string;
  categoria: 'Backend' | 'IA' | 'Frontend' | 'BaseDatos' | 'Seguridad';
  icono?: string;
  descripcionDefault: string;
}

export interface TeamMember {
  id: string;
  nombre: string;
  rol: string;
  areaPrincipal: 'P1' | 'P2' | 'Fullstack';
  avatarColor: string;
}

export interface MemberRegistry {
  memberId: string;
  selectedTechIds: string[];
  customTechnologies: string;
  usageNotes: string;
  frenteTrabajo: 'P1' | 'P2' | 'Ambos';
  updatedAt?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'santiago',
    nombre: 'Santiago Arciniegas',
    rol: 'Líder de Proyecto / P1 (Datos & Fine-Tuning IA)',
    areaPrincipal: 'P1',
    avatarColor: '#1976D2',
  },
  {
    id: 'zabdiel',
    nombre: 'Zabdiel',
    rol: 'Co-Líder / P2 (Agentes, Backend & Orquestación)',
    areaPrincipal: 'P2',
    avatarColor: '#0097A7',
  },
  {
    id: 'camilo',
    nombre: 'Camilo',
    rol: 'Desarrollo de Arquitectura & Integración',
    areaPrincipal: 'Fullstack',
    avatarColor: '#EA580C',
  },
  {
    id: 'juan',
    nombre: 'Juan',
    rol: 'Validación Clínica & Evaluación de Modelos',
    areaPrincipal: 'Fullstack',
    avatarColor: '#9333EA',
  },
];

export const TECH_CATALOG: TechOption[] = [
  // Backend / API
  { id: 'python', nombre: 'Python 3.11+', categoria: 'Backend', descripcionDefault: 'Lenguaje principal para lógica agéntica y servidor REST' },
  { id: 'flask', nombre: 'Flask (Framework REST)', categoria: 'Backend', descripcionDefault: 'Scaffolding de API con Blueprints por grupo de endpoints' },
  { id: 'langgraph', nombre: 'LangGraph', categoria: 'Backend', descripcionDefault: 'Orquestación del grafo agéntico (Agentes 1, 2, 3 y transiciones)' },
  { id: 'pydantic', nombre: 'Pydantic v2', categoria: 'Backend', descripcionDefault: 'Validación y esquemas estrictos del contrato de API' },
  { id: 'openapi', nombre: 'OpenAPI / Swagger', categoria: 'Backend', descripcionDefault: 'Documentación del contrato de API para integración' },
  { id: 'sse', nombre: 'Streaming SSE (Server-Sent Events)', categoria: 'Backend', descripcionDefault: 'Transmisión en vivo de respuestas y trazas de razonamiento' },
  { id: 'jwt_cors', nombre: 'JWT & CORS / HTTPS', categoria: 'Backend', descripcionDefault: 'Seguridad, sesión con expiración y control de orígenes' },
  { id: 'locust', nombre: 'Locust', categoria: 'Backend', descripcionDefault: 'Pruebas de carga, latencia y rendimiento p90' },

  // IA / Fine-Tuning & Datos
  { id: 'unsloth', nombre: 'Unsloth', categoria: 'IA', descripcionDefault: 'Fine-tuning eficiente con ahorro de VRAM en GPU' },
  { id: 'huggingface_trl', nombre: 'HuggingFace TRL', categoria: 'IA', descripcionDefault: 'Entrenamiento SFT-CoT y gestión de adaptadores PEFT' },
  { id: 'pytorch', nombre: 'PyTorch / Transformers', categoria: 'IA', descripcionDefault: 'Carga de modelos candidatos (Llama 3.1 8B, Qwen 2.5, Mistral)' },
  { id: 'qlora', nombre: 'QLoRA (Cuantización 4-bit) / LoRA', categoria: 'IA', descripcionDefault: 'Adaptadores eficientes para Agentes 1 y 2' },
  { id: 'spacy', nombre: 'spaCy', categoria: 'IA', descripcionDefault: 'Segmentación de anamnesis, examen físico y paraclínicos' },
  { id: 'bioc', nombre: 'BioC API / Biopython', categoria: 'IA', descripcionDefault: 'Extracción de artículos en PMC Open Access (MeSH gastroenterología)' },
  { id: 'lm_harness', nombre: 'lm-evaluation-harness', categoria: 'IA', descripcionDefault: 'Evaluación cuantitativa de accuracy en MedQA-ES' },

  // Frontend & UI
  { id: 'react', nombre: 'React 18', categoria: 'Frontend', descripcionDefault: 'Biblioteca UI para el prototipo clínico web' },
  { id: 'typescript', nombre: 'TypeScript', categoria: 'Frontend', descripcionDefault: 'Tipado estricto en cliente para prevención de errores' },
  { id: 'vite', nombre: 'Vite', categoria: 'Frontend', descripcionDefault: 'Entorno de desarrollo y empaquetado de producción' },
  { id: 'framer_motion', nombre: 'Framer Motion', categoria: 'Frontend', descripcionDefault: 'Micro-animaciones y transiciones de interfaz' },
  { id: 'lucide', nombre: 'Lucide Icons', categoria: 'Frontend', descripcionDefault: 'Iconografía consistente médica y de navegación' },

  // Bases de Datos
  { id: 'postgresql', nombre: 'PostgreSQL', categoria: 'BaseDatos', descripcionDefault: 'Base de datos relacional para tabla CaseSession y migraciones' },
  { id: 'jsonl', nombre: 'Corpus JSONL', categoria: 'BaseDatos', descripcionDefault: 'Dataset de casos clínicos anotados con CoT explícito' },
  { id: 'embeddings', nombre: 'Embeddings & Coseno', categoria: 'BaseDatos', descripcionDefault: 'Deduplicación semántica y filtrado terminológico' },

  // Seguridad
  { id: 'iso27001', nombre: 'Checklist ISO/IEC 27001', categoria: 'Seguridad', descripcionDefault: 'Auditoría de datos, PII NER regex y seguridad' },
];

export const CRONOGRAMA_ACTIVIDADES: CronogramaItem[] = [
  // SEMANA 1
  {
    id: 'sem1_p1_bioc',
    semana: 1,
    semanaNombre: 'Semana 1 — Extracción de fuentes',
    area: 'P1',
    actividad: 'Scripts de extracción vía BioC API/Biopython sobre PMC Open Access Subset (MeSH gastroenterología)',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 1',
    completadoDefault: true,
  },
  {
    id: 'sem1_p1_medcase',
    semana: 1,
    semanaNombre: 'Semana 1 — Extracción de fuentes',
    area: 'P1',
    actividad: 'Descarga y parsing de MedCaseReasoning (14,489 casos, GitHub) — extraer estructura JSON del razonamiento',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 1',
    completadoDefault: true,
  },
  {
    id: 'sem1_p1_medqa',
    semana: 1,
    semanaNombre: 'Semana 1 — Extracción de fuentes',
    area: 'P1',
    actividad: 'Descarga de MedQA-ES/MedMCQA-ES y E3C (HuggingFace) — inventariar formato de cada fuente',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 1',
    completadoDefault: true,
  },
  {
    id: 'sem1_p1_dataset_crudo',
    semana: 1,
    semanaNombre: 'Semana 1 — Extracción de fuentes',
    area: 'P1',
    actividad: 'Consolidar dataset crudo con esquema común: {fuente, texto, metadata, licencia}',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 1',
    esEntregable: true,
    completadoDefault: true,
  },
  {
    id: 'sem1_p2_langgraph',
    semana: 1,
    semanaNombre: 'Semana 1 — Extracción de fuentes',
    area: 'P2',
    actividad: 'Definir el grafo LangGraph: nodos (Agente 1, 2, 3), condiciones de transición, estado compartido',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 1',
    completadoDefault: true,
  },
  {
    id: 'sem1_p2_pydantic',
    semana: 1,
    semanaNombre: 'Semana 1 — Extracción de fuentes',
    area: 'P2',
    actividad: 'Especificar contrato de API completo: JSON schemas de request/response con modelos Pydantic v2',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 1',
    completadoDefault: true,
  },
  {
    id: 'sem1_p2_swagger',
    semana: 1,
    semanaNombre: 'Semana 1 — Extracción de fuentes',
    area: 'P2',
    actividad: 'Documentar el contrato en OpenAPI/Swagger (para que frontend pueda mockear desde ya)',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 1',
    completadoDefault: true,
  },
  {
    id: 'sem1_p2_flask',
    semana: 1,
    semanaNombre: 'Semana 1 — Extracción de fuentes',
    area: 'P2',
    actividad: 'Scaffolding del repo backend Flask: blueprints por grupo de endpoints, estructura de carpetas',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 1',
    esEntregable: true,
    completadoDefault: true,
  },

  // SEMANA 2
  {
    id: 'sem2_p1_norm',
    semana: 2,
    semanaNombre: 'Semana 2 — Corpus semántico + backend mock',
    area: 'P1',
    actividad: 'Normalización ortográfica/codificación (UTF-8, acentos, unidades de medida clínicas)',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 2',
    completadoDefault: true,
  },
  {
    id: 'sem2_p1_spacy',
    semana: 2,
    semanaNombre: 'Semana 2 — Corpus semántico + backend mock',
    area: 'P1',
    actividad: 'Segmentación por unidades temáticas (anamnesis/examen físico/paraclínicos) con spaCy',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 2',
    completadoDefault: true,
  },
  {
    id: 'sem2_p1_tok',
    semana: 2,
    semanaNombre: 'Semana 2 — Corpus semántico + backend mock',
    area: 'P1',
    actividad: 'Tokenización compatible con el tokenizador del modelo base candidato',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 2',
    completadoDefault: true,
  },
  {
    id: 'sem2_p1_dedup',
    semana: 2,
    semanaNombre: 'Semana 2 — Corpus semántico + backend mock',
    area: 'P1',
    actividad: 'Filtrado por densidad terminológica clínica (embeddings + umbral) y deduplicación semántica',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 2',
    completadoDefault: true,
  },
  {
    id: 'sem2_p1_entregable',
    semana: 2,
    semanaNombre: 'Semana 2 — Corpus semántico + backend mock',
    area: 'P1',
    actividad: 'Entregable: corpus semántico v1 + reporte de cobertura léxica',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 2',
    esEntregable: true,
    completadoDefault: true,
  },
  {
    id: 'sem2_p2_stubs',
    semana: 2,
    semanaNombre: 'Semana 2 — Corpus semántico + backend mock',
    area: 'P2',
    actividad: 'Implementar los 3 agentes como funciones stub que devuelven JSON mockeado según el contrato',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 2',
    completadoDefault: true,
  },
  {
    id: 'sem2_p2_transitions',
    semana: 2,
    semanaNombre: 'Semana 2 — Corpus semántico + backend mock',
    area: 'P2',
    actividad: 'Conectar stubs al grafo LangGraph, probar transiciones con datos falsos',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 2',
    completadoDefault: true,
  },
  {
    id: 'sem2_p2_pytest',
    semana: 2,
    semanaNombre: 'Semana 2 — Corpus semántico + backend mock',
    area: 'P2',
    actividad: 'Setup de pytest para validar que el grafo transiciona correctamente entre nodos',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 2',
    esEntregable: true,
    completadoDefault: true,
  },

  // SEMANA 3
  {
    id: 'sem3_p1_cot',
    semana: 3,
    semanaNombre: 'Semana 3 — Corpus de casos clínicos + Agente 3',
    area: 'P1',
    actividad: 'Estructurar casos clínicos en pares instrucción-respuesta con trazas CoT explícitas',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 3',
    completadoDefault: true,
  },
  {
    id: 'sem3_p1_tagging',
    semana: 3,
    semanaNombre: 'Semana 3 — Corpus de casos clínicos + Agente 3',
    area: 'P1',
    actividad: 'Anotar cada caso con etiqueta de etapa diagnóstica y justificación clínica',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 3',
    completadoDefault: true,
  },
  {
    id: 'sem3_p1_entregable',
    semana: 3,
    semanaNombre: 'Semana 3 — Corpus de casos clínicos + Agente 3',
    area: 'P1',
    actividad: 'Entregable: corpus de casos clínicos v1 (JSONL)',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 3',
    esEntregable: true,
    completadoDefault: true,
  },
  {
    id: 'sem3_p2_prompt_ag3',
    semana: 3,
    semanaNombre: 'Semana 3 — Corpus de casos clínicos + Agente 3',
    area: 'P2',
    actividad: 'Escribir system prompt completo del Agente 3 (rol, marco doble proceso, retroalimentación formativa)',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 3',
    completadoDefault: true,
  },
  {
    id: 'sem3_p2_fewshot',
    semana: 3,
    semanaNombre: 'Semana 3 — Corpus de casos clínicos + Agente 3',
    area: 'P2',
    actividad: 'Construir 5-8 few-shot examples de retroalimentación anotados y probar Agente 3 contra modelo base',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 3',
    esEntregable: true,
    completadoDefault: true,
  },

  // SEMANA 4
  {
    id: 'sem4_ambos_anon',
    semana: 4,
    semanaNombre: 'Semana 4 — Cierre de datos + selección de modelo (Checkpoint)',
    area: 'Ambos',
    actividad: 'Anonimización PII (regex + NER) — Ley 1581 y augmentación por paráfrasis controlada',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 4',
    completadoDefault: true,
  },
  {
    id: 'sem4_ambos_models',
    semana: 4,
    semanaNombre: 'Semana 4 — Cierre de datos + selección de modelo (Checkpoint)',
    area: 'Ambos',
    actividad: 'Comparativo rápido de modelos base (Llama 3.1 8B, Qwen 2.5 7B, Mistral Nemo) en MedQA-ES',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 4',
    completadoDefault: true,
  },
  {
    id: 'sem4_p2_biasservice',
    semana: 4,
    semanaNombre: 'Semana 4 — Cierre de datos + selección de modelo (Checkpoint)',
    area: 'P2',
    actividad: 'Implementar bias_service: detección para los 5 sesgos cognitivos (cierre prematuro, anclaje, etc.)',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 4',
    esEntregable: true,
    completadoDefault: true,
  },

  // SEMANA 5
  {
    id: 'sem5_p1_unsloth',
    semana: 5,
    semanaNombre: 'Semana 5 — Inicio de fine-tuning + fallback funcional',
    area: 'P1',
    actividad: 'Setup de Unsloth + HuggingFace TRL (QLoRA 4-bit / LoRA float16) y fine-tuning continuado',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 5',
    completadoDefault: true,
  },
  {
    id: 'sem5_p2_llmchat',
    semana: 5,
    semanaNombre: 'Semana 5 — Inicio de fine-tuning + fallback funcional',
    area: 'P2',
    actividad: 'Implementar /llm/chat contra modelo base como fallback temporal, streaming SSE y Locust',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 5',
    esEntregable: true,
    completadoDefault: true,
  },

  // SEMANA 6
  {
    id: 'sem6_p1_sft',
    semana: 6,
    semanaNombre: 'Semana 6 — Fine-tuning de instrucción + persistencia',
    area: 'P1',
    actividad: 'Lanzar fine-tuning SFT-CoT para Agentes 1 y 2, monitorear pérdida y guardar checkpoints',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 6',
    completadoDefault: true,
  },
  {
    id: 'sem6_p2_postgres',
    semana: 6,
    semanaNombre: 'Semana 6 — Fine-tuning de instrucción + persistencia',
    area: 'P2',
    actividad: 'Implementar tabla CaseSession en PostgreSQL (schema + migraciones) y persistencia de turnos',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 6',
    esEntregable: true,
    completadoDefault: true,
  },

  // SEMANA 7
  {
    id: 'sem7_p1_evalharness',
    semana: 7,
    semanaNombre: 'Semana 7 — Evaluación de modelo + preparación de integración',
    area: 'P1',
    actividad: 'Evaluación con lm-evaluation-harness (accuracy MedQA-ES) y exportar adaptadores PEFT',
    responsableDefault: 'Santiago Arciniegas',
    fechaEstimada: 'Semana 7',
    completadoDefault: true,
  },
  {
    id: 'sem7_p2_adapters',
    semana: 7,
    semanaNombre: 'Semana 7 — Evaluación de modelo + preparación de integración',
    area: 'P2',
    actividad: 'Preparar el grafo para cargar los adaptadores reales y pruebas de humo con checkpoint intermedio',
    responsableDefault: 'Steven',
    fechaEstimada: 'Semana 7',
    completadoDefault: true,
  },

  // SEMANA 8
  {
    id: 'sem8_ambos_integ60',
    semana: 8,
    semanaNombre: 'Semana 8 — Integración final (Checkpoint 60%)',
    area: 'Ambos',
    actividad: 'Reemplazar Agentes 1 y 2 por adaptadores reales; prueba E2E completa (/cases/new -> chat -> feedback)',
    responsableDefault: 'Santiago & Steven',
    fechaEstimada: 'Semana 8',
    esEntregable: true,
    completadoDefault: true,
  },
  {
    id: 'sem8_ambos_security',
    semana: 8,
    semanaNombre: 'Semana 8 — Integración final (Checkpoint 60%)',
    area: 'Ambos',
    actividad: 'Verificar JWT, CORS y HTTPS en flujo completo; congelar contrato de API final (Demo funcional)',
    responsableDefault: 'Santiago & Steven',
    fechaEstimada: 'Semana 8',
    esEntregable: true,
    completadoDefault: true,
  },

  // SEMANA 9-10
  {
    id: 'sem9_10_metrics',
    semana: 9,
    semanaNombre: 'Semana 9-10 — Métricas cuantitativas completas',
    area: 'Ambos',
    actividad: 'Tasa de alucinación (LLM-as-judge), BERTScore F1, Clinical Reasoning Recall y latencia Locust p90',
    responsableDefault: 'Santiago & Steven',
    fechaEstimada: 'Semana 9-10',
    completadoDefault: false,
  },

  // SEMANA 11-12
  {
    id: 'sem11_12_experts',
    semana: 11,
    semanaNombre: 'Semana 11-12 — Validación con panel de expertos',
    area: 'Ambos',
    actividad: 'Coordinar panel de 3 médicos docentes, evaluación con rúbricas de pertinencia clínica y retroalimentación',
    responsableDefault: 'Santiago & Steven',
    fechaEstimada: 'Semana 11-12',
    completadoDefault: false,
  },

  // SEMANA 13-14
  {
    id: 'sem13_14_refinement',
    semana: 13,
    semanaNombre: 'Semana 13-14 — Refinamiento iterativo',
    area: 'Ambos',
    actividad: 'Ajustar corpus/hiperparámetros P1 y prompts de Agente 3 / umbrales bias_service P2 según feedback médico',
    responsableDefault: 'Santiago & Steven',
    fechaEstimada: 'Semana 13-14',
    completadoDefault: false,
  },

  // SEMANA 15
  {
    id: 'sem15_compliance',
    semana: 15,
    semanaNombre: 'Semana 15 — Seguridad y cumplimiento',
    area: 'Ambos',
    actividad: 'JWT expiración, logging auditoría outputs, checklist ISO/IEC 27001 e informe técnico final',
    responsableDefault: 'Santiago & Steven',
    fechaEstimada: 'Semana 15',
    esEntregable: true,
    completadoDefault: false,
  },

  // SEMANA 16
  {
    id: 'sem16_cierre',
    semana: 16,
    semanaNombre: 'Semana 16 — Cierre y Sustentación',
    area: 'Ambos',
    actividad: 'Sustentación final pública del proyecto de grado y entrega de prototipo funcional completo',
    responsableDefault: 'Santiago & Steven',
    fechaEstimada: 'Semana 16',
    esEntregable: true,
    completadoDefault: false,
  },
];
