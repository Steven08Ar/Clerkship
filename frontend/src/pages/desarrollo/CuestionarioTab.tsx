import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2, FilePlus, Sparkles, PlusCircle, Bot, BrainCircuit, Server, Layout, Save, ChevronDown, Check, ShieldCheck, X } from 'lucide-react';
import { TEAM_MEMBERS } from '../../data/teamData';
import type { TeamMember } from '../../data/teamData';
import { getPlaceholderCategoriesForMember } from '../../data/techPlaceholders';
import { readCuestionarioAnswers, saveCuestionarioAnswers } from '../../data/cuestionarioStore';
import { authenticateMember, authErrorMessage, isFirstLogin, setNewPassword, validateNewPassword } from '../../data/devAuth';
import PasswordInput from '../../components/shared/PasswordInput';
import NewPasswordFields from '../../components/shared/NewPasswordFields';

interface FormData {
  descripcion: string;
  placeholderAnswers: Record<string, string>;
  customOtro: string;
}

const EMPTY_FORM: FormData = {
  descripcion: '',
  placeholderAnswers: {},
  customOtro: '',
};

export default function CuestionarioTab() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [justSaved, setJustSaved] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [customEntryKey, setCustomEntryKey] = useState<string | null>(null);
  const [customEntryDraft, setCustomEntryDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Login por perfil (contraseña) + cambio obligatorio en el primer ingreso ──
  const [pendingMember, setPendingMember] = useState<TeamMember | null>(null);
  const [authPhase, setAuthPhase] = useState<'password' | 'newPassword' | null>(null);
  const [loginPassword, setLoginPassword] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const proceedToStep2 = async (member: TeamMember) => {
    setSelectedMember(member);

    // Precarga los selects con lo que ya esté guardado en Firebase (o el valor sugerido por defecto)
    const saved = await readCuestionarioAnswers();
    const placeholderCategories = getPlaceholderCategoriesForMember(member.id);
    const initialAnswers: Record<string, string> = {};
    placeholderCategories.forEach((cat) => {
      cat.placeholders.forEach((ph) => {
        initialAnswers[ph.key] = saved[ph.key] || ph.defaultTech;
      });
    });

    setFormData((prev) => ({ ...prev, placeholderAnswers: initialAnswers, customOtro: '' }));
    setOpenDropdownKey(null);
    setCustomEntryKey(null);
    closeLoginModal();
    setCurrentStep(2);
  };

  const handleCardClick = (member: TeamMember) => {
    setPendingMember(member);
    setAuthPhase('password');
    setLoginPassword('');
    setNewPassword1('');
    setNewPassword2('');
    setAuthError('');
  };

  const closeLoginModal = () => {
    setPendingMember(null);
    setAuthPhase(null);
    setLoginPassword('');
    setNewPassword1('');
    setNewPassword2('');
    setAuthError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMember) return;
    if (!loginPassword) {
      setAuthError('Ingresa tu contraseña.');
      return;
    }

    setAuthError('');
    setAuthSubmitting(true);
    try {
      const user = await authenticateMember(pendingMember.id, loginPassword);
      if (isFirstLogin(user)) {
        // Primera vez que esta cuenta inicia sesión: la contraseña era temporal, exige una propia.
        setAuthPhase('newPassword');
      } else {
        await proceedToStep2(pendingMember);
      }
    } catch (err) {
      setAuthError(authErrorMessage(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleNewPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingMember) return;
    const validationError = validateNewPassword(newPassword1, newPassword2);
    if (validationError) {
      setAuthError(validationError);
      return;
    }

    setAuthError('');
    setAuthSubmitting(true);
    try {
      await setNewPassword(newPassword1);
      await proceedToStep2(pendingMember);
    } catch (err) {
      setAuthError(authErrorMessage(err));
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceholderChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      placeholderAnswers: { ...prev.placeholderAnswers, [key]: value },
    }));
    setOpenDropdownKey(null);
    setCustomEntryKey(null);
  };

  const openCustomEntry = (key: string, prefill: string) => {
    setCustomEntryDraft(prefill);
    setCustomEntryKey(key);
    setOpenDropdownKey(null);
  };

  const commitCustomEntry = (key: string) => {
    const value = customEntryDraft.trim();
    if (value) handlePlaceholderChange(key, value);
    setCustomEntryKey(null);
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 2 || !selectedMember) return;

    setSaveError('');
    setSaving(true);
    try {
      // Ya quedó autenticado como selectedMember al elegir el perfil.
      // update() hace merge parcial en Firebase — no borra lo que guardaron los demás.
      await saveCuestionarioAnswers(formData.placeholderAnswers);
      setJustSaved(true);
      setCurrentStep(3);
    } catch {
      setSaveError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedMember(null);
    setCurrentStep(1);
    setJustSaved(false);
    setOpenDropdownKey(null);
    setSaveError('');
    setFormData(EMPTY_FORM);
  };

  const categoriesToDisplay = selectedMember ? getPlaceholderCategoriesForMember(selectedMember.id) : [];

  return (
    <div className="cuestionario-wizard-wrapper">
      {/* ── Wizard Step Indicator ─────────────────────────────────── */}
      <div className="wizard-progress-bar">
        <div className={`wizard-step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
          <div className="wizard-step-circle">
            {currentStep > 1 ? <CheckCircle2 size={16} /> : '1'}
          </div>
          <span className="wizard-step-label">Perfil Integrante</span>
        </div>

        <div className="wizard-step-line" />

        <div className={`wizard-step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`}>
          <div className="wizard-step-circle">
            {currentStep > 2 ? <CheckCircle2 size={16} /> : '2'}
          </div>
          <span className="wizard-step-label">Tecnologías</span>
        </div>

        <div className="wizard-step-line" />

        <div className={`wizard-step-item ${currentStep === 3 ? 'active' : ''}`}>
          <div className="wizard-step-circle">3</div>
          <span className="wizard-step-label">Confirmación</span>
        </div>
      </div>

      {/* ── Step Content Animation ────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ════════════════════════════════════════════════════════════
            PASO 1: SELECCIÓN DE PERFIL ESTILO NETFLIX
            ════════════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="netflix-profile-section"
          >
            <h2 className="netflix-title">¿Quién está registrando?</h2>
            <p className="netflix-subtitle">
              Selecciona la mente detrás del proyecto para cargar tus categorías técnicas.
            </p>

            <div className="netflix-profiles-grid">
              {TEAM_MEMBERS.map((m) => {
                const isSelected = selectedMember?.id === m.id;
                return (
                  <motion.div
                    key={m.id}
                    className={`netflix-profile-card ${isSelected ? 'selected' : ''}`}
                    whileHover={{ scale: 1.08, y: -6 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleCardClick(m)}
                  >
                    <div
                      className="netflix-avatar-wrapper"
                      style={{
                        borderColor: m.color,
                        boxShadow: `0 8px 30px ${m.color}35`,
                      }}
                    >
                      <img
                        src={m.avatarUrl}
                        alt={m.name}
                        className="netflix-avatar-img"
                      />
                    </div>

                    <h3 className="netflix-profile-name">{m.name}</h3>

                    <div
                      className="netflix-profile-role"
                      style={{
                        color: m.color,
                        borderColor: `${m.color}40`,
                        background: `${m.color}15`,
                      }}
                    >
                      {m.role.split('·')[0].trim()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PASO 2: SELECCIÓN DE TECNOLOGÍAS Y HERRAMIENTAS
            ════════════════════════════════════════════════════════════ */}
        {currentStep === 2 && selectedMember && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="form-step-container"
          >
            <div className="form-step-header">
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#FFF' }}>
                  Paso 2: Tecnologías y Herramientas
                </h3>
                <p style={{ fontSize: '13px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                  Selecciona qué estás usando o vas a usar en cada frente de tu área.
                </p>
              </div>

              {/* Active Profile Pill */}
              <div className="active-profile-pill">
                <img
                  src={selectedMember.avatarUrl}
                  alt={selectedMember.name}
                  className="active-profile-avatar"
                  style={{ borderColor: selectedMember.color }}
                />
                <div>
                  <div className="active-profile-name">{selectedMember.name}</div>
                  <span style={{ fontSize: '11px', color: selectedMember.color }}>
                    {selectedMember.initials}
                  </span>
                </div>
                <button
                  type="button"
                  className="change-profile-btn"
                  onClick={() => setCurrentStep(1)}
                >
                  Cambiar
                </button>
              </div>
            </div>

            <form onSubmit={handleNextStep}>
              {/* ── Tecnologías atadas al Cronograma (rellenan los "____") ─── */}
              <div style={{ marginBottom: '24px' }}>
                <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 14px 0' }}>
                  Cada selección llena el espacio en blanco correspondiente en el Cronograma de tu categoría.
                </p>

                {categoriesToDisplay.map((cat) => (
                  <div key={cat.catId} className="form-category-block">
                    <h4 className="category-header-title">
                      {cat.iconName === 'Bot' && <Bot size={18} style={{ color: selectedMember.color }} />}
                      {cat.iconName === 'BrainCircuit' && <BrainCircuit size={18} style={{ color: selectedMember.color }} />}
                      {cat.iconName === 'Server' && <Server size={18} style={{ color: selectedMember.color }} />}
                      {cat.iconName === 'Layout' && <Layout size={18} style={{ color: selectedMember.color }} />}
                      <span>{cat.title}</span>
                    </h4>
                    <div className="tech-placeholder-grid">
                      {cat.placeholders.map((ph) => {
                        const currentValue = formData.placeholderAnswers[ph.key] ?? ph.defaultTech;
                        const isUndefined = currentValue === '';
                        const isCustomValue = !isUndefined && !ph.options.includes(currentValue);
                        const displayValue = isUndefined ? 'Sin definir' : currentValue;
                        const isOpen = openDropdownKey === ph.key;
                        const isCustomEntryOpen = customEntryKey === ph.key;
                        const wrapOpen = isOpen || isCustomEntryOpen;

                        return (
                          <div className="form-group" key={ph.key}>
                            <label className="form-label">{ph.label}</label>
                            <div className={`crono-dd-wrap tech-select-wrap ${wrapOpen ? 'dd-open' : ''}`}>
                              <button
                                type="button"
                                className={`crono-dd-trigger tech-select-trigger ${isUndefined ? 'tech-select-undefined' : ''}`}
                                onClick={() => {
                                  if (isCustomEntryOpen) { setCustomEntryKey(null); return; }
                                  setOpenDropdownKey(isOpen ? null : ph.key);
                                }}
                              >
                                <span className="crono-dd-text">{displayValue}</span>
                                <ChevronDown size={14} className={`crono-dd-chevron ${wrapOpen ? 'open' : ''}`} />
                              </button>

                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.18 }}
                                    className="crono-dd-menu tech-select-menu"
                                  >
                                    {ph.options.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => handlePlaceholderChange(ph.key, opt)}
                                        className={`crono-dd-item ${opt === currentValue ? 'active' : ''}`}
                                      >
                                        <span className="crono-dd-item-label">{opt}</span>
                                        {opt === currentValue && <Check size={14} className="crono-dd-check" />}
                                      </button>
                                    ))}

                                    <button
                                      type="button"
                                      onClick={() => handlePlaceholderChange(ph.key, '')}
                                      className={`crono-dd-item tech-undefined-item ${isUndefined ? 'active' : ''}`}
                                    >
                                      <span className="crono-dd-item-label">Sin definir</span>
                                      {isUndefined && <Check size={14} className="crono-dd-check" />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openCustomEntry(ph.key, isCustomValue ? currentValue : '')}
                                      className={`crono-dd-item tech-other-item ${isCustomValue ? 'active' : ''}`}
                                    >
                                      <span className="crono-dd-item-label">
                                        Otro{isCustomValue ? `: ${currentValue}` : ''}
                                      </span>
                                      {isCustomValue && <Check size={14} className="crono-dd-check" />}
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <AnimatePresence>
                                {isCustomEntryOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.18 }}
                                    className="crono-dd-menu tech-select-menu tech-select-custom-panel"
                                  >
                                    <input
                                      type="text"
                                      autoFocus
                                      className="tech-select-custom-input"
                                      placeholder="Escribe la tecnología / herramienta..."
                                      value={customEntryDraft}
                                      onChange={(e) => setCustomEntryDraft(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') { e.preventDefault(); commitCustomEntry(ph.key); }
                                        if (e.key === 'Escape') { setCustomEntryKey(null); }
                                      }}
                                    />
                                    <div className="tech-select-custom-actions">
                                      <button
                                        type="button"
                                        className="tech-select-custom-btn cancel"
                                        onClick={() => setCustomEntryKey(null)}
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="button"
                                        className="tech-select-custom-btn save"
                                        onClick={() => commitCustomEntry(ph.key)}
                                      >
                                        Guardar
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* ── Otros (Personalizados) ──────────────────────────── */}
                <div className="form-category-block">
                  <h4 className="category-header-title">
                    <PlusCircle size={17} style={{ color: selectedMember.color }} /> Otros (Especificar adicionales)
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#9CA3AF', margin: '0 0 10px 0' }}>
                    Si usaste otras herramientas, modelos o componentes que no están en la lista, agrégalos aquí:
                  </p>
                  <input
                    type="text"
                    className="checkbox-custom-input"
                    placeholder="Ej. Docker, Redis, PyTorch 2.0, LangChain..."
                    value={formData.customOtro}
                    onChange={(e) => handleInputChange('customOtro', e.target.value)}
                  />
                </div>

                {/* ── Notas Adicionales (Opcional) ────────────────────── */}
                <div className="form-category-block">
                  <h4 className="category-header-title">
                    <Sparkles size={17} style={{ color: selectedMember.color }} /> Notas Adicionales (Opcional)
                  </h4>
                  <textarea
                    className="form-textarea"
                    placeholder="Observaciones sobre por qué elegiste estas tecnologías, dudas, etc..."
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  />
                </div>
              </div>

              {saveError && (
                <p style={{ color: '#F87171', fontSize: '12.5px', fontWeight: 600, margin: '0 0 16px 0' }}>
                  {saveError}
                </p>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCurrentStep(1)}
                  disabled={saving}
                >
                  <ArrowLeft size={16} /> Volver a Perfiles
                </button>

                <button type="submit" className="btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? 'Guardando...' : 'Guardar y Continuar'} <ArrowRight size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PASO 3: CONFIRMACIÓN Y RESUMEN
            ════════════════════════════════════════════════════════════ */}
        {currentStep === 3 && selectedMember && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="form-step-container"
            style={{ textAlign: 'center', padding: '48px 32px' }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid #10B981',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
              }}
            >
              <CheckCircle2 size={38} />
            </div>

            <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#FFF', margin: '0 0 8px 0' }}>
              ¡Registro Exitoso!
            </h3>
            <p style={{ fontSize: '14.5px', color: '#9CA3AF', maxWidth: '520px', margin: '0 auto 12px auto' }}>
              Las tecnologías han sido registradas correctamente por{' '}
              <strong style={{ color: selectedMember.color }}>{selectedMember.name}</strong>.
            </p>

            {justSaved && (
              <p style={{ fontSize: '12.5px', color: '#34D399', maxWidth: '520px', margin: '0 auto 28px auto', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <Save size={13} /> Guardadas y sincronizadas — ya están disponibles en el Cronograma para todo el equipo.
              </p>
            )}

            {/* Summary Box */}
            <div
              style={{
                background: 'rgba(11, 15, 25, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '22px 26px',
                maxWidth: '680px',
                margin: '0 auto 32px auto',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Sparkles size={18} style={{ color: selectedMember.color }} />
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFF' }}>
                  Tecnologías Registradas
                </span>
              </div>

              {formData.descripcion && (
                <p style={{ fontSize: '13.5px', color: '#D1D5DB', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  {formData.descripcion}
                </p>
              )}

              {/* Selected Techs Tags */}
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {Object.values(formData.placeholderAnswers).filter(Boolean).map((t, idx) => (
                    <span
                      key={`${t}-${idx}`}
                      style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60A5FA',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                  {formData.customOtro && (
                    <span
                      style={{
                        background: `${selectedMember.color}20`,
                        border: `1px solid ${selectedMember.color}40`,
                        color: selectedMember.color,
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      + {formData.customOtro}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft size={16} /> Editar Selección
              </button>

              <button
                type="button"
                className="btn-primary"
                onClick={handleReset}
              >
                <FilePlus size={16} /> Nuevo Registro
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Login por perfil: contraseña, con cambio obligatorio la primera vez ── */}
      <AnimatePresence>
        {pendingMember && authPhase && (
          <div className="crono-verify-overlay" onClick={closeLoginModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              className="crono-verify-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="crono-verify-header">
                <div className="crono-verify-header-title">
                  <ShieldCheck size={18} style={{ color: pendingMember.color }} />
                  <span>
                    {authPhase === 'password'
                      ? `Hola, ${pendingMember.name.split(' ')[0]}`
                      : 'Crea tu propia contraseña'}
                  </span>
                </div>
                <button type="button" className="crono-gcal-close" onClick={closeLoginModal}>
                  <X size={16} />
                </button>
              </div>

              {authPhase === 'password' && (
                <form onSubmit={handleLoginSubmit}>
                  <p className="crono-verify-subtitle">Ingresa tu contraseña para continuar.</p>
                  <div className="crono-verify-field">
                    <label className="crono-verify-label">Contraseña</label>
                    <PasswordInput
                      autoFocus
                      placeholder="••••••••"
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={setLoginPassword}
                    />
                  </div>

                  {authError && <p className="crono-verify-form-error">{authError}</p>}

                  <div className="crono-verify-actions">
                    <button type="button" className="crono-cal-nav-btn" onClick={closeLoginModal} disabled={authSubmitting}>
                      Cancelar
                    </button>
                    <button type="submit" className="crono-verify-confirm-btn" disabled={authSubmitting}>
                      <ShieldCheck size={15} /> {authSubmitting ? 'Verificando...' : 'Ingresar'}
                    </button>
                  </div>
                </form>
              )}

              {authPhase === 'newPassword' && (
                <form onSubmit={handleNewPasswordSubmit}>
                  <p className="crono-verify-subtitle">
                    Es tu primer ingreso: la contraseña que usaste era temporal. Crea una propia
                    (mínimo 6 caracteres) para seguir usándola de aquí en adelante.
                  </p>
                  <NewPasswordFields
                    password1={newPassword1}
                    onPassword1Change={setNewPassword1}
                    password2={newPassword2}
                    onPassword2Change={setNewPassword2}
                  />

                  {authError && <p className="crono-verify-form-error">{authError}</p>}

                  <div className="crono-verify-actions">
                    <button type="button" className="crono-cal-nav-btn" onClick={closeLoginModal} disabled={authSubmitting}>
                      Cancelar
                    </button>
                    <button type="submit" className="crono-verify-confirm-btn" disabled={authSubmitting}>
                      <ShieldCheck size={15} /> {authSubmitting ? 'Guardando...' : 'Guardar Contraseña y Continuar'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
