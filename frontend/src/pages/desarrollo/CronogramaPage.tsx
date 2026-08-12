import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Cpu, CheckCircle2, Circle, Save,
  Check, UserCheck, Code2, Database, ShieldCheck, Sparkles, Layers
} from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
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
  const [activeTab, setActiveTab] = useState<'tech' | 'cronograma'>('tech');

  /* ── 1. ESTADO DE TECNOLOGÍAS ────────────────────────────── */
  const [selectedMemberId, setSelectedMemberId] = useState<string>('santiago');
  const [techSelections, setTechSelections] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(TECH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial tech selections per member
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
    // Initial states from cronogramaData
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

  // Group activities by week
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
    <div className="crono-root">
      <Sidebar />

      <div className="crono-body">
        {/* Top Header */}
        <div className="crono-header-box">
          <span className="crono-top-tag">
            <Sparkles size={12} /> PROYECTO DE GRADO · ENTORNO DE DESARROLLO
          </span>
          <h1 className="crono-title">Definición Técnica y Cronograma</h1>
          <p className="crono-subtitle">
            Cuestionario de asignación de stack tecnológico por responsable y seguimiento
            semana a semana del avance real del proyecto (Semana 1 a 16).
          </p>
        </div>

        {/* Pestañas Principales */}
        <div className="crono-main-tabs">
          <button
            className={`crono-main-tab-btn${activeTab === 'tech' ? ' active' : ''}`}
            onClick={() => setActiveTab('tech')}
          >
            <Cpu size={18} /> Tecnologías / Responsabilidades
          </button>
          <button
            className={`crono-main-tab-btn${activeTab === 'cronograma' ? ' active' : ''}`}
            onClick={() => setActiveTab('cronograma')}
          >
            <Calendar size={18} /> Cronograma (16 Semanas)
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
           PESTAÑA 1: TECNOLOGÍAS / RESPONSABILIDADES
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'tech' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tech-section-wrap">
              {/* Selector de Integrante */}
              <div className="tech-member-selector">
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#334155' }}>
                  <UserCheck size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Selecciona Integrante Responsable:
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {TEAM_MEMBERS.map(m => (
                    <button
                      key={m.id}
                      className={`tech-member-btn${selectedMemberId === m.id ? ' active' : ''}`}
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

              {/* Mensaje descriptivo */}
              <div style={{ marginBottom: 24, padding: '14px 18px', background: '#F0F7FF', borderRadius: 12, border: '1px solid #BFDBFE' }}>
                <p style={{ margin: 0, fontSize: '0.88rem', color: '#1E40AF', fontWeight: 600 }}>
                  Configurando stack para: <strong>{activeMemberObj.nombre}</strong> ({activeMemberObj.rol})
                </p>
              </div>

              {/* Cuestionario por Categorías */}
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
                  <div key={cat} className="tech-category-box">
                    <h3 className="tech-cat-title">
                      <IconComponent size={18} style={{ color: '#1976D2' }} />
                      {catTitles[cat].label}
                    </h3>
                    <div className="tech-grid">
                      {catItems.map(tech => {
                        const isSelected = (techSelections[selectedMemberId] || []).includes(tech.id);
                        return (
                          <div
                            key={tech.id}
                            className={`tech-card${isSelected ? ' selected' : ''}`}
                            onClick={() => toggleTech(tech.id)}
                          >
                            <div className="tech-card-head">
                              <span className="tech-card-name">{tech.nombre}</span>
                              {isSelected ? (
                                <CheckCircle2 size={18} style={{ color: '#1976D2' }} />
                              ) : (
                                <Circle size={18} style={{ color: '#94A3B8' }} />
                              )}
                            </div>
                            <p className="tech-card-desc">{tech.descripcionDefault}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Botón de Guardado */}
              <div className="tech-save-bar">
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Check size={16} /> ¡Configuración guardada exitosamente!
                    </motion.span>
                  )}
                </AnimatePresence>

                <button className="tech-save-btn" onClick={handleSaveTech}>
                  <Save size={16} /> Guardar Configuración de Tecnologías
                </button>
              </div>

              {/* Resumen General de Tecnologías Asignadas */}
              <div style={{ marginTop: 40, paddingTop: 28, borderTop: '2px dashed #E2E8F0' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: 14 }}>
                  Resumen de Tecnologías Asignadas por Integrante
                </h3>
                <div className="tech-summary-grid">
                  {TEAM_MEMBERS.map(m => {
                    const memberTechIds = techSelections[m.id] || [];
                    const memberTechObjs = TECH_CATALOG.filter(t => memberTechIds.includes(t.id));

                    return (
                      <div key={m.id} className="tech-summary-card">
                        <h4 className="tech-summary-name">{m.nombre}</h4>
                        <p className="tech-summary-rol">{m.rol}</p>

                        <div className="tech-pill-wrap">
                          {memberTechObjs.length > 0 ? (
                            memberTechObjs.map(t => (
                              <span key={t.id} className="tech-pill">
                                {t.nombre}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>
                              Sin tecnologías seleccionadas aún.
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════
           PESTAÑA 2: CRONOGRAMA COMPLETO (16 SEMANAS)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'cronograma' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Resumen de Progreso Superior */}
            <div className="crono-progress-card">
              <div className="crono-prog-top">
                <div>
                  <h2 className="crono-prog-title">Progreso del Proyecto</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                    Avance basado en actividades marcadas como realizadas ({stats.doneCount} de {stats.total})
                  </p>
                </div>
                <div className="crono-prog-stats">
                  <div className="crono-stat-badge total">Total: {stats.total}</div>
                  <div className="crono-stat-badge done">✓ Realizadas: {stats.doneCount}</div>
                  <div className="crono-stat-badge pending">○ Pendientes: {stats.pendingCount}</div>
                </div>
              </div>

              <div className="crono-prog-bar-wrap">
                <div className="crono-prog-bar-fill" style={{ width: `${stats.percentage}%` }} />
              </div>
            </div>

            {/* Filtros de Área (General, Backend, Frontend/Datos) */}
            <div className="crono-filter-bar">
              <div className="crono-sub-tabs">
                <button
                  className={`crono-sub-tab-btn${activeCronFilter === 'general' ? ' active' : ''}`}
                  onClick={() => setActiveCronFilter('general')}
                >
                  General (Todas)
                </button>
                <button
                  className={`crono-sub-tab-btn${activeCronFilter === 'p2' ? ' active' : ''}`}
                  onClick={() => setActiveCronFilter('p2')}
                >
                  Backend / Agentes (P2)
                </button>
                <button
                  className={`crono-sub-tab-btn${activeCronFilter === 'p1' ? ' active' : ''}`}
                  onClick={() => setActiveCronFilter('p1')}
                >
                  Frontend / Datos (P1)
                </button>
              </div>

              <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
                Mostrando {filteredActivities.length} actividades
              </span>
            </div>

            {/* Lista por Semanas */}
            {groupedWeeks.map(([semanaNum, group]) => (
              <div key={semanaNum} className="crono-week-card">
                <div className="crono-week-header">
                  <h3 className="crono-week-title">{group.semanaNombre}</h3>
                  <span className="crono-week-badge">
                    {group.items.filter(i => !!cronStates[i.id]).length} / {group.items.length} completadas
                  </span>
                </div>

                <div className="crono-activities-list">
                  {group.items.map(act => {
                    const isDone = !!cronStates[act.id];

                    return (
                      <div key={act.id} className="crono-act-row">
                        <div className="crono-act-left">
                          <span className={`crono-area-badge ${act.area.toLowerCase()}`}>
                            {act.area === 'P1' ? 'P1 Datos/IA' : act.area === 'P2' ? 'P2 Agentes' : 'Ambos'}
                          </span>
                          <div className="crono-act-text-wrap">
                            <span className="crono-act-text">
                              {act.actividad}
                              {act.esEntregable && (
                                <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#FEF3C7', color: '#B45309', padding: '2px 7px', borderRadius: 4, fontWeight: 800 }}>
                                  📦 Entregable clave
                                </span>
                              )}
                            </span>
                            <div className="crono-act-meta">
                              <span>Responsable: <strong>{act.responsableDefault}</strong></span>
                              <span>•</span>
                              <span>Entrega: {act.fechaEstimada}</span>
                            </div>
                          </div>
                        </div>

                        <div className="crono-act-right">
                          <button
                            className={`crono-toggle-btn ${isDone ? 'done' : 'pending'}`}
                            onClick={() => toggleActivityStatus(act.id)}
                            title="Haz clic para alternar el estado de cumplimiento"
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
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
