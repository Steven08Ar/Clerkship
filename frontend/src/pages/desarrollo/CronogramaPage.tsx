import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Cpu, CheckCircle2, Circle, Save,
  Check, UserCheck, Code2, Database, ShieldCheck, Sparkles, Layers
} from 'lucide-react';
import InteractiveBackgroundCanvas from '../../components/shared/InteractiveBackgroundCanvas';
import logoUrl from '../../assets/Logo Clerkship.svg';
import {
  CRONOGRAMA_ACTIVIDADES,
  TECH_CATALOG,
  TEAM_MEMBERS
} from '../../data/cronogramaData';
import type { CronogramaItem } from '../../data/cronogramaData';
import '../../styles/cronograma.css';

const TECH_STORAGE_KEY = 'clerkship_tech_selections_v1';
const CRON_STORAGE_KEY = 'clerkship_cron_states_v1';

export default function CronogramaPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'cronograma' | 'tech'>('cronograma');

  /* ── 1. ESTADO DE TECNOLOGÍAS ────────────────────────────── */
  const [selectedMemberId, setSelectedMemberId] = useState<string>('santiago');
  const [techSelections, setTechSelections] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(TECH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      santiago: ['unsloth', 'huggingface_trl', 'pytorch', 'qlora', 'spacy', 'bioc', 'lm_harness', 'jsonl', 'embeddings'],
      steven: ['python', 'flask', 'langgraph', 'pydantic', 'openapi', 'postgresql', 'sse', 'jwt_cors', 'locust', 'iso27001'],
      equipo_unab: ['react', 'typescript', 'vite', 'framer_motion', 'lucide', 'jwt_cors'],
    };
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  function toggleTech(techId: string) {
    setTechSelections(prev => {
      const currentList = prev[selectedMemberId] || [];
      const updatedList = currentList.includes(techId)
        ? currentList.filter(id => id !== techId)
        : [...currentList, techId];
      return { ...prev, [selectedMemberId]: updatedList };
    });
    setSaveSuccess(false);
  }

  function handleSaveTech() {
    localStorage.setItem(TECH_STORAGE_KEY, JSON.stringify(techSelections));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  }

  /* ── 2. ESTADO DE CRONOGRAMA ──────────────────────────────── */
  const [activeCronFilter, setActiveCronFilter] = useState<'general' | 'p2' | 'p1'>('general');
  const [cronStates, setCronStates] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(CRON_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    const initial: Record<string, boolean> = {};
    CRONOGRAMA_ACTIVIDADES.forEach(item => {
      initial[item.id] = !!item.completadoDefault;
    });
    return initial;
  });

  function toggleActivityStatus(actId: string) {
    setCronStates(prev => {
      const updated = { ...prev, [actId]: !prev[actId] };
      localStorage.setItem(CRON_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  /* ── Filtrado y Cálculo de Métricas ────────────────────────── */
  const filteredActivities = useMemo(() => {
    if (activeCronFilter === 'p2') {
      return CRONOGRAMA_ACTIVIDADES.filter(a => a.area === 'P2' || a.area === 'Ambos');
    }
    if (activeCronFilter === 'p1') {
      return CRONOGRAMA_ACTIVIDADES.filter(a => a.area === 'P1' || a.area === 'Ambos');
    }
    return CRONOGRAMA_ACTIVIDADES;
  }, [activeCronFilter]);

  const stats = useMemo(() => {
    const total = filteredActivities.length;
    const doneCount = filteredActivities.filter(a => !!cronStates[a.id]).length;
    const pendingCount = total - doneCount;
    const percentage = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    return { total, doneCount, pendingCount, percentage };
  }, [filteredActivities, cronStates]);

  // Group activities by week for timeline layout
  const groupedWeeks = useMemo(() => {
    const map = new Map<number, { semanaNombre: string; items: CronogramaItem[] }>();
    filteredActivities.forEach(act => {
      if (!map.has(act.semana)) {
        map.set(act.semana, { semanaNombre: act.semanaNombre, items: [] });
      }
      map.get(act.semana)!.items.push(act);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredActivities]);

  const activeMemberObj = TEAM_MEMBERS.find(m => m.id === selectedMemberId) || TEAM_MEMBERS[0];

  return (
    <div
      className="crono-standalone-root"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      {/* Fondo Interactivo */}
      <InteractiveBackgroundCanvas />

      {/* ── Navbar idéntico a Landing / Home / Proyecto ── */}
      <nav className="lp-nav">
        <div className="lp-nav-left">
          <button className="lp-logo" onClick={() => navigate('/')}>
            <img src={logoUrl} alt="Clerkship" className="lp-logo-img" />
            Clerkship
          </button>
        </div>

        <div className="lp-navlinks-wrap">
          <div className="lp-navlinks">
            <button className="lp-navlink" onClick={() => navigate('/')}>Inicio</button>
            <button className="lp-navlink" onClick={() => navigate('/casos')}>Casos clínicos</button>
            <button className="lp-navlink" onClick={() => navigate('/proyecto')}>Cómo funciona</button>
            <button className="lp-navlink lp-navlink-on" onClick={() => navigate('/cronograma')}>Cronograma</button>
          </div>
        </div>

        <div className="lp-nav-actions">
          <div className="lp-lang-toggle">
            <span className="lp-lang-on">ES</span>
            <div className="lp-lang-switch"></div>
          </div>
          <button className="lp-btn-outline" onClick={() => navigate('/login')}>Ingresar</button>
          <button className="lp-btn-solid" onClick={() => navigate('/register')}>Registrarse</button>
        </div>
      </nav>

      {/* ── Cuerpo Principal ── */}
      <main className="crono-standalone-body">
        {/* Header Hero */}
        <div className="crono-hero-box">
          <span className="crono-badge">
            <Sparkles size={14} /> PROYECTO DE GRADO · ENTORNO DE DESARROLLO
          </span>
          <h1 className="crono-title">Cronograma del Proyecto & Definición Técnica</h1>
          <p className="crono-subtitle">
            Hoja de ruta interactiva de 16 semanas y cuestionario de definición técnica del equipo.
          </p>
        </div>

        {/* Pestañas Principales (Roadmap vs Stack Tecnológico) */}
        <div className="crono-tabs-wrap">
          <button
            className={`crono-tab-btn${activeTab === 'cronograma' ? ' active' : ''}`}
            onClick={() => setActiveTab('cronograma')}
          >
            <Calendar size={18} /> Cronograma (16 Semanas)
          </button>
          <button
            className={`crono-tab-btn${activeTab === 'tech' ? ' active' : ''}`}
            onClick={() => setActiveTab('tech')}
          >
            <Cpu size={18} /> Tecnologías / Responsabilidades
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
           PESTAÑA 1: CRONOGRAMA ROADMAP TIMELINE
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'cronograma' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Resumen de Progreso Top Banner */}
            <div className="crono-progress-card">
              <div className="crono-prog-head">
                <div>
                  <h2 className="crono-prog-title">Progreso General del Proyecto</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                    Porcentaje calculado en vivo según tareas realizadas ({stats.doneCount} de {stats.total} actividades)
                  </p>
                </div>
                <div className="crono-prog-stats">
                  <div className="crono-stat-pill total">Total: {stats.total}</div>
                  <div className="crono-stat-pill done">✓ Realizadas: {stats.doneCount}</div>
                  <div className="crono-stat-pill pending">○ Pendientes: {stats.pendingCount}</div>
                  <div className="crono-stat-pill done" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                    {stats.percentage}% Completado
                  </div>
                </div>
              </div>

              <div className="crono-prog-bar-track">
                <div className="crono-prog-bar-fill" style={{ width: `${stats.percentage}%` }} />
              </div>
            </div>

            {/* Filtros de Vista (General, Backend P2, Frontend P1) */}
            <div className="crono-filter-wrap">
              <div className="crono-sub-filter-group">
                <button
                  className={`crono-sub-filter-btn${activeCronFilter === 'general' ? ' active' : ''}`}
                  onClick={() => setActiveCronFilter('general')}
                >
                  Vista General (Todas)
                </button>
                <button
                  className={`crono-sub-filter-btn${activeCronFilter === 'p2' ? ' active' : ''}`}
                  onClick={() => setActiveCronFilter('p2')}
                >
                  Backend / Agentes (P2)
                </button>
                <button
                  className={`crono-sub-filter-btn${activeCronFilter === 'p1' ? ' active' : ''}`}
                  onClick={() => setActiveCronFilter('p1')}
                >
                  Frontend / Datos (P1)
                </button>
              </div>

              <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                Mostrando {filteredActivities.length} actividades
              </span>
            </div>

            {/* Timeline Roadmap Vertical */}
            <div className="crono-timeline-roadmap">
              {groupedWeeks.map(([semanaNum, group]) => {
                const weekDoneCount = group.items.filter(i => !!cronStates[i.id]).length;
                const isAllDone = weekDoneCount === group.items.length;

                return (
                  <div key={semanaNum} className="crono-timeline-block">
                    {/* Node Marker */}
                    <div className={`crono-timeline-marker${isAllDone ? ' all-done' : ''}`}>
                      {isAllDone && <Check size={14} />}
                    </div>

                    {/* Timeline Card */}
                    <div className="crono-timeline-card">
                      <div className="crono-timeline-header">
                        <h3 className="crono-week-name">{group.semanaNombre}</h3>
                        <span className="crono-week-counter">
                          {weekDoneCount} / {group.items.length} tareas realizadas
                        </span>
                      </div>

                      <div className="crono-act-list">
                        {group.items.map(act => {
                          const isDone = !!cronStates[act.id];

                          return (
                            <div key={act.id} className="crono-act-item">
                              <div className="crono-act-left-block">
                                <span className={`crono-area-tag ${act.area.toLowerCase()}`}>
                                  {act.area === 'P1' ? 'P1 Datos/IA' : act.area === 'P2' ? 'P2 Agentes' : 'Ambos'}
                                </span>
                                <div className="crono-act-info">
                                  <span className="crono-act-title">
                                    {act.actividad}
                                    {act.esEntregable && (
                                      <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 4, fontWeight: 800 }}>
                                        📦 Entregable clave
                                      </span>
                                    )}
                                  </span>
                                  <div className="crono-act-meta-row">
                                    <span>Responsable: <strong>{act.responsableDefault}</strong></span>
                                    <span>•</span>
                                    <span>Entrega: {act.fechaEstimada}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                className={`crono-status-btn ${isDone ? 'done' : 'pending'}`}
                                onClick={() => toggleActivityStatus(act.id)}
                                title="Haz clic para cambiar estado real de cumplimiento"
                              >
                                {isDone ? (
                                  <>
                                    <CheckCircle2 size={16} /> ✓ Realizado
                                  </>
                                ) : (
                                  <>
                                    <Circle size={16} /> ○ Pendiente
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════
           PESTAÑA 2: TECNOLOGÍAS / RESPONSABILIDADES
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'tech' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="tech-container">
              {/* Selector de Integrante */}
              <div className="tech-member-bar">
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#334155' }}>
                  <UserCheck size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Seleccionar Integrante:
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TEAM_MEMBERS.map(m => (
                    <button
                      key={m.id}
                      className={`tech-member-pill${selectedMemberId === m.id ? ' active' : ''}`}
                      onClick={() => setSelectedMemberId(m.id)}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: selectedMemberId === m.id ? '#FFFFFF' : m.avatarColor
                        }}
                      />
                      {m.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mensaje Informativo */}
              <div style={{ marginBottom: 28, padding: '16px 20px', background: '#F0F7FF', borderRadius: 14, border: '1px solid #BFDBFE' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E40AF', fontWeight: 600 }}>
                  Definiendo stack para: <strong>{activeMemberObj.nombre}</strong> ({activeMemberObj.rol})
                </p>
              </div>

              {/* Grid por Categorías */}
              {(['Backend', 'IA', 'Frontend', 'BaseDatos', 'Seguridad'] as const).map(cat => {
                const catItems = TECH_CATALOG.filter(t => t.categoria === cat);
                if (catItems.length === 0) return null;

                const catTitles: Record<string, { label: string; icon: any }> = {
                  Backend: { label: 'Backend & API (P2 Agentes)', icon: Code2 },
                  IA: { label: 'IA, Fine-Tuning & NLP (P1 Datos)', icon: Cpu },
                  Frontend: { label: 'Frontend & Experiencia de Usuario', icon: Layers },
                  BaseDatos: { label: 'Persistencia & Almacenamiento', icon: Database },
                  Seguridad: { label: 'Seguridad & Cumplimiento', icon: ShieldCheck },
                };

                const IconComponent = catTitles[cat].icon;

                return (
                  <div key={cat} className="tech-cat-section">
                    <h3 className="tech-cat-header">
                      <IconComponent size={20} style={{ color: '#1976D2' }} />
                      {catTitles[cat].label}
                    </h3>
                    <div className="tech-card-grid">
                      {catItems.map(tech => {
                        const isSelected = (techSelections[selectedMemberId] || []).includes(tech.id);
                        return (
                          <div
                            key={tech.id}
                            className={`tech-select-card${isSelected ? ' selected' : ''}`}
                            onClick={() => toggleTech(tech.id)}
                          >
                            <div className="tech-select-title">
                              <span>{tech.nombre}</span>
                              {isSelected ? (
                                <CheckCircle2 size={18} style={{ color: '#1976D2' }} />
                              ) : (
                                <Circle size={18} style={{ color: '#94A3B8' }} />
                              )}
                            </div>
                            <p className="tech-select-desc">{tech.descripcionDefault}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Botón de Acción */}
              <div className="tech-action-bar">
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Check size={18} /> ¡Configuración guardada exitosamente!
                    </motion.span>
                  )}
                </AnimatePresence>

                <button className="tech-submit-btn" onClick={handleSaveTech}>
                  <Save size={18} /> Guardar Configuración de Tecnologías
                </button>
              </div>

              {/* Resumen de Tecnologías Asignadas */}
              <div className="tech-summary-grid">
                {TEAM_MEMBERS.map(m => {
                  const memberTechIds = techSelections[m.id] || [];
                  const memberTechObjs = TECH_CATALOG.filter(t => memberTechIds.includes(t.id));

                  return (
                    <div key={m.id} className="tech-summary-box">
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>
                        {m.nombre}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 14px' }}>
                        {m.rol}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {memberTechObjs.length > 0 ? (
                          memberTechObjs.map(t => (
                            <span key={t.id} style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: '#E3F2FD', color: '#0D47A1' }}>
                              {t.nombre}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontStyle: 'italic' }}>
                            Sin tecnologías seleccionadas.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* ── Footer Idéntico a Landing ── */}
      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <div className="lp-footer-logo-row">
              <img src={logoUrl} alt="Clerkship" className="lp-footer-logo-img" />
              <span className="lp-footer-brand-title">Clerkship</span>
            </div>
            <p className="lp-footer-brand-desc">
              Plataforma de Simulación Clínica basada en IA Agéntica para el
              desarrollo de razonamiento diagnóstico y mitigación de sesgos.
            </p>
          </div>

          <div className="lp-footer-nav">
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Plataforma</h4>
              <a href="/" className="lp-footer-link">Inicio</a>
              <a href="/casos" className="lp-footer-link">Casos clínicos</a>
              <a href="/proyecto" className="lp-footer-link">Cómo funciona</a>
              <a href="/cronograma" className="lp-footer-link">Cronograma</a>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Equipo</h4>
              <a href="/equipo/desarrolladores" className="lp-footer-link">Desarrolladores</a>
              <a href="/equipo/direccion" className="lp-footer-link">Dirección de proyecto</a>
              <a href="/equipo/institucion" className="lp-footer-link">Institución</a>
            </div>

            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Legal</h4>
              <a href="/legal/terminos" className="lp-footer-link">Términos de uso</a>
              <a href="/legal/privacidad" className="lp-footer-link">Tratamiento de datos</a>
              <a href="/legal/licencia" className="lp-footer-link">Licencia de software</a>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p className="lp-footer-copy">
            © {new Date().getFullYear()} Clerkship · Prototipo de Investigación Clínica. Universidad Autónoma de Bucaramanga (UNAB).
          </p>
        </div>
      </footer>
    </div>
  );
}
