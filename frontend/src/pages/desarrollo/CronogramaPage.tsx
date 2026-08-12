import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Cpu, CheckCircle2, Circle, Save,
  Check, UserCheck, Code2, Database, ShieldCheck, Sparkles, Layers,
  Edit3, PenTool
} from 'lucide-react';
import InteractiveBackgroundCanvas from '../../components/shared/InteractiveBackgroundCanvas';
import logoUrl from '../../assets/Logo Clerkship.svg';
import {
  CRONOGRAMA_ACTIVIDADES,
  TECH_CATALOG,
  TEAM_MEMBERS
} from '../../data/cronogramaData';
import type { CronogramaItem, MemberRegistry } from '../../data/cronogramaData';
import '../../styles/cronograma.css';

const REGISTRY_STORAGE_KEY = 'clerkship_tech_registry_v2';
const CRON_STORAGE_KEY = 'clerkship_cron_states_v1';

export default function CronogramaPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'registro' | 'cronograma'>('registro');

  /* ── 1. ESTADO DE REGISTRO TÉCNICO (4 MENTES / INTEGRANTES) ── */
  const [selectedMemberId, setSelectedMemberId] = useState<string>('santiago');
  const [registries, setRegistries] = useState<Record<string, MemberRegistry>>(() => {
    try {
      const saved = localStorage.getItem(REGISTRY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default initial registration data for the 4 members
    return {
      santiago: {
        memberId: 'santiago',
        selectedTechIds: ['unsloth', 'huggingface_trl', 'pytorch', 'qlora', 'spacy', 'bioc', 'lm_harness', 'jsonl', 'embeddings'],
        customTechnologies: 'Weights & Biases, Google Colab Pro GPU A100, spaCy es_core_news_lg',
        usageNotes: 'Semana 1 a 7: Curación del corpus de casos clínicos, normalización ortográfica, deduplicación coseno y fine-tuning SFT-CoT de adaptadores PEFT.',
        frenteTrabajo: 'P1',
      },
      steven: {
        memberId: 'steven',
        selectedTechIds: ['python', 'flask', 'langgraph', 'pydantic', 'openapi', 'postgresql', 'sse', 'jwt_cors', 'locust', 'iso27001'],
        customTechnologies: 'Flask Blueprints, Pytest, Docker, Gunicorn, PostgreSQL 15, Locust latencia p90',
        usageNotes: 'Semana 1 a 8: Scaffolding de Flask, orquestación del grafo LangGraph (Agentes 1, 2, 3), bias_service para 5 sesgos cognitivos, streaming SSE y persistencia CaseSession.',
        frenteTrabajo: 'P2',
      },
      director: {
        memberId: 'director',
        selectedTechIds: ['openapi', 'iso27001', 'pydantic', 'jwt_cors'],
        customTechnologies: 'Checklist ISO/IEC 27001, Métricas de Calidad de Software, Auditoría de Seguridad',
        usageNotes: 'Supervisión de arquitectura, revisión de contratos de API, auditoría de seguridad y dirección metodológica del proyecto de grado.',
        frenteTrabajo: 'Ambos',
      },
      panel_medico: {
        memberId: 'panel_medico',
        selectedTechIds: ['jsonl'],
        customTechnologies: 'Rúbricas de Pertinencia Clínica, Rúbricas de Retroalimentación Formativa',
        usageNotes: 'Semana 4, 11 y 12: Validación experta de casos clínicos generados por Agente 1 y evaluación de la retroalimentación diagnóstica del Agente 3.',
        frenteTrabajo: 'Ambos',
      },
    };
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active member's current form state
  const currentRegistry = registries[selectedMemberId] || {
    memberId: selectedMemberId,
    selectedTechIds: [],
    customTechnologies: '',
    usageNotes: '',
    frenteTrabajo: 'P1',
  };

  function toggleTechForActive(techId: string) {
    setRegistries(prev => {
      const activeReg = prev[selectedMemberId] || {
        memberId: selectedMemberId,
        selectedTechIds: [],
        customTechnologies: '',
        usageNotes: '',
        frenteTrabajo: 'P1',
      };
      const currentList = activeReg.selectedTechIds;
      const updatedList = currentList.includes(techId)
        ? currentList.filter(id => id !== techId)
        : [...currentList, techId];

      return {
        ...prev,
        [selectedMemberId]: { ...activeReg, selectedTechIds: updatedList }
      };
    });
    setSaveSuccess(false);
  }

  function handleCustomTechChange(text: string) {
    setRegistries(prev => ({
      ...prev,
      [selectedMemberId]: {
        ...(prev[selectedMemberId] || { memberId: selectedMemberId, selectedTechIds: [], usageNotes: '', frenteTrabajo: 'P1' }),
        customTechnologies: text
      }
    }));
    setSaveSuccess(false);
  }

  function handleUsageNotesChange(text: string) {
    setRegistries(prev => ({
      ...prev,
      [selectedMemberId]: {
        ...(prev[selectedMemberId] || { memberId: selectedMemberId, selectedTechIds: [], customTechnologies: '', frenteTrabajo: 'P1' }),
        usageNotes: text
      }
    }));
    setSaveSuccess(false);
  }

  function handleFrenteChange(frente: 'P1' | 'P2' | 'Ambos') {
    setRegistries(prev => ({
      ...prev,
      [selectedMemberId]: {
        ...(prev[selectedMemberId] || { memberId: selectedMemberId, selectedTechIds: [], customTechnologies: '', usageNotes: '' }),
        frenteTrabajo: frente
      }
    }));
    setSaveSuccess(false);
  }

  function handleSaveRegistry() {
    const updated = {
      ...registries,
      [selectedMemberId]: {
        ...currentRegistry,
        updatedAt: new Date().toISOString()
      }
    };
    setRegistries(updated);
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(updated));
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
            <Sparkles size={14} /> PROYECTO DE GRADO · REGISTRO & CRONOGRAMA
          </span>
          <h1 className="crono-title">Registro de Integrantes & Cronograma de Entregas</h1>
          <p className="crono-subtitle">
            Registro de definición técnica para cada una de las 4 mentes del equipo y alineación con la hoja de ruta de 16 semanas.
          </p>
        </div>

        {/* Pestañas Principales (Registro vs Cronograma) */}
        <div className="crono-tabs-wrap">
          <button
            className={`crono-tab-btn${activeTab === 'registro' ? ' active' : ''}`}
            onClick={() => setActiveTab('registro')}
          >
            <PenTool size={18} /> 1. Registro de Integrante & Stack
          </button>
          <button
            className={`crono-tab-btn${activeTab === 'cronograma' ? ' active' : ''}`}
            onClick={() => setActiveTab('cronograma')}
          >
            <Calendar size={18} /> 2. Cronograma de Entregas (16 Semanas)
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
           PESTAÑA 1: REGISTRO TÉCNICO DE LOS 4 INTEGRANTES (MENTES)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'registro' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div className="tech-container">

              {/* Paso 1: Seleccionar Integrante entre las 4 Mentes */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserCheck size={18} style={{ color: '#1976D2' }} />
                  Selecciona la persona a registrar (4 Mentes del Equipo):
                </span>
              </div>

              <div className="reg-members-grid">
                {TEAM_MEMBERS.map(m => {
                  const regData = registries[m.id];
                  const hasRegistered = regData && (regData.selectedTechIds.length > 0 || !!regData.customTechnologies);

                  return (
                    <div
                      key={m.id}
                      className={`reg-member-card${selectedMemberId === m.id ? ' active' : ''}`}
                      onClick={() => setSelectedMemberId(m.id)}
                    >
                      <span className="reg-member-badge" style={{ background: '#E3F2FD', color: m.avatarColor }}>
                        {m.areaPrincipal === 'P1' ? 'P1 Datos / IA' : m.areaPrincipal === 'P2' ? 'P2 Agentes' : 'Fullstack / Validación'}
                      </span>
                      <span className="reg-member-name">{m.nombre}</span>
                      <span className="reg-member-rol">{m.rol}</span>

                      <span className={`reg-status-indicator ${hasRegistered ? 'registered' : 'pending'}`}>
                        {hasRegistered ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                        {hasRegistered ? 'Registrado' : 'Pendiente'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Paso 2: Formulario de Registro Habilitado para el Integrante Seleccionado */}
              <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: 20, border: '1.5px solid #E2E8F0', marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                      Registro de Tecnologías: {activeMemberObj.nombre}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748B' }}>
                      {activeMemberObj.rol}
                    </p>
                  </div>

                  {/* Selección de Frente de Trabajo */}
                  <div style={{ display: 'flex', gap: 6, background: '#E2E8F0', padding: 4, borderRadius: 12 }}>
                    {(['P1', 'P2', 'Ambos'] as const).map(frente => (
                      <button
                        key={frente}
                        className={`crono-sub-filter-btn${currentRegistry.frenteTrabajo === frente ? ' active' : ''}`}
                        onClick={() => handleFrenteChange(frente)}
                        type="button"
                      >
                        {frente === 'P1' ? 'P1 (Datos/IA)' : frente === 'P2' ? 'P2 (Agentes/Backend)' : 'Ambos'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid de Tecnologías Predefinidas por Categoría */}
                {(['Backend', 'IA', 'Frontend', 'BaseDatos', 'Seguridad'] as const).map(cat => {
                  const catItems = TECH_CATALOG.filter(t => t.categoria === cat);
                  if (catItems.length === 0) return null;

                  const catTitles: Record<string, { label: string; icon: any }> = {
                    Backend: { label: 'Backend & API (P2 Agentes)', icon: Code2 },
                    IA: { label: 'IA, Fine-Tuning & NLP (P1 Datos)', icon: Cpu },
                    Frontend: { label: 'Frontend & UI', icon: Layers },
                    BaseDatos: { label: 'Persistencia & Datasets', icon: Database },
                    Seguridad: { label: 'Seguridad & Cumplimiento', icon: ShieldCheck },
                  };

                  const IconComponent = catTitles[cat].icon;

                  return (
                    <div key={cat} className="tech-cat-section">
                      <h3 className="tech-cat-header">
                        <IconComponent size={18} style={{ color: '#1976D2' }} />
                        {catTitles[cat].label}
                      </h3>
                      <div className="tech-card-grid">
                        {catItems.map(tech => {
                          const isSelected = currentRegistry.selectedTechIds.includes(tech.id);
                          return (
                            <div
                              key={tech.id}
                              className={`tech-select-card${isSelected ? ' selected' : ''}`}
                              onClick={() => toggleTechForActive(tech.id)}
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

                {/* Entradas de Texto Personalizadas escritas por el usuario */}
                <div className="reg-input-group">
                  <label className="reg-label">
                    <Edit3 size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: '#1976D2' }} />
                    Otras Tecnologías / Herramientas Personalizadas que utilizará {activeMemberObj.nombre}:
                  </label>
                  <input
                    type="text"
                    className="reg-text-input"
                    placeholder="Ej. Docker, FastAPI, Redis, Weights & Biases, Google Colab Pro, Gunicorn..."
                    value={currentRegistry.customTechnologies || ''}
                    onChange={e => handleCustomTechChange(e.target.value)}
                  />
                </div>

                <div className="reg-input-group">
                  <label className="reg-label">
                    Módulos y Entregables del Cronograma asignados a estas tecnologías:
                  </label>
                  <textarea
                    className="reg-text-input reg-textarea"
                    placeholder="Describe brevemente en qué entregables o semanas aplicará estas tecnologías..."
                    value={currentRegistry.usageNotes || ''}
                    onChange={e => handleUsageNotesChange(e.target.value)}
                  />
                </div>

                {/* Botón de Guardado */}
                <div className="tech-action-bar">
                  <AnimatePresence>
                    {saveSuccess && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Check size={18} /> ¡Registro de {activeMemberObj.nombre} guardado exitosamente!
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <button className="tech-submit-btn" onClick={handleSaveRegistry}>
                    <Save size={18} /> Registrar Perfil de {activeMemberObj.nombre}
                  </button>
                </div>
              </div>

              {/* Paso 3: Resumen Consolidado de los 4 Registros */}
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', marginBottom: 16 }}>
                Resumen del Registro del Equipo (4 Mentes)
              </h3>
              <div className="tech-summary-grid">
                {TEAM_MEMBERS.map(m => {
                  const regData = registries[m.id];
                  const memberTechObjs = regData ? TECH_CATALOG.filter(t => regData.selectedTechIds.includes(t.id)) : [];

                  return (
                    <div key={m.id} className="tech-summary-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          {m.nombre}
                        </h4>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#E0F2FE', color: '#0284C7', padding: '2px 8px', borderRadius: 6 }}>
                          {regData?.frenteTrabajo || m.areaPrincipal}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 12px' }}>
                        {m.rol}
                      </p>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                        {memberTechObjs.map(t => (
                          <span key={t.id} style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: '#E3F2FD', color: '#0D47A1' }}>
                            {t.nombre}
                          </span>
                        ))}
                      </div>

                      {regData?.customTechnologies && (
                        <p style={{ fontSize: '0.8rem', color: '#334155', margin: '6px 0 0', fontWeight: 600 }}>
                          🛠️ <strong>Adicionales:</strong> {regData.customTechnologies}
                        </p>
                      )}

                      {regData?.usageNotes && (
                        <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '6px 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>
                          📝 {regData.usageNotes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════
           PESTAÑA 2: CRONOGRAMA DE ENTREGAS (16 SEMANAS)
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
