import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Clock, Info,
  ChevronRight, Download, BarChart2,
  Check, AlertCircle, Target, Star, ClipboardCheck,
  Brain, Heart, Wind, Stethoscope
} from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';

/* ── Types ─────────────────────────────────────────────── */
interface Session {
  id: number;
  caseTitle: string;
  specialty: string;
  difficulty: 1 | 2 | 3;
  date: string;        // ISO
  timeStr: string;
  score: number;
  timeMin: number;
  biases: number;
  stage: 1 | 2 | 3 | 4 | 5 | 6;
  completed: boolean;
}

/* ── Data ───────────────────────────────────────────────── */
// Updated to match the design (adding difficulty and fixing specialty names)
const SESSIONS: Session[] = [
  {
    id: 1,
    caseTitle: 'Dolor abdominal agudo en paciente joven',
    specialty: 'Gastroenterología',
    difficulty: 1,
    date: '2025-05-18T11:32:00',
    timeStr: '11:32 a. m.',
    score: 80, timeMin: 16, biases: 0, stage: 6, completed: true,
  },
  {
    id: 2,
    caseTitle: 'Disnea progresiva en adulto mayor',
    specialty: 'Neumología',
    difficulty: 2,
    date: '2025-05-16T09:15:00',
    timeStr: '09:15 a. m.',
    score: 65, timeMin: 22, biases: 1, stage: 6, completed: true,
  },
  {
    id: 3,
    caseTitle: 'Dolor torácico atípico en mujer de 45 años',
    specialty: 'Cardiología',
    difficulty: 3,
    date: '2025-05-14T16:47:00',
    timeStr: '04:47 p. m.',
    score: 70, timeMin: 28, biases: 0, stage: 6, completed: true,
  },
  {
    id: 4,
    caseTitle: 'Cefalea súbita y déficit neurológico',
    specialty: 'Neurología',
    difficulty: 3,
    date: '2025-05-12T14:03:00',
    timeStr: '02:03 p. m.',
    score: 60, timeMin: 24, biases: 2, stage: 6, completed: true,
  },
  {
    id: 5,
    caseTitle: 'Hematuria indolora en paciente adulto',
    specialty: 'Nefrología',
    difficulty: 1,
    date: '2025-05-10T10:11:00',
    timeStr: '10:11 a. m.',
    score: 90, timeMin: 14, biases: 0, stage: 6, completed: true,
  },
  {
    id: 6,
    caseTitle: 'Fiebre y pérdida de peso en adulto joven',
    specialty: 'Casos de urgencias',
    difficulty: 2,
    date: '2025-05-08T08:50:00',
    timeStr: '08:50 a. m.',
    score: 75, timeMin: 19, biases: 1, stage: 6, completed: true,
  },
  // Add some extra to show pagination info correctly
  {
    id: 7,
    caseTitle: 'Hemorragia digestiva alta no variceal',
    specialty: 'Gastroenterología',
    difficulty: 2,
    date: '2025-05-01T15:30:00',
    timeStr: '03:30 p. m.',
    score: 85, timeMin: 32, biases: 0, stage: 6, completed: true,
  },
  {
    id: 8,
    caseTitle: 'Pancreatitis aguda leve',
    specialty: 'Gastroenterología',
    difficulty: 2,
    date: '2025-04-28T10:00:00',
    timeStr: '10:00 a. m.',
    score: 95, timeMin: 20, biases: 0, stage: 6, completed: true,
  },
  {
    id: 9,
    caseTitle: 'Síndrome de intestino irritable',
    specialty: 'Gastroenterología',
    difficulty: 1,
    date: '2025-04-20T14:20:00',
    timeStr: '02:20 p. m.',
    score: 100, timeMin: 15, biases: 0, stage: 6, completed: true,
  },
  {
    id: 10,
    caseTitle: 'Tromboembolismo pulmonar',
    specialty: 'Neumología',
    difficulty: 3,
    date: '2025-04-15T09:45:00',
    timeStr: '09:45 a. m.',
    score: 60, timeMin: 40, biases: 2, stage: 6, completed: true,
  },
  {
    id: 11,
    caseTitle: 'Meningitis bacteriana aguda',
    specialty: 'Neurología',
    difficulty: 3,
    date: '2025-04-10T11:15:00',
    timeStr: '11:15 a. m.',
    score: 55, timeMin: 45, biases: 3, stage: 6, completed: true,
  },
  {
    id: 12,
    caseTitle: 'Úlcera péptica por uso de AINEs',
    specialty: 'Gastroenterología',
    difficulty: 1,
    date: '2025-04-05T16:00:00',
    timeStr: '04:00 p. m.',
    score: 88, timeMin: 22, biases: 0, stage: 6, completed: true,
  }
];

const SPECIALTIES = ['Todos', ...Array.from(new Set(SESSIONS.map(s => s.specialty))).sort()];

function fmtDate(iso: string) {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleDateString('es-CO', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

const DIFFICULTY_LABEL: Record<number, string> = { 1: 'Básico', 2: 'Intermedio', 3: 'Avanzado' };
const DIFFICULTY_COLOR: Record<number, { bg: string; color: string }> = {
  1: { bg: '#E6F6EC', color: '#10B981' }, // Verde
  2: { bg: '#FFF7E6', color: '#F59E0B' }, // Naranja
  3: { bg: '#FEE2E2', color: '#EF4444' }, // Rojo
};

const SPEC_COLORS: Record<string, { bg: string; color: string }> = {
  'Gastroenterología': { bg: '#FFE4E6', color: '#E11D48' },
  'Neumología': { bg: '#E0F2FE', color: '#0284C7' },
  'Cardiología': { bg: '#FFEDD5', color: '#EA580C' },
  'Neurología': { bg: '#F3E8FF', color: '#9333EA' },
  'Nefrología': { bg: '#DCFCE7', color: '#16A34A' },
  'Casos de urgencias': { bg: '#E0F2FE', color: '#0284C7' },
};

// SVG Icons for organs
const StomachIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6c0-2.2-1.8-4-4-4s-4 1.8-4 4c0 1.1-.9 2-2 2H6c-1.1 0-2 .9-2 2v2c0 3.3 2.7 6 6 6h4c2.2 0 4-1.8 4-4V6z"/>
    <path d="M12 18v2c0 1.1.9 2 2 2h4"/>
  </svg>
);
const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

function getSpecIcon(spec: string) {
  if (spec === 'Gastroenterología') return <StomachIcon />;
  if (spec === 'Neumología') return <Wind size={22} />;
  if (spec === 'Cardiología') return <Heart size={22} />;
  if (spec === 'Neurología') return <Brain size={22} />;
  if (spec === 'Nefrología') return <Stethoscope size={22} />;
  if (spec === 'Casos de urgencias') return <UserIcon />;
  return <StomachIcon />;
}

/* ── Session row ────────────────────────────────────────── */
function SessionRow({ s, delay }: { s: Session; delay: number }) {
  const dc = DIFFICULTY_COLOR[s.difficulty];
  const spC = SPEC_COLORS[s.specialty] || SPEC_COLORS['Gastroenterología'];
  const icon = getSpecIcon(s.specialty);
  
  const isCorrect = s.score >= 70;

  return (
    <motion.div
      className="hist-table-row"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: 'easeOut' as const }}
    >
      <div className="hist-td hist-td-caso">
        <div className="hist-td-icon" style={{ background: spC.bg, color: spC.color }}>
          {icon}
        </div>
        <span className="hist-td-title">{s.caseTitle}</span>
      </div>
      
      <div className="hist-td hist-td-mod">
        <span className="hist-td-tag" style={{ color: spC.color, background: spC.bg }}>
          {s.specialty}
        </span>
      </div>
      
      <div className="hist-td hist-td-diff">
        <span className="hist-td-tag" style={{ color: dc.color, background: dc.bg }}>
          {DIFFICULTY_LABEL[s.difficulty]}
        </span>
      </div>
      
      <div className="hist-td hist-td-date">
        <span>{fmtDate(s.date)}</span>
        <span className="hist-td-time-sub">{s.timeStr}</span>
      </div>
      
      <div className="hist-td hist-td-time">
        {s.timeMin} min
      </div>
      
      <div className="hist-td hist-td-acc">
        <span className="hist-acc-val">{s.score}%</span>
        <div className="hist-acc-track">
          <motion.div 
            className="hist-acc-fill" 
            style={{ 
              width: `${s.score}%`, 
              background: isCorrect ? '#10B981' : '#F59E0B' 
            }} 
            initial={{ width: 0 }}
            animate={{ width: `${s.score}%` }}
            transition={{ duration: 0.6, delay: delay + 0.1 }}
          />
        </div>
      </div>
      
      <div className="hist-td hist-td-res">
        {isCorrect ? (
          <div className="hist-res-badge hist-res-ok">
            <Check size={14} strokeWidth={3} /> Correcto
          </div>
        ) : (
          <div className="hist-res-badge hist-res-warn">
            <AlertCircle size={14} strokeWidth={2.5} /> Parcial
          </div>
        )}
      </div>
      
      <div className="hist-td hist-td-act">
        <button className="hist-act-btn-text">Ver detalle</button>
        <button className="hist-act-btn-icon"><BarChart2 size={16} /></button>
      </div>
    </motion.div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function HistorialPage() {
  const [query, setQuery] = useState('');
  const [spec, setSpec] = useState('Todos');

  const filtered = useMemo(() => SESSIONS.filter(s => {
    const q = query.toLowerCase();
    const matchQ    = !q || s.caseTitle.toLowerCase().includes(q) || s.specialty.toLowerCase().includes(q);
    const matchSpec = spec === 'Todos' || s.specialty === spec;
    return matchQ && matchSpec;
  }), [query, spec]);
  
  const displayed = filtered.slice(0, 6); // Mock pagination to match design (showing 6 items)

  return (
    <div className="dash-root">
      <Sidebar />

      <div className="hist-page-wrapper">
        
        {/* ── Header ── */}
        <div className="hist-pg-header">
          <div className="hist-pg-title-box">
            <h1>Historial de casos clínicos</h1>
            <p>Revisa tu desempeño en los casos que has completado.</p>
          </div>
          
          <div className="hist-pg-stats">
            <div className="hist-pg-stat-card">
              <div className="hist-pg-stat-icon" style={{ color: '#10B981', background: '#E6F6EC' }}>
                <ClipboardCheck size={20} />
              </div>
              <div className="hist-pg-stat-info">
                <span className="hist-pg-stat-lbl">Casos completados</span>
                <span className="hist-pg-stat-val">12</span>
              </div>
            </div>
            
            <div className="hist-pg-stat-card">
              <div className="hist-pg-stat-icon" style={{ color: '#0284C7', background: '#E0F2FE' }}>
                <Target size={20} />
              </div>
              <div className="hist-pg-stat-info">
                <span className="hist-pg-stat-lbl">Accuracy diagnóstica</span>
                <span className="hist-pg-stat-val">73%</span>
              </div>
            </div>
            
            <div className="hist-pg-stat-card">
              <div className="hist-pg-stat-icon" style={{ color: '#4F46E5', background: '#E0E7FF' }}>
                <Clock size={20} />
              </div>
              <div className="hist-pg-stat-info">
                <span className="hist-pg-stat-lbl">Tiempo promedio</span>
                <span className="hist-pg-stat-val">18 min</span>
              </div>
            </div>
            
            <div className="hist-pg-stat-card">
              <div className="hist-pg-stat-icon" style={{ color: '#10B981', background: '#E6F6EC' }}>
                <Star size={20} />
              </div>
              <div className="hist-pg-stat-info">
                <span className="hist-pg-stat-lbl">Racha actual</span>
                <span className="hist-pg-stat-val">5 casos</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="hist-pg-filters">
          <div className="hist-filter-group">
            <div className="hist-filter-item">
              <label>Estado</label>
              <select className="hist-select-input">
                <option>Completados</option>
                <option>En progreso</option>
              </select>
            </div>
            <div className="hist-filter-item">
              <label>Módulo</label>
              <select className="hist-select-input" value={spec} onChange={e => setSpec(e.target.value)}>
                {SPECIALTIES.map(sp => <option key={sp}>{sp}</option>)}
              </select>
            </div>
            <div className="hist-filter-item">
              <label>Dificultad</label>
              <select className="hist-select-input">
                <option>Todos</option>
                <option>Básico</option>
                <option>Intermedio</option>
                <option>Avanzado</option>
              </select>
            </div>
            <div className="hist-filter-item">
              <label>Fecha</label>
              <select className="hist-select-input">
                <option>Últimos 3 meses</option>
                <option>Último mes</option>
                <option>Este año</option>
              </select>
            </div>
          </div>
          
          <div className="hist-filter-actions">
            <div className="hist-search-box">
              <Search size={16} className="hist-search-icon" />
              <input 
                type="text" 
                placeholder="Buscar caso..." 
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button className="hist-export-btn">
              <Download size={16} /> Exportar
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="hist-table-container">
          <div className="hist-table-header">
            <div className="hist-th hist-th-caso">Caso</div>
            <div className="hist-th hist-th-mod">Módulo</div>
            <div className="hist-th hist-th-diff">Dificultad</div>
            <div className="hist-th hist-th-date">Fecha de finalización</div>
            <div className="hist-th hist-th-time">Tiempo empleado</div>
            <div className="hist-th hist-th-acc">Accuracy</div>
            <div className="hist-th hist-th-res">Resultado</div>
            <div className="hist-th hist-th-act">Acciones</div>
          </div>
          
          <div className="hist-table-body">
            {displayed.length > 0 ? (
              displayed.map((s, i) => <SessionRow key={s.id} s={s} delay={i * 0.05} />)
            ) : (
              <div className="hist-empty-state">
                <p>No hay sesiones con esos filtros.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pagination ── */}
        <div className="hist-pagination-bar">
          <span className="hist-page-info">Mostrando {displayed.length} de {filtered.length} casos</span>
          <div className="hist-page-controls">
            <button className="hist-page-btn hist-page-btn-icon"><ChevronRight size={16} style={{transform: 'rotate(180deg)'}} /></button>
            <button className="hist-page-btn hist-page-btn-active">1</button>
            <button className="hist-page-btn">2</button>
            <button className="hist-page-btn hist-page-btn-icon"><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* ── Footer Banner ── */}
        <div className="hist-footer-banner">
          <div className="hist-fb-left">
            <div className="hist-fb-icon"><Info size={20} /></div>
            <div className="hist-fb-text">
              <h4>¿Quieres mejorar tu desempeño?</h4>
              <p>Revisa los casos con resultado parcial para identificar oportunidades de mejora.</p>
            </div>
          </div>
          <button className="hist-fb-btn">
            Ver recomendaciones <ChevronRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
