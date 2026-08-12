import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff, User,
  AlertCircle, ArrowLeft, ArrowRight,
} from 'lucide-react';
import logoUrl from '../../assets/Logo Clerkship.svg';

/* ── Tipos ─────────────────────────────────────────────── */
interface FormState {
  name: string;
  email: string;
  password: string;
}
interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

/* ── Validación ────────────────────────────────────────── */
function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!form.name.trim())
    errors.name = 'El nombre es requerido.';
  if (!form.email.trim())
    errors.email = 'El correo es requerido.';
  else if (!emailRx.test(form.email))
    errors.email = 'Ingresa un correo electrónico válido.';
  if (!form.password)
    errors.password = 'La contraseña es requerida.';
  else if (form.password.length < 6)
    errors.password = 'Mínimo 6 caracteres.';
  return errors;
}

/* ══════════════════════════════════════════════════════════
   RegisterPage
══════════════════════════════════════════════════════════ */
export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors])
      setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setErrors({});

    /* Simula llamada al backend (prototipo) */
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);

    navigate('/login', { replace: true });
  }

  return (
    <div className="auth-shell">
      {/* ── Cuerpo centrado ─────────────────────────────────────── */}
      <div className="auth-body">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo centrado */}
          <Link to="/" className="auth-logo-center">
            <img src={logoUrl} alt="Clerkship" />
            Clerkship
          </Link>

          {/* Cabecera */}
          <div className="auth-card-head">
            <h1 className="auth-title">Crear Cuenta</h1>
            <p className="auth-subtitle">
              Regístrate para empezar a utilizar el prototipo.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Name */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-name">
                Nombre completo
              </label>
              <div className={`auth-input-wrap${errors.name ? ' has-error' : ''}`}>
                <User size={18} className="auth-input-icon" />
                <input
                  id="auth-name"
                  type="text"
                  className="auth-input"
                  placeholder="Ej. Dra. Ana Gómez"
                  value={form.name}
                  onChange={e => patch('name', e.target.value)}
                  autoComplete="name"
                  autoFocus
                />
              </div>
              <AnimatePresence>
                {errors.name && (
                  <motion.p
                    className="auth-field-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle size={14} />
                    {errors.name}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-email">
                Correo institucional
              </label>
              <div className={`auth-input-wrap${errors.email ? ' has-error' : ''}`}>
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  placeholder="correo@institucion.edu.co"
                  value={form.email}
                  onChange={e => patch('email', e.target.value)}
                  autoComplete="email"
                />
              </div>
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    className="auth-field-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle size={14} />
                    {errors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Contraseña */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">
                Contraseña
              </label>
              <div className={`auth-input-wrap${errors.password ? ' has-error' : ''}`}>
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="auth-password"
                  type={showPass ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => patch('password', e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPass(v => !v)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    className="auth-field-error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <AlertCircle size={14} />
                    {errors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Error general */}
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  className="auth-general-error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <AlertCircle size={18} />
                  {errors.general}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              className="auth-submit"
              disabled={loading}
              whileTap={loading ? {} : { scale: 0.98 }}
            >
              {loading ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  Crear cuenta <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Link a login */}
          <div style={{ marginBottom: 24, textAlign: 'center', fontSize: '0.9rem', color: 'var(--ink2)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}>
              Inicia sesión
            </Link>
          </div>

          {/* Aviso de IA */}
          <div className="auth-ai-notice">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} color="var(--ink3)" />
            <p>
              Este prototipo utiliza{' '}
              <strong>Inteligencia Artificial generativa</strong>. Las respuestas
              son producidas automáticamente y no constituyen diagnóstico médico.
            </p>
          </div>

          <Link to="/" className="auth-back-link">
            <ArrowLeft size={16} /> Volver al inicio
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
