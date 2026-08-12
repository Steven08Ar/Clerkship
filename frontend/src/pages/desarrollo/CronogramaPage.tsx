import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Cpu, CheckCircle2, Circle, Save,
  Check, UserCheck, Code2, Database, ShieldCheck, Layers,
  Edit3, ArrowLeft
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

  /* ── 1. ESTADO DE REGISTRO TÉCNICO (4 MENTES / INTEGRANTES) ── */
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

      {/* Card Formulario Principal Compacto */}
      <div className="crono-register-card">
        {/* Form Header */}
        <div className="crono-form-header">
          <span className="crono-mini-tag">
            PROYECTO DE GRADO · FORMULARIO DE REGISTRO
          </span>
          <h1 className="crono-form-title">Registro Técnico & Cronograma</h1>
          <p className="crono-form-desc">
            Define la persona responsable, stack asignado y estado del cronograma.
          </p>
        </div>

        {/* Pestañas de Navegación Compactas */}
        <div className="crono-nav-tabs">
          <button
            className={`crono-nav-tab${activeTab === 'registro' ? ' active' : ''}`}
            onClick={() => setActiveTab('registro')}
          >
            <UserCheck size={16} /> 1. Registro de Integrante
          </button>
          <button
            className={`crono-nav-tab${activeTab === 'cronograma' ? ' active' : ''}`}
            onClick={() => setActiveTab('cronograma')}
          >
            <Calendar size={16} /> 2. Cronograma de Entregas
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
           PESTAÑA 1: REGISTRO TÉCNICO COMPACTO (4 MENTES)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'registro' && (
          <div>
            {/* Selector de los 4 Integrantes */}
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155' }}>
                Selecciona persona a registrar (4 Integrantes):
              </span>
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
                    <span style={{ fontSize: '0.7rem', color: hasReg ? '#059669' : '#94A3B8', marginTop: 2, fontWeight: 700 }}>
                      {hasReg ? '✓ Registrado' : '○ Pendiente'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Formulario Compacto */}
            <div style={{ background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0', padding: 18, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
                  Formulario: {activeMemberObj.nombre}
                </span>

                {/* Frente de trabajo */}
                <div style={{ display: 'flex', gap: 4, background: '#E2E8F0', padding: 3, borderRadius: 8 }}>
                  {(['P1', 'P2', 'Ambos'] as const).map(frente => (
                    <button
                      key={frente}
                      style={{
                        padding: '3px 10px',
                        fontSize: '0.75rem',
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

              {/* Categorías de Tecnologías (Chips Compactos) */}
              {(['Backend', 'IA', 'Frontend', 'BaseDatos', 'Seguridad'] as const).map(cat => {
                const catItems = TECH_CATALOG.filter(t => t.categoria === cat);
                if (catItems.length === 0) return null;

                const catTitles: Record<string, { label: string; icon: any }> = {
                  Backend: { label: 'Backend & API (P2)', icon: Code2 },
                  IA: { label: 'IA & Fine-Tuning (P1)', icon: Cpu },
                  Frontend: { label: 'Frontend & UI', icon: Layers },
                  BaseDatos: { label: 'Persistencia & Datasets', icon: Database },
                  Seguridad: { label: 'Seguridad', icon: ShieldCheck },
                };

                const IconComponent = catTitles[cat].icon;

                return (
                  <div key={cat} className="tech-compact-group">
                    <div className="tech-compact-title">
                      <IconComponent size={14} style={{ color: '#1976D2' }} />
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

              {/* Entradas de Texto Personalizadas */}
              <div className="reg-field-group" style={{ marginTop: 16 }}>
                <label className="reg-field-label">
                  <Edit3 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: '#1976D2' }} />
                  Otras tecnologías o herramientas escritas para {activeMemberObj.nombre}:
                </label>
                <input
                  type="text"
                  className="reg-field-input"
                  placeholder="Ej. Docker, FastAPI, Redis, Weights & Biases..."
                  value={currentRegistry.customTechnologies || ''}
                  onChange={e => handleCustomTechChange(e.target.value)}
                />
              </div>

              <div className="reg-field-group">
                <label className="reg-field-label">
                  Módulos y Entregables del Cronograma asignados:
                </label>
                <textarea
                  className="reg-field-input reg-field-textarea"
                  placeholder="Escribe en qué entregables trabajará..."
                  value={currentRegistry.usageNotes || ''}
                  onChange={e => handleUsageNotesChange(e.target.value)}
                />
              </div>

              {/* Botón de Guardado */}
              <div className="reg-submit-bar">
                {saveSuccess ? (
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={15} /> ¡Guardado exitosamente!
                  </span>
                ) : <span />}

                <button className="reg-save-btn" onClick={handleSaveRegistry}>
                  <Save size={15} /> Guardar Registro de {activeMemberObj.nombre}
                </button>
              </div>
            </div>

            {/* Resumen Compacto de los 4 Integrantes */}
            <div className="reg-summary-compact">
              {TEAM_MEMBERS.map(m => {
                const regData = registries[m.id];
                const memberTechObjs = regData ? TECH_CATALOG.filter(t => regData.selectedTechIds.includes(t.id)) : [];

                return (
                  <div key={m.id} className="reg-summary-item">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>{m.nombre}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7', background: '#E0F2FE', padding: '1px 6px', borderRadius: 4 }}>
                        {regData?.frenteTrabajo || m.areaPrincipal}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {memberTechObjs.map(t => (
                        <span key={t.id} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#E3F2FD', color: '#0D47A1' }}>
                          {t.nombre}
                        </span>
                      ))}
                    </div>

                    {regData?.customTechnologies && (
                      <p style={{ fontSize: '0.74rem', color: '#334155', margin: '4px 0 0', fontWeight: 600 }}>
                        ✍️ {regData.customTechnologies}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
           PESTAÑA 2: CRONOGRAMA COMPACTO DE ENTREGAS (16 SEMANAS)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === 'cronograma' && (
          <div>
            {/* Barra de Estadísticas Compacta */}
            <div className="crono-compact-bar">
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                Progreso: {stats.percentage}%
              </span>
              <div style={{ display: 'flex', gap: 8, fontSize: '0.78rem', fontWeight: 700 }}>
                <span style={{ color: '#334155' }}>Total: {stats.total}</span>
                <span style={{ color: '#047857' }}>✓ {stats.doneCount}</span>
                <span style={{ color: '#1D4ED8' }}>○ {stats.pendingCount}</span>
              </div>
            </div>

            {/* Filtros de Área Compactos */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {(['general', 'p2', 'p1'] as const).map(filterKey => (
                <button
                  key={filterKey}
                  style={{
                    padding: '5px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    borderRadius: 8,
                    border: 'none',
                    background: activeCronFilter === filterKey ? '#1976D2' : '#E2E8F0',
                    color: activeCronFilter === filterKey ? '#FFFFFF' : '#475569',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveCronFilter(filterKey)}
                  type="button"
                >
                  {filterKey === 'general' ? 'General' : filterKey === 'p2' ? 'P2 Backend' : 'P1 Datos'}
                </button>
              ))}
            </div>

            {/* Lista por Semanas Compacta */}
            <div>
              {groupedWeeks.map(([semanaNum, group]) => (
                <div key={semanaNum} className="crono-week-compact-item">
                  <div className="crono-week-compact-title">
                    <span>{group.semanaNombre}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
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
                            <span style={{ fontWeight: 600, color: '#1E293B' }}>{act.actividad}</span>
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
    </div>
  );
}
