import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Cpu, CheckCircle2, Circle, Save,
  Check, UserCheck, Code2, Database, ShieldCheck, Layers,
  Edit3, ArrowLeft, Wrench, FileText, Package, User
} from 'lucide-react';
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

  /* ── 1. ESTADO DE REGISTRO TÉCNICO (4 MENTES MAESTRAS) ── */
  const [selectedMemberId, setSelectedMemberId] = useState<string>('santiago');
  const [registries, setRegistries] = useState<Record<string, MemberRegistry>>(() => {
    try {
      const saved = localStorage.getItem(REGISTRY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      santiago: {
        memberId: 'santiago',
        selectedTechIds: ['unsloth', 'huggingface_trl', 'pytorch', 'qlora', 'spacy', 'bioc', 'lm_harness', 'jsonl', 'embeddings'],
        customTechnologies: 'Weights & Biases, Google Colab Pro GPU A100, spaCy es_core_news_lg',
        usageNotes: 'Semana 1 a 7: Curación del corpus de casos clínicos, normalización ortográfica, deduplicación coseno y fine-tuning SFT-CoT de adaptadores PEFT.',
        frenteTrabajo: 'P1',
      },
      zabdiel: {
        memberId: 'zabdiel',
        selectedTechIds: ['python', 'flask', 'langgraph', 'pydantic', 'openapi', 'postgresql', 'sse', 'jwt_cors', 'locust', 'iso27001'],
        customTechnologies: 'Flask Blueprints, Pytest, Docker, Gunicorn, PostgreSQL 15, Locust latencia p90',
        usageNotes: 'Semana 1 a 8: Scaffolding de Flask, orquestación del grafo LangGraph (Agentes 1, 2, 3), bias_service para 5 sesgos cognitivos, streaming SSE y persistencia CaseSession.',
        frenteTrabajo: 'P2',
      },
      camilo: {
        memberId: 'camilo',
        selectedTechIds: ['openapi', 'iso27001', 'pydantic', 'jwt_cors', 'react', 'typescript', 'vite'],
        customTechnologies: 'Checklist ISO/IEC 27001, Métricas de Calidad de Software, Auditoría de Seguridad',
        usageNotes: 'Supervisión de arquitectura, revisión de contratos de API, auditoría de seguridad y dirección metodológica del proyecto de grado.',
        frenteTrabajo: 'Ambos',
      },
      juan: {
        memberId: 'juan',
        selectedTechIds: ['jsonl', 'lm_harness'],
        customTechnologies: 'Rúbricas de Pertinencia Clínica, Rúbricas de Retroalimentación Formativa',
        usageNotes: 'Semana 4, 11 y 12: Validación experta de casos clínicos generados por Agente 1 y evaluación de la retroalimentación diagnóstica del Agente 3.',
        frenteTrabajo: 'Ambos',
      },
    };
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

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
    setTimeout(() => setSaveSuccess(false), 2500);
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
    <div className="crono-compact-root">

      {/* Top Bar Minimalista */}
      <div className="crono-top-bar">
        <button className="crono-brand-btn" onClick={() => navigate('/')}>
          <img src={logoUrl} alt="Clerkship" style={{ width: 22, height: 22 }} />
          Clerkship
        </button>

        <button className="crono-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> Volver a la plataforma
        </button>
      </div>

      {/* Pestañas de Navegación Compactas */}
      <div className="crono-nav-tabs-bar">
        <div className="crono-nav-tabs">
          <button
            className={`crono-nav-tab${activeTab === 'registro' ? ' active' : ''}`}
            onClick={() => setActiveTab('registro')}
          >
            <UserCheck size={15} /> 1. Registro de Integrante & Stack
          </button>
          <button
            className={`crono-nav-tab${activeTab === 'cronograma' ? ' active' : ''}`}
            onClick={() => setActiveTab('cronograma')}
          >
            <Calendar size={15} /> 2. Cronograma de Entregas (16 Semanas)
          </button>
        </div>

        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0D47A1', background: '#E3F2FD', padding: '3px 10px', borderRadius: 9999 }}>
          PROYECTO DE GRADO · ENTORNO DE DESARROLLO
        </span>
      </div>

      {/* ══════════════════════════════════════════════════════════
         PESTAÑA 1: REGISTRO TÉCNICO EN SPLIT SCREEN (DOS COLUMNAS)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'registro' && (
        <div className="crono-split-container">

          {/* ── COLUMNA IZQUIERDA: Selector + Formulario de Registro ── */}
          <div className="crono-col-left">

            {/* Card 1: Selector de las 4 Mentes Maestras */}
            <div className="crono-panel-card">
              <div className="crono-panel-header">
                <User size={16} style={{ color: '#1976D2' }} />
                Integrantes del Equipo (4 Mentes Maestras):
              </div>

              <div className="reg-member-selector-row">
                {TEAM_MEMBERS.map(m => {
                  const regData = registries[m.id];
                  const hasReg = regData && (regData.selectedTechIds.length > 0 || !!regData.customTechnologies);

                  return (
                    <button
                      key={m.id}
                      className={`reg-member-chip${selectedMemberId === m.id ? ' active' : ''}`}
                      onClick={() => setSelectedMemberId(m.id)}
                      type="button"
                    >
                      <span className="reg-chip-name">{m.nombre}</span>
                      <span className="reg-chip-rol">{m.rol}</span>
                      <span style={{ fontSize: '0.7rem', color: hasReg ? '#059669' : '#94A3B8', marginTop: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        {hasReg ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                        {hasReg ? 'Registrado' : 'Pendiente'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Formulario de Registro de Tecnologías */}
            <div className="crono-panel-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div className="crono-panel-header" style={{ margin: 0 }}>
                    <Edit3 size={16} style={{ color: '#1976D2' }} />
                    Formulario: {activeMemberObj.nombre}
                  </div>
                  <span style={{ fontSize: '0.76rem', color: '#64748B' }}>
                    {activeMemberObj.rol}
                  </span>
                </div>

                {/* Selector de Frente de Trabajo */}
                <div style={{ display: 'flex', gap: 3, background: '#E2E8F0', padding: 3, borderRadius: 8 }}>
                  {(['P1', 'P2', 'Ambos'] as const).map(frente => (
                    <button
                      key={frente}
                      style={{
                        padding: '3px 9px',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        borderRadius: 6,
                        border: 'none',
                        background: currentRegistry.frenteTrabajo === frente ? '#FFFFFF' : 'transparent',
                        color: currentRegistry.frenteTrabajo === frente ? '#1976D2' : '#64748B',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleFrenteChange(frente)}
                      type="button"
                    >
                      {frente === 'P1' ? 'P1 Datos' : frente === 'P2' ? 'P2 Agentes' : 'Ambos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorías de Tecnologías (Chips Compactos sin Emojis) */}
              {(['Backend', 'IA', 'Frontend', 'BaseDatos', 'Seguridad'] as const).map(cat => {
                const catItems = TECH_CATALOG.filter(t => t.categoria === cat);
                if (catItems.length === 0) return null;

                const catTitles: Record<string, { label: string; icon: any }> = {
                  Backend: { label: 'Backend & API (P2)', icon: Code2 },
                  IA: { label: 'IA & Fine-Tuning (P1)', icon: Cpu },
                  Frontend: { label: 'Frontend & UI', icon: Layers },
                  BaseDatos: { label: 'Persistencia & Datasets', icon: Database },
                  Seguridad: { label: 'Seguridad & ISO 27001', icon: ShieldCheck },
                };

                const IconComponent = catTitles[cat].icon;

                return (
                  <div key={cat} className="tech-compact-group">
                    <div className="tech-compact-title">
                      <IconComponent size={13} style={{ color: '#1976D2' }} />
                      {catTitles[cat].label}
                    </div>
                    <div className="tech-compact-chips-grid">
                      {catItems.map(tech => {
                        const isSelected = currentRegistry.selectedTechIds.includes(tech.id);
                        return (
                          <div
                            key={tech.id}
                            className={`tech-chip-item${isSelected ? ' selected' : ''}`}
                            onClick={() => toggleTechForActive(tech.id)}
                          >
                            {isSelected ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                            {tech.nombre}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Campos de Texto Personalizados */}
              <div className="reg-field-group" style={{ marginTop: 14 }}>
                <label className="reg-field-label">
                  <Wrench size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: '#1976D2' }} />
                  Otras tecnologías o herramientas escritas para {activeMemberObj.nombre}:
                </label>
                <input
                  type="text"
                  className="reg-field-input"
                  placeholder="Ej. Docker, FastAPI, Redis, Weights & Biases, Google Colab Pro..."
                  value={currentRegistry.customTechnologies || ''}
                  onChange={e => handleCustomTechChange(e.target.value)}
                />
              </div>

              <div className="reg-field-group">
                <label className="reg-field-label">
                  <FileText size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: '#1976D2' }} />
                  Módulos y Entregables del Cronograma asignados:
                </label>
                <textarea
                  className="reg-field-input reg-field-textarea"
                  placeholder="Describe las semanas o tareas en las que trabajará..."
                  value={currentRegistry.usageNotes || ''}
                  onChange={e => handleUsageNotesChange(e.target.value)}
                />
              </div>

              {/* Botón de Guardado */}
              <div className="reg-submit-bar">
                {saveSuccess ? (
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={14} /> ¡Perfil guardado exitosamente!
                  </span>
                ) : <span />}

                <button className="reg-save-btn" onClick={handleSaveRegistry}>
                  <Save size={14} /> Guardar Registro de {activeMemberObj.nombre}
                </button>
              </div>
            </div>

          </div>

          {/* ── COLUMNA DERECHA: Resumen Consolidado de las 4 Mentes ── */}
          <div className="crono-col-right">

            <div className="crono-panel-header" style={{ marginBottom: 4 }}>
              <Layers size={16} style={{ color: '#1976D2' }} />
              Resumen del Registro del Equipo (4 Mentes Maestras):
            </div>

            {TEAM_MEMBERS.map(m => {
              const regData = registries[m.id];
              const memberTechObjs = regData ? TECH_CATALOG.filter(t => regData.selectedTechIds.includes(t.id)) : [];
              const hasReg = regData && (memberTechObjs.length > 0 || !!regData.customTechnologies);

              return (
                <div key={m.id} className="reg-summary-item-card">
                  <div className="reg-summary-head">
                    <span className="reg-summary-name">{m.nombre}</span>
                    <span className="reg-summary-tag">
                      {regData?.frenteTrabajo || m.areaPrincipal}
                    </span>
                  </div>

                  <div className="reg-summary-rol">{m.rol}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: hasReg ? '#059669' : '#94A3B8', marginBottom: 8 }}>
                    {hasReg ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                    {hasReg ? 'Registro Completado' : 'Pendiente de Registro'}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {memberTechObjs.map(t => (
                      <span key={t.id} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#E3F2FD', color: '#0D47A1' }}>
                        {t.nombre}
                      </span>
                    ))}
                  </div>

                  {regData?.customTechnologies && (
                    <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Wrench size={12} style={{ color: '#1976D2', flexShrink: 0 }} />
                      <span>{regData.customTechnologies}</span>
                    </div>
                  )}

                  {regData?.usageNotes && (
                    <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 6, display: 'flex', alignItems: 'flex-start', gap: 4, lineHeight: 1.4 }}>
                      <FileText size={12} style={{ color: '#64748B', flexShrink: 0, marginTop: 2 }} />
                      <span>{regData.usageNotes}</span>
                    </div>
                  )}
                </div>
              );
            })}

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
         PESTAÑA 2: CRONOGRAMA DE ENTREGAS (16 SEMANAS)
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'cronograma' && (
        <div style={{ height: 'calc(100vh - 130px)', overflowY: 'auto', paddingRight: 6 }}>
          {/* Barra de Estadísticas Compacta */}
          <div className="crono-compact-bar">
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
              Progreso General: {stats.percentage}%
            </span>
            <div style={{ display: 'flex', gap: 10, fontSize: '0.78rem', fontWeight: 700 }}>
              <span style={{ color: '#334155' }}>Total: {stats.total}</span>
              <span style={{ color: '#047857' }}>✓ Realizadas: {stats.doneCount}</span>
              <span style={{ color: '#1D4ED8' }}>○ Pendientes: {stats.pendingCount}</span>
            </div>
          </div>

          {/* Filtros de Área Compactos */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['general', 'p2', 'p1'] as const).map(filterKey => (
              <button
                key={filterKey}
                style={{
                  padding: '4px 12px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  borderRadius: 6,
                  border: 'none',
                  background: activeCronFilter === filterKey ? '#1976D2' : '#E2E8F0',
                  color: activeCronFilter === filterKey ? '#FFFFFF' : '#475569',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveCronFilter(filterKey)}
                type="button"
              >
                {filterKey === 'general' ? 'Vista General' : filterKey === 'p2' ? 'P2 Backend' : 'P1 Datos'}
              </button>
            ))}
          </div>

          {/* Lista por Semanas Compacta sin Emojis */}
          <div>
            {groupedWeeks.map(([semanaNum, group]) => (
              <div key={semanaNum} className="crono-week-compact-item">
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{group.semanaNombre}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                    {group.items.filter(i => !!cronStates[i.id]).length} / {group.items.length} tareas
                  </span>
                </div>

                <div>
                  {group.items.map(act => {
                    const isDone = !!cronStates[act.id];

                    return (
                      <div key={act.id} className="crono-compact-act-row">
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: act.area === 'P1' ? '#E0F2FE' : act.area === 'P2' ? '#E0F2FE' : '#F3E8FF', color: act.area === 'P1' ? '#0284C7' : act.area === 'P2' ? '#0097A7' : '#7E22CE' }}>
                            {act.area}
                          </span>
                          <span style={{ fontWeight: 600, color: '#1E293B' }}>
                            {act.actividad}
                            {act.esEntregable && (
                              <span style={{ marginLeft: 6, fontSize: '0.68rem', background: '#FEF3C7', color: '#B45309', padding: '1px 6px', borderRadius: 4, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                <Package size={10} /> Entregable
                              </span>
                            )}
                          </span>
                        </div>

                        <button
                          className={`crono-compact-btn ${isDone ? 'done' : 'pending'}`}
                          onClick={() => toggleActivityStatus(act.id)}
                          type="button"
                        >
                          {isDone ? '✓ Realizado' : '○ Pendiente'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
