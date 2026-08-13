import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Lock, Eye, EyeOff,
  AlertCircle, ArrowLeft, ArrowRight,
} from 'lucide-react';
import logoUrl from '../../assets/Logo Clerkship.svg';
import SplineBackground from '../../components/three/SplineBackground';

/* ── Tipos ─────────────────────────────────────────────── */
interface FormState {
  email: string;
  password: string;
  remember: boolean;
}
interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/* ── Validación ────────────────────────────────────────── */
function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
   LoginPage
══════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({ email: '', password: '', remember: false });
  const [errors, setErrors]    = useState<FormErrors>({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors])
      setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});

    await new Promise(r => setTimeout(r, 900));
    setLoading(false);

    /* 1. Pass isLogged=true → GSAP particles assemble
       2. Card fades out via AnimatePresence
       3. onExitComplete waits then navigates                */
    setIsLogged(true);
    setSuccess(true);
    localStorage.setItem('clerkship_auth', 'true');
  }

  function handleExitComplete() {
    const hasConsent = localStorage.getItem('clerkship_consent') === 'accepted';
    /* Wait for GSAP assembly animation (~2.5s) before navigating */
    setTimeout(() => {
      navigate(hasConsent ? '/dashboard' : '/consent', { replace: true });
    }, 2600);
  }

  return (
    <div className="auth-shell auth-shell-spline">

      {/* ── Spline animated background — receives isLogged to trigger assembly ── */}
      <SplineBackground isLogged={isLogged} />

      {/* ── Card (animates out on success) ── */}
      <div className="auth-body">
        <AnimatePresence onExitComplete={handleExitComplete}>
          {!success && (
            <motion.div
              className="auth-card auth-card-glass"
              key="login-card"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1    }}
              exit={{
                opacity: 0,
                scale: 0.88,
                y: -32,
                filter: 'blur(12px)',
                transition: { duration: 0.55, ease: [0.4, 0, 1, 1] },
              }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Logo */}
              <Link to="/" className="auth-logo-center">
                <img src={logoUrl} alt="Clerkship" />
                Clerkship
              </Link>

              {/* Cabecera */}
              <div className="auth-card-head">
                <h1 className="auth-title">Bienvenido</h1>
                <p className="auth-subtitle">
                  Accede con tu correo institucional para explorar el prototipo.
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="auth-form" noValidate>

                {/* Email */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-email">Correo institucional</label>
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
                      autoFocus
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p className="auth-field-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AlertCircle size={14} />{errors.email}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Contraseña */}
                <div className="auth-field">
                  <label className="auth-label" htmlFor="auth-password">Contraseña</label>
                  <div className={`auth-input-wrap${errors.password ? ' has-error' : ''}`}>
                    <Lock size={18} className="auth-input-icon" />
                    <input
                      id="auth-password"
                      type={showPass ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => patch('password', e.target.value)}
                      autoComplete="current-password"
                    />
                    <button type="button" className="auth-eye-btn"
                      onClick={() => setShowPass(v => !v)}
                      aria-label={showPass ? 'Ocultar' : 'Mostrar'}
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p className="auth-field-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <AlertCircle size={14} />{errors.password}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Recordarme */}
                <div className="auth-options-row">
                  <label className="auth-check-label">
                    <input type="checkbox" className="auth-check"
                      checked={form.remember}
                      onChange={e => patch('remember', e.target.checked)}
                    />
                    Recordarme
                  </label>
                  <a href="#" className="auth-forgot">¿Olvidaste tu contraseña?</a>
                </div>

                {/* Error general */}
                <AnimatePresence>
                  {errors.general && (
                    <motion.div className="auth-general-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <AlertCircle size={18} />{errors.general}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button type="submit" className="auth-submit"
                  disabled={loading}
                  whileTap={loading ? {} : { scale: 0.98 }}
                >
                  {loading ? (
                    <span className="auth-spinner" />
                  ) : (
                    <>Acceder al prototipo <ArrowRight size={18} /></>
                  )}
                </motion.button>
              </form>

              {/* Link registro */}
              <div style={{ marginBottom: 24, textAlign: 'center', fontSize: '0.9rem' }}>
                ¿No tienes cuenta?{' '}
                <Link to="/register" style={{ fontWeight: 600, textDecoration: 'none' }}>
                  Regístrate
                </Link>
              </div>

              {/* Aviso IA */}
              <div className="auth-ai-notice">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <p>
                  Este prototipo utiliza <strong>Inteligencia Artificial generativa</strong>.
                  Las respuestas son producidas automáticamente y no constituyen diagnóstico médico.
                </p>
              </div>

              <Link to="/" className="auth-back-link">
                <ArrowLeft size={16} /> Volver al inicio
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
