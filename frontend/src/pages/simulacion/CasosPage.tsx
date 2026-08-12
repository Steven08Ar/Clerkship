import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Play, Lock, CheckCircle, Clock,
  ChevronRight, ArrowLeft, Info, Brain, Heart, Wind, Stethoscope, Target, Briefcase, Calendar, User, UserPlus, PlusCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';

/* ── Types ─────────────────────────────────────────────── */
type Status = 'disponible' | 'en_progreso' | 'completado' | 'bloqueado';

interface Case {
  id: number;
  title: string;
  scenario: string;
  difficulty: 1 | 2 | 3;
  time: string;
  status: Status;
  score: number | null;
  biases: number | null;
  tags: string[];
}

/* ── Data ───────────────────────────────────────────────── */
const CASES: Case[] = [
  {
    id: 1,
    title: 'Úlcera péptica por uso de AINEs',
    scenario: 'Paciente masculino de 42 años, contador, con dolor epigástrico urente de 3 semanas y uso crónico de ibuprofeno.',
    difficulty: 1, time: '25–35 min', status: 'completado', score: 87, biases: 0,
    tags: ['Úlcera péptica', 'AINEs', 'H. pylori'],
  },
  {
    id: 2,
    title: 'Enfermedad por reflujo gastroesofágico',
    scenario: 'Paciente femenina de 38 años con pirosis nocturna, regurgitación ácida y tos crónica de 2 meses.',
    difficulty: 1, time: '20–30 min', status: 'completado', score: 82, biases: 1,
    tags: ['ERGE', 'Pirosis', 'Esofagitis'],
  },
  {
    id: 3,
    title: 'Apendicitis aguda típica',
    scenario: 'Paciente masculino de 22 años con dolor migratorio en fosa ilíaca derecha, fiebre de 38.2 °C y náuseas.',
    difficulty: 1, time: '20–28 min', status: 'completado', score: 91, biases: 0,
    tags: ['Apendicitis', 'Urgencia quirúrgica', 'McBurney'],
  },
  {
    id: 4,
    title: 'Síndrome de intestino irritable',
    scenario: 'Paciente femenina de 29 años con dolor abdominal recurrente, distensión y alternancia entre estreñimiento y diarrea.',
    difficulty: 2, time: '30–40 min', status: 'disponible', score: null, biases: null,
    tags: ['SII', 'Dolor funcional', 'Criterios Roma'],
  },
  {
    id: 5,
    title: 'Colecistitis aguda calculosa',
    scenario: 'Paciente femenina de 45 años con dolor en hipocondrio derecho post-ingesta de comida grasa, irradiado al hombro derecho.',
    difficulty: 2, time: '28–38 min', status: 'disponible', score: null, biases: null,
    tags: ['Colecistitis', 'Colelitiasis', 'Murphy'],
  },
  {
    id: 6,
    title: 'Pancreatitis aguda leve',
    scenario: 'Paciente masculino de 51 años con dolor epigástrico irradiado en cinturón, vómito persistente y amilasas elevadas.',
    difficulty: 2, time: '30–40 min', status: 'en_progreso', score: null, biases: null,
    tags: ['Pancreatitis', 'Amilasa', 'Lipasa'],
  },
  {
    id: 7,
    title: 'Hepatitis viral aguda tipo A',
    scenario: 'Paciente masculino de 19 años con ictericia, coluria, acolia y artralgias de aparición reciente tras viaje reciente.',
    difficulty: 2, time: '25–35 min', status: 'disponible', score: null, biases: null,
    tags: ['Hepatitis A', 'Ictericia', 'Transaminasas'],
  },
  {
    id: 8,
    title: 'Hemorragia digestiva alta no variceal',
    scenario: 'Paciente masculino de 60 años con hematemesis, melenas y síncope. Usuario de anticoagulantes orales.',
    difficulty: 2, time: '32–42 min', status: 'disponible', score: null, biases: null,
    tags: ['Hematemesis', 'Melenas', 'EVDA', 'Forrest'],
  },
  {
    id: 9,
    title: 'Enfermedad de Crohn ileal',
    scenario: 'Paciente de 26 años con diarrea crónica no sanguinolenta, pérdida de peso, fiebre y lesiones perianales.',
    difficulty: 3, time: '40–55 min', status: 'bloqueado', score: null, biases: null,
    tags: ['Crohn', 'EII', 'Fístula', 'Colonoscopia'],
  },
  {
    id: 10,
    title: 'Adenocarcinoma gástrico avanzado',
    scenario: 'Paciente masculino de 65 años con pérdida de peso severa, disfagia progresiva y masa palpable en epigastrio.',
    difficulty: 3, time: '45–60 min', status: 'bloqueado', score: null, biases: null,
    tags: ['Cáncer gástrico', 'Disfagia', 'Linitis plástica'],
  },
];

/* ── Config ─────────────────────────────────────────────── */
const DIFFICULTY_LABEL: Record<number, string> = { 1: 'Básico', 2: 'Intermedio', 3: 'Avanzado' };
const DIFFICULTY_COLOR: Record<number, { bg: string; color: string }> = {
  1: { bg: '#E6F6EC', color: '#10B981' },
  2: { bg: '#FFF7E6', color: '#F59E0B' },
  3: { bg: '#FEE2E2', color: '#EF4444' },
};

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string; icon: typeof Play }> = {
  completado:  { label: 'Completado',   bg: '#E6F6EC', color: '#10B981', icon: CheckCircle },
  en_progreso: { label: 'En progreso',  bg: '#FFF7E6', color: '#F59E0B', icon: Play },
  disponible:  { label: 'Disponible',   bg: '#F0F9FF', color: '#0284C7', icon: Play },
  bloqueado:   { label: 'Bloqueado',    bg: '#F1F5F9', color: '#94A3B8', icon: Lock },
};

// SVG Icons for organs
const StomachIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6c0-2.2-1.8-4-4-4s-4 1.8-4 4c0 1.1-.9 2-2 2H6c-1.1 0-2 .9-2 2v2c0 3.3 2.7 6 6 6h4c2.2 0 4-1.8 4-4V6z"/>
    <path d="M12 18v2c0 1.1.9 2 2 2h4"/>
  </svg>
);

interface ModuleInfo {
  title: string;
  desc: string;
  count: string;
  icon: React.ReactNode;
  colorBg: string;
  colorFg: string;
  active: boolean;
  cases: Case[];
}

const MODULES: ModuleInfo[] = [
  {
    title: 'Gastroenterología',
    desc: 'Trastornos digestivos, hepáticos y pancreáticos.',
    count: '10 casos disponibles',
    icon: <StomachIcon />,
    colorBg: '#FFE4E6',
    colorFg: '#E11D48',
    active: true,
    cases: CASES,
  },
  {
    title: 'Neumología',
    desc: 'Enfermedades respiratorias agudas y crónicas.',
    count: '10 casos disponibles',
    icon: <Wind size={28} />,
    colorBg: '#E0F2FE',
    colorFg: '#0284C7',
    active: false,
    cases: [],
  },
  {
    title: 'Cardiología',
    desc: 'Urgencias cardiovasculares y enfermedades prevalentes.',
    count: '9 casos disponibles',
    icon: <Heart size={28} />,
    colorBg: '#FFEDD5',
    colorFg: '#EA580C',
    active: false,
    cases: [],
  },
  {
    title: 'Neurología',
    desc: 'Alteraciones neurológicas agudas y crónicas.',
    count: '8 casos disponibles',
    icon: <Brain size={28} />,
    colorBg: '#F3E8FF',
    colorFg: '#9333EA',
    active: false,
    cases: [],
  },
  {
    title: 'Nefrología',
    desc: 'Trastornos renales y electrolíticos.',
    count: '7 casos disponibles',
    icon: <Stethoscope size={28} />,
    colorBg: '#DCFCE7',
    colorFg: '#16A34A',
    active: false,
    cases: [],
  },
];

const TYPES = [
  {
    title: 'Casos de urgencias',
    desc: 'Presentaciones agudas que requieren diagnóstico y manejo inmediato.',
    count: '15 casos',
    icon: <Briefcase size={24} />,
    colorBg: '#E0F2FE',
    colorFg: '#0284C7',
  },
  {
    title: 'Casos ambulatorios',
    desc: 'Consultas programadas con evolución crónica o síntomas persistentes.',
    count: '18 casos',
    icon: <Calendar size={24} />,
    colorBg: '#DCFCE7',
    colorFg: '#16A34A',
  },
  {
    title: 'Casos pediátricos',
    desc: 'Pacientes pediátricos con patologías frecuentes y desafíos diagnósticos.',
    count: '10 casos',
    icon: <User size={24} />,
    colorBg: '#F3E8FF',
    colorFg: '#9333EA',
  },
  {
    title: 'Casos geriátricos',
    desc: 'Pacientes mayores con múltiples comorbilidades y síndromes geriátricos.',
    count: '9 casos',
    icon: <UserPlus size={24} />,
    colorBg: '#FFEDD5',
    colorFg: '#EA580C',
  },
  {
    title: 'Casos desafiantes',
    desc: 'Escenarios complejos con diagnósticos diferenciales de alta dificultad.',
    count: '12 casos',
    icon: <PlusCircle size={24} />,
    colorBg: '#E0F2FE',
    colorFg: '#0284C7',
  },
];

/* ── Module Detail View ─────────────────────────────────── */
function ModuleView({ module, onBack }: { module: ModuleInfo; onBack: () => void }) {
  const navigate = useNavigate();
  function goBack() {
    navigate('/casos');
    onBack();
  }
  const [search, setSearch] = useState('');

  const completedCount = module.cases.filter(c => c.status === 'completado').length;
  const availableCount = module.cases.filter(c => c.status === 'disponible').length;
  const inProgressCount = module.cases.filter(c => c.status === 'en_progreso').length;

  const filtered = module.cases.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="casos-mod-view">

      {/* Back nav */}
      <div className="casos-mod-back-row">
        <button className="casos-mod-back-btn" onClick={goBack}>
          <ArrowLeft size={16} />
          Casos
        </button>
        <span className="casos-mod-breadcrumb">{module.title}</span>
      </div>

      {/* Module header */}
      <div className="casos-mod-hero">
        <div className="casos-mod-hero-left">
          <div className="casos-mod-hero-icon" style={{ background: module.colorBg, color: module.colorFg }}>
            {module.icon}
          </div>
          <div>
            <h1 className="casos-mod-hero-title">{module.title}</h1>
            <p className="casos-mod-hero-desc">{module.desc}</p>
          </div>
        </div>
        <div className="casos-mod-stats">
          <div className="casos-mod-stat">
            <span className="casos-mod-stat-value" style={{ color: '#10B981' }}>{completedCount}</span>
            <span className="casos-mod-stat-label">Completados</span>
          </div>
          <div className="casos-mod-stat-divider" />
          <div className="casos-mod-stat">
            <span className="casos-mod-stat-value" style={{ color: '#F59E0B' }}>{inProgressCount}</span>
            <span className="casos-mod-stat-label">En progreso</span>
          </div>
          <div className="casos-mod-stat-divider" />
          <div className="casos-mod-stat">
            <span className="casos-mod-stat-value" style={{ color: '#0284C7' }}>{availableCount}</span>
            <span className="casos-mod-stat-label">Disponibles</span>
          </div>
        </div>
      </div>

      {/* No cases yet */}
      {module.cases.length === 0 ? (
        <div className="casos-mod-soon">
          <div className="casos-mod-soon-icon" style={{ background: module.colorBg, color: module.colorFg }}>
            {module.icon}
          </div>
          <h3>Próximamente</h3>
          <p>Los casos de {module.title} estarán disponibles en la siguiente actualización.</p>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="casos-mod-search">
            <Search size={16} className="casos-mod-search-icon" />
            <input
              className="casos-mod-search-input"
              placeholder="Buscar caso por nombre o etiqueta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Case grid */}
          <div className="casos-mod-grid">
            {filtered.map(c => {
              const dc = DIFFICULTY_COLOR[c.difficulty];
              const sc = STATUS_CONFIG[c.status];
              const StatusIcon = sc.icon;
              const locked = c.status === 'bloqueado';

              return (
                <div key={c.id} className={`casos-mod-card${locked ? ' locked' : ''}`}>
                  <div className="casos-mod-card-top">
                    <div className="casos-mod-card-status" style={{ background: sc.bg, color: sc.color }}>
                      <StatusIcon size={12} />
                      {sc.label}
                    </div>
                    {c.score !== null && (
                      <div className="casos-mod-card-score">{c.score} pts</div>
                    )}
                  </div>

                  <h3 className="casos-mod-card-title">{c.title}</h3>
                  <p className="casos-mod-card-scenario">{c.scenario}</p>

                  <div className="casos-mod-card-tags">
                    {c.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="casos-mod-card-tag">{tag}</span>
                    ))}
                  </div>

                  <div className="casos-mod-card-foot">
                    <div className="casos-mod-card-meta">
                      <span className="casos-mod-card-diff" style={{ background: dc.bg, color: dc.color }}>
                        {DIFFICULTY_LABEL[c.difficulty]}
                      </span>
                      <span className="casos-mod-card-time">
                        <Clock size={12} /> {c.time}
                      </span>
                    </div>

                    {locked ? (
                      <button className="casos-mod-start-btn locked" disabled>
                        <Lock size={14} /> Bloqueado
                      </button>
                    ) : c.status === 'completado' ? (
                      <button
                        className="casos-mod-start-btn done"
                        onClick={() => navigate('/simulacion')}
                      >
                        <CheckCircle size={14} /> Repetir
                      </button>
                    ) : (
                      <button
                        className="casos-mod-start-btn"
                        onClick={() => navigate('/simulacion')}
                      >
                        <Play size={14} /> {c.status === 'en_progreso' ? 'Continuar' : 'Iniciar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="casos-mod-no-results">
                <Search size={32} />
                <p>No se encontraron casos para "{search}"</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function CasosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedModule, setSelectedModule] = useState<ModuleInfo | null>(null);

  /* Sync with ?modulo= query param (set by Sidebar links) */
  useEffect(() => {
    const modulo = searchParams.get('modulo');
    if (modulo) {
      const found = MODULES.find(m => m.title === modulo) ?? null;
      setSelectedModule(found);
    } else {
      setSelectedModule(null);
    }
  }, [searchParams]);

  return (
    <div className="dash-root">
      <Sidebar />

      <div className="casos-page-wrapper">

        {selectedModule ? (
          <ModuleView module={selectedModule} onBack={() => setSelectedModule(null)} />
        ) : (
          <>
            {/* Header Title & Banner */}
            <div className="casos-pg-header">
              <div className="casos-pg-title-box">
                <h1>Elige un caso para comenzar</h1>
                <p>Seleccione un módulo o tipo de caso para iniciar una simulación clínica.</p>
              </div>

              <div className="casos-pg-banner">
                <div className="casos-pg-banner-icon"><Target size={24} /></div>
                <div className="casos-pg-banner-text">
                  <h4>Entrena tu razonamiento clínico</h4>
                  <p>Cada caso simula una experiencia real con pacientes virtuales.</p>
                </div>
              </div>
            </div>

            {/* Section: Explorar por módulo */}
            <div className="casos-pg-section">
              <h2 className="casos-pg-section-title">Explorar por módulo</h2>
              <div className="casos-pg-hscroll">
                {MODULES.map(m => (
                  <div
                    key={m.title}
                    className={`casos-pg-mod-card ${m.active ? 'active' : ''}`}
                    onClick={() => setSelectedModule(m)}
                  >
                    <div className="casos-pg-mod-icon" style={{ background: m.colorBg, color: m.colorFg }}>
                      {m.icon}
                    </div>
                    <h3 className="casos-pg-mod-title">{m.title}</h3>
                    <p className="casos-pg-mod-desc">{m.desc}</p>
                    <div className="casos-pg-mod-foot">
                      <span className="casos-pg-mod-count">{m.count}</span>
                      <div className="casos-pg-mod-arrow"><ChevronRight size={16} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Tipos de casos */}
            <div className="casos-pg-section">
              <h2 className="casos-pg-section-title">Tipos de casos</h2>
              <div className="casos-pg-hscroll">
                {TYPES.map(t => (
                  <div key={t.title} className="casos-pg-type-card">
                    <div className="casos-pg-type-head">
                      <div className="casos-pg-type-icon" style={{ background: t.colorBg, color: t.colorFg }}>
                        {t.icon}
                      </div>
                      <h3 className="casos-pg-type-title">{t.title}</h3>
                    </div>
                    <p className="casos-pg-type-desc">{t.desc}</p>
                    <span className="casos-pg-type-count">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Casos recomendados para ti */}
            <div className="casos-pg-section">
              <div className="casos-pg-section-header">
                <h2 className="casos-pg-section-title">Casos recomendados para ti</h2>
                <button className="casos-pg-link-btn" onClick={() => setSelectedModule(MODULES[0])}>Ver todos</button>
              </div>
              <div className="casos-pg-hscroll">
                {CASES.slice(0, 4).map((c, i) => {
                  const iconData = MODULES[i] || MODULES[0];
                  const dc = DIFFICULTY_COLOR[c.difficulty];
                  return (
                    <div key={c.id} className="casos-pg-rec-card" onClick={() => navigate('/simulacion')}>
                      <div className="casos-pg-rec-head">
                        <div className="casos-pg-rec-icon" style={{ background: iconData.colorBg, color: iconData.colorFg }}>
                          {iconData.icon}
                        </div>
                        <h3 className="casos-pg-rec-title">{c.title}</h3>
                      </div>
                      <div className="casos-pg-rec-foot">
                        <span className="casos-pg-rec-diff" style={{ background: dc.bg, color: dc.color }}>
                          {DIFFICULTY_LABEL[c.difficulty]}
                        </span>
                        <span className="casos-pg-rec-time"><Clock size={12}/> {c.time}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer info */}
            <div className="casos-pg-footer-banner">
              <Info size={18} className="casos-pg-footer-icon" />
              <p>Todos los casos son simulaciones educativas basadas en guías clínicas y evidencia actualizada.</p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
