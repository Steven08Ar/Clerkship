import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight, Calendar, FileText, Sparkles, Sun, Moon } from 'lucide-react';
import logoUrl from '../../assets/Logo Clerkship.svg';

interface HeaderNavProps {
  activeTab?: 'inicio' | 'como-funciona' | 'cronograma';
}

export default function HeaderNav({ activeTab }: HeaderNavProps) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('clerkship_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('clerkship_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isCurrent = (tab: string, route: string) => {
    if (activeTab) return activeTab === tab;
    return pathname === route;
  };

  const isAuthenticated =
    localStorage.getItem('clerkship_auth') === 'true' ||
    localStorage.getItem('clerkship_consent') === 'accepted';

  return (
    <>
      <nav className="lp-nav">
        {/* ── Logo Left ────────────────────────────────────────── */}
        <div className="lp-nav-left">
          <Link to="/" className="lp-logo" onClick={() => setMobileOpen(false)}>
            <img src={logoUrl} alt="Clerkship" className="lp-logo-img" />
            Clerkship
          </Link>
        </div>

        {/* ── Centered Navigation Links (Desktop) ── */}
        <div className="lp-navlinks-centered">
          <Link
            to="/"
            className={`lp-navlink ${isCurrent('inicio', '/') ? 'lp-navlink-on' : ''}`}
          >
            Inicio
          </Link>

          <Link
            to="/proyecto"
            className={`lp-navlink ${isCurrent('como-funciona', '/proyecto') ? 'lp-navlink-on' : ''}`}
          >
            Cómo funciona
          </Link>

          <Link
            to="/cronograma"
            className={`lp-navlink ${isCurrent('cronograma', '/cronograma') ? 'lp-navlink-on' : ''}`}
          >
            Cronograma
          </Link>
        </div>

        {/* ── Actions Right (Desktop) ────────────────────────────── */}
        <div className="lp-nav-actions">
          <div className="lp-lang-toggle">
            <span className="lp-lang-on">ES</span>
            <div className="lp-lang-switch"></div>
          </div>

          {isAuthenticated ? (
            <Link to="/dashboard" className="lp-btn-solid">Ir al Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="lp-btn-outline">Ingresar</Link>
              <Link to="/register" className="lp-btn-solid">Registrarse</Link>
            </>
          )}
        </div>

        {/* ── Botones Móvil: Tema + Hamburguesa ─────────────────── */}
        <div className="lp-mobile-nav-controls">
          <button
            type="button"
            className="lp-header-theme-toggle-btn-mobile"
            onClick={toggleTheme}
            aria-label="Cambiar tema modo claro/oscuro"
          >
            {theme === 'dark' ? <Sun size={20} style={{ color: '#FBBF24' }} /> : <Moon size={20} style={{ color: '#4F46E5' }} />}
          </button>

          <button
            className="lp-hamburger-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menú"
            type="button"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* ── Menú Desplegable Móvil (Drawer Overlay) ───────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lp-mobile-drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              className="lp-mobile-drawer-content"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lp-mobile-drawer-header">
                <div className="lp-logo">
                  <img src={logoUrl} alt="Clerkship" className="lp-logo-img" />
                  <span>Clerkship</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="lp-header-theme-toggle-btn-mobile"
                    onClick={toggleTheme}
                    aria-label="Cambiar tema"
                  >
                    {theme === 'dark' ? <Sun size={20} style={{ color: '#FBBF24' }} /> : <Moon size={20} style={{ color: '#4F46E5' }} />}
                  </button>

                  <button
                    className="lp-mobile-close-btn"
                    onClick={() => setMobileOpen(false)}
                    type="button"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="lp-mobile-menu-links">
                <Link
                  to="/"
                  className={`lp-mobile-menu-item ${isCurrent('inicio', '/') ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Sparkles size={16} /> Inicio
                </Link>

                <Link
                  to="/proyecto"
                  className={`lp-mobile-menu-item ${isCurrent('como-funciona', '/proyecto') ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <FileText size={16} /> Cómo funciona
                </Link>

                <Link
                  to="/cronograma"
                  className={`lp-mobile-menu-item ${isCurrent('cronograma', '/cronograma') ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Calendar size={16} /> Cronograma
                </Link>
              </div>

              <div className="lp-mobile-drawer-footer">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    className="lp-mobile-btn-solid"
                    onClick={() => setMobileOpen(false)}
                  >
                    Ir al Dashboard <ArrowRight size={16} />
                  </Link>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                    <Link
                      to="/login"
                      className="lp-mobile-btn-outline"
                      onClick={() => setMobileOpen(false)}
                    >
                      Ingresar
                    </Link>
                    <Link
                      to="/register"
                      className="lp-mobile-btn-solid"
                      onClick={() => setMobileOpen(false)}
                    >
                      Registrarse <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
