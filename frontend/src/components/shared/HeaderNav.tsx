import { Link, useLocation } from 'react-router-dom';
import logoUrl from '../../assets/Logo Clerkship.svg';

interface HeaderNavProps {
  activeTab?: 'inicio' | 'como-funciona' | 'cronograma';
}

export default function HeaderNav({ activeTab }: HeaderNavProps) {
  const { pathname } = useLocation();

  const isCurrent = (tab: string, route: string) => {
    if (activeTab) return activeTab === tab;
    return pathname === route;
  };

  const isAuthenticated =
    localStorage.getItem('clerkship_auth') === 'true' ||
    localStorage.getItem('clerkship_consent') === 'accepted';

  return (
    <nav className="lp-nav">
      {/* ── Logo Left ────────────────────────────────────────── */}
      <div className="lp-nav-left">
        <Link to="/" className="lp-logo">
          <img src={logoUrl} alt="Clerkship" className="lp-logo-img" />
          Clerkship
        </Link>
      </div>

      {/* ── Centered Navigation Links ── */}
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

      {/* ── Actions Right ────────────────────────────────────── */}
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
    </nav>
  );
}
