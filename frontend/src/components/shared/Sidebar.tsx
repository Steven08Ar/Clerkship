import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { ChevronLeft, ChevronDown, Settings, LogOut, User, Sun, Moon } from 'lucide-react';
import { DASH_NAV } from '../../data/dashNav';
import { auth } from '../../data/firebase';
import { getInitialTheme, triggerThemeToggle, type ThemeMode } from '../../utils/themeHelper';
import { logoutUserSession } from '../../utils/authConsent';
import { useCurrentUser } from '../../utils/currentUser';
import logoUrl from '../../assets/Logo Clerkship.svg';

/* ── Panel content per section ─────────────────────────────── */
interface PanelItem {
  label: string;
  route?: string;
  dot?: string;
}
interface PanelGroup {
  label: string;
  items: PanelItem[];
}
interface PanelSection {
  flat: PanelItem[];
  groups?: PanelGroup[];
}

const PANEL: Record<string, PanelSection> = {
  overview: {
    flat: [
      { label: 'Inicio',          route: '/dashboard'  },
      { label: 'Casos clínicos',  route: '/casos'      },
      { label: 'Biblioteca',      route: '/biblioteca' },
    ],
  },
  casos: {
    flat: [
      { label: 'Todos los casos', route: '/casos' },
    ],
    groups: [
      {
        label: 'Por módulo',
        items: [
          { label: 'Gastroenterología', route: '/casos?modulo=Gastroenterología', dot: '#E11D48' },
        ],
      },
    ],
  },
  historial: {
    flat: [
      { label: 'Sesiones recientes', route: '/historial' },
    ],
  },
  biblioteca: {
    flat: [
      { label: 'Todos los recursos', route: '/biblioteca' },
    ],
  },
  chats: {
    flat: [
      { label: 'Todos los chats', route: '/chats' },
    ],
    groups: [
      {
        label: 'Conversaciones',
        items: [
          { label: 'Preceptores', route: '/chats?tipo=direct', dot: '#00B3F8' },
          { label: 'Casos Clínicos', route: '/chats?tipo=group', dot: '#6366F1' },
          { label: 'Comunidad', route: '/chats?tipo=public', dot: '#10B981' },
        ],
      },
    ],
  },
};

/* ── Helpers ────────────────────────────────────────────────── */
function getModuloFromRoute(route: string): string | null {
  const q = route.split('?')[1];
  return q ? new URLSearchParams(q).get('modulo') : null;
}

/* ════════════════════════════════════════════════════════════
   Sidebar
════════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'clerkship_sb_open';

export default function Sidebar() {
  const navigate              = useNavigate();
  const { pathname }          = useLocation();
  const [searchParams]        = useSearchParams();
  const activeModulo          = searchParams.get('modulo');
  const currentUser           = useCurrentUser();

  const [panelOpen, setPanelOpenRaw] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? true : saved === 'true';
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    const handleThemeChange = (e: Event) => {
      const customEv = e as CustomEvent<ThemeMode>;
      if (customEv.detail) setTheme(customEv.detail);
    };
    window.addEventListener('clerkship-theme-change', handleThemeChange);
    return () => window.removeEventListener('clerkship-theme-change', handleThemeChange);
  }, []);

  function handleToggleTheme() {
    const next = triggerThemeToggle(theme);
    setTheme(next);
  }

  const initialId = DASH_NAV.find(t => t.route === pathname)?.id ?? 'overview';
  const [activeId, setActiveId] = useState(initialId);

  /* Auto-open the group that contains the current active sub-item */
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    const section = PANEL[initialId];
    if (!section.groups || !activeModulo) return null;
    return section.groups.find(g =>
      g.items.some(i => i.route && getModuloFromRoute(i.route) === activeModulo)
    )?.label ?? null;
  });

  useEffect(() => {
    const section = PANEL[activeId];
    if (!section.groups) return;
    if (!activeModulo) return;
    const group = section.groups.find(g =>
      g.items.some(i => i.route && getModuloFromRoute(i.route) === activeModulo)
    );
    if (group) setOpenGroup(group.label);
  }, [activeModulo, activeId]);

  function setPanelOpen(value: boolean | ((prev: boolean) => boolean)) {
    setPanelOpenRaw(prev => {
      const next = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }

  const activeTab    = DASH_NAV.find(t => t.id === activeId)!;
  const panelContent = PANEL[activeId];

  /* Active state helpers */
  function isFlatActive(route: string | undefined) {
    if (!route) return false;
    // For plain routes (no query), match pathname exactly
    if (!route.includes('?')) return route === pathname && !activeModulo;
    // For routes with query, match both pathname and modulo
    const modulo = getModuloFromRoute(route);
    return route.split('?')[0] === pathname && modulo === activeModulo;
  }

  function isSubActive(route: string | undefined) {
    if (!route) return false;
    const modulo = getModuloFromRoute(route);
    if (modulo) return route.split('?')[0] === pathname && modulo === activeModulo;
    return route === pathname && !activeModulo;
  }

  /* Handle item navigation */
  function handleItemClick(route: string | undefined) {
    if (!route) return;
    navigate(route);
  }

  /* Close profile dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (profileOpen || settingsOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen, settingsOpen]);

  function handleNavClick(id: string, route: string | null) {
    if (activeId === id) {
      setPanelOpen(v => !v);
    } else {
      setActiveId(id);
      setOpenGroup(null);
    }
    if (route && route !== pathname) navigate(route);
  }

  return (
    <div className="sb">

      {/* ── Left Rail ─────────────────────────────────────── */}
      <div
        className={`sb-rail${!panelOpen ? ' sb-rail-closed' : ''}`}
        onClick={(e) => {
          if (!panelOpen && !(e.target as HTMLElement).closest('button')) {
            setPanelOpen(true);
          }
        }}
      >

        {/* Logo */}
        <button
          className="sb-rail-logo"
          onClick={() => navigate('/dashboard')}
        >
          <img src={logoUrl} alt="Clerkship" />
        </button>

        {/* Nav icons */}
        <nav className="sb-rail-nav">
          {DASH_NAV.map(({ id, label, Icon, route }) => {
            const on = activeId === id && panelOpen;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.82, rotate: -8 }}
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 450, damping: 17 }}
                className={`sb-icon-btn${on ? ' sb-icon-btn-on' : ''}`}
                title={label}
                onClick={() => handleNavClick(id, route)}
              >
                <motion.div
                  animate={on ? { scale: [1, 1.25, 0.95, 1], rotate: [0, -12, 6, 0] } : { scale: 1, rotate: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <Icon size={19} strokeWidth={on ? 2.2 : 1.65} />
                </motion.div>
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom: Settings + Theme Toggle + Profile */}
        <div className="sb-rail-bottom">
          {/* Botón directo de alternancia de tema */}
          <motion.button
            whileTap={{ scale: 0.80, rotate: 180 }}
            whileHover={{ scale: 1.08 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className="sb-icon-btn"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            onClick={handleToggleTheme}
          >
            {theme === 'dark' ? (
              <Sun size={19} strokeWidth={1.8} className="sb-sun-icon" />
            ) : (
              <Moon size={19} strokeWidth={1.8} className="sb-moon-icon" />
            )}
          </motion.button>

          {/* Configuración Popover */}
          <div className="sb-settings-wrap" ref={settingsRef}>
            <motion.button
              whileTap={{ scale: 0.82, rotate: 45 }}
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className={`sb-icon-btn${settingsOpen ? ' sb-icon-btn-on' : ''}`}
              title="Configuración"
              onClick={() => setSettingsOpen(v => !v)}
            >
              <Settings size={19} strokeWidth={1.65} />
            </motion.button>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  className="sb-profile-menu sb-settings-popover"
                  initial={{ opacity: 0, x: -8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0,  scale: 1    }}
                  exit={{    opacity: 0, x: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="sb-profile-head">
                    <div className="sb-profile-avatar" style={{ background: 'var(--p)', color: '#fff' }}>
                      <Settings size={15} strokeWidth={2} />
                    </div>
                    <div>
                      <p className="sb-profile-name">Configuración</p>
                      <p className="sb-profile-role">Preferencias del sistema</p>
                    </div>
                  </div>

                  <div className="sb-profile-divider" />

                  {/* Selector de Modo Claro / Oscuro */}
                  <div className="sb-theme-section">
                    <span className="sb-theme-label">Modo de pantalla</span>
                    <div className="sb-theme-pill-group">
                      <button
                        className={`sb-theme-pill ${theme === 'light' ? 'is-active' : ''}`}
                        onClick={() => { if (theme !== 'light') handleToggleTheme(); }}
                      >
                        <Sun size={14} /> Claro
                      </button>
                      <button
                        className={`sb-theme-pill ${theme === 'dark' ? 'is-active' : ''}`}
                        onClick={() => { if (theme !== 'dark') handleToggleTheme(); }}
                      >
                        <Moon size={14} /> Oscuro
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="sb-profile-wrap" ref={profileRef}>
            <motion.button
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className={`sb-avatar-btn${profileOpen ? ' sb-avatar-btn-open' : ''}`}
              onClick={() => setProfileOpen(v => !v)}
              title={currentUser?.name || 'Perfil'}
            >
              {currentUser ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="sb-avatar-btn-img" />
              ) : (
                '··'
              )}
            </motion.button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  className="sb-profile-menu"
                  initial={{ opacity: 0, x: -8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0,  scale: 1    }}
                  exit={{    opacity: 0, x: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="sb-profile-head">
                    <div className="sb-profile-avatar sb-profile-avatar-img-wrap">
                      {currentUser ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="sb-profile-avatar-img" />
                      ) : (
                        '··'
                      )}
                    </div>
                    <div>
                      <p className="sb-profile-name">{currentUser?.name || 'Invitado'}</p>
                      <p className="sb-profile-role">{currentUser?.role || 'Sin sesión activa'}</p>
                    </div>
                  </div>
                  <div className="sb-profile-divider" />
                  <button className="sb-profile-item">
                    <User size={14} strokeWidth={1.8} /> Mi perfil
                  </button>
                  <button
                    className="sb-profile-item"
                    onClick={() => {
                      setProfileOpen(false);
                      setSettingsOpen(true);
                    }}
                  >
                    <Settings size={14} strokeWidth={1.8} /> Configuración
                  </button>
                  <button className="sb-profile-item" onClick={handleToggleTheme}>
                    {theme === 'dark' ? <Sun size={14} strokeWidth={1.8} /> : <Moon size={14} strokeWidth={1.8} />}
                    Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}
                  </button>
                  <div className="sb-profile-divider" />
                  <button
                    className="sb-profile-item sb-profile-item-danger"
                    onClick={async () => {
                      logoutUserSession();
                      try {
                        await signOut(auth);
                      } catch {
                        // Sin sesión de Firebase activa
                      }
                      navigate('/', { replace: true });
                    }}
                  >
                    <LogOut size={14} strokeWidth={1.8} /> Cerrar sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Expandable Panel (Deshabilitado únicamente para Chats) ──────────────────────────────── */}
      <AnimatePresence initial={false}>
        {panelOpen && activeId !== 'chats' && pathname !== '/chats' && (
          <motion.div
            className="sb-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 248, opacity: 1 }}
            exit={{    width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="sb-panel-inner">

              {/* Header */}
              <div className="sb-panel-head">
                <span className="sb-panel-title">{activeTab.label}</span>
                <button
                  className="sb-panel-close"
                  onClick={() => setPanelOpen(false)}
                  title="Cerrar panel"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* Flat items */}
              <div className="sb-panel-section">
                {panelContent.flat.map(item => (
                  <motion.button
                    key={item.label}
                    whileTap={{ scale: 0.95, x: 4 }}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                    className={`sb-panel-item${isFlatActive(item.route) ? ' sb-panel-item-active' : ''}`}
                    onClick={() => handleItemClick(item.route)}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              {/* Groups */}
              {panelContent.groups?.map(group => (
                <div key={group.label} className="sb-panel-group">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="sb-panel-group-head"
                    onClick={() =>
                      setOpenGroup(prev =>
                        prev === group.label ? null : group.label
                      )
                    }
                  >
                    <span className="sb-panel-group-label">
                      {group.label}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`sb-panel-chevron${openGroup === group.label ? ' open' : ''}`}
                    />
                  </motion.button>

                  <AnimatePresence initial={false}>
                    {openGroup === group.label && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{    height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                      >
                        {group.items.map(item => (
                          <motion.button
                            key={item.label}
                            whileTap={{ scale: 0.95, x: 4 }}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.15 }}
                            className={`sb-panel-sub-item${isSubActive(item.route) ? ' sb-panel-sub-item-active' : ''}`}
                            onClick={() => handleItemClick(item.route)}
                          >
                            {item.dot && (
                              <span
                                className="sb-panel-dot"
                                style={{ background: item.dot }}
                              />
                            )}
                            {item.label}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
