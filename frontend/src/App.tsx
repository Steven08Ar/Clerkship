import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/landing.css';
import './styles/auth.css';
import './styles/inner.css';
import './styles/dashboard.css';
import './styles/theme.css';

import LandingPage from './pages/landing/LandingPage';
import ProyectoPage from './pages/landing/ProyectoPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ConsentPage from './pages/auth/ConsentPage';
import DashboardPage from './pages/dashboard/DashboardPage';

import ExplorarPage from './pages/explorar/ExplorarPage';
import DesarrolladoresPage from './pages/equipo/DesarrolladoresPage';
import DireccionPage from './pages/equipo/DireccionPage';
import InstitucionPage from './pages/equipo/InstitucionPage';
import TerminosPage from './pages/legal/TerminosPage';
import PrivacidadPage from './pages/legal/PrivacidadPage';
import LicenciaPage from './pages/legal/LicenciaPage';
import DocumentacionPage from './pages/contenido/DocumentacionPage';
import BibliotecaPage from './pages/contenido/BibliotecaPage';
import AnatomiaPage from './pages/anatomia/AnatomiaPage';
import SimulacionPage from './pages/simulacion/SimulacionPage';
import CasosPage from './pages/simulacion/CasosPage';
import HistorialPage from './pages/simulacion/HistorialPage';
import CuestionarioPage from './pages/cuestionario/CuestionarioPage';
import CronogramaPage from './pages/cronograma/CronogramaPage';
import DesarrolloPage from './pages/desarrollo/DesarrolloPage';
import ThemeToggleFloating from './components/shared/ThemeToggleFloating';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated =
    localStorage.getItem('clerkship_auth') === 'true' ||
    localStorage.getItem('clerkship_consent') === 'accepted';

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Botón Flotante Fijo a la Derecha en TODAS las Pestañas */}
      <ThemeToggleFloating />

      <Routes>
        {/* Landing Public Pages */}
        <Route path="/"                       element={<LandingPage />} />
        <Route path="/proyecto"               element={<ProyectoPage />} />
        <Route path="/cronograma"             element={<CronogramaPage />} />

        {/* Auth */}
        <Route path="/login"                  element={<LoginPage />} />
        <Route path="/register"               element={<RegisterPage />} />
        <Route path="/consent"                element={<ConsentPage />} />

        {/* Protected Dashboard & Clinical App Routes */}
        <Route path="/dashboard"              element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/cuestionario"           element={<ProtectedRoute><CuestionarioPage /></ProtectedRoute>} />
        <Route path="/desarrollo"             element={<ProtectedRoute><DesarrolloPage /></ProtectedRoute>} />
        <Route path="/explorar"               element={<ProtectedRoute><ExplorarPage /></ProtectedRoute>} />
        <Route path="/documentacion"          element={<ProtectedRoute><DocumentacionPage /></ProtectedRoute>} />
        <Route path="/biblioteca"             element={<ProtectedRoute><BibliotecaPage /></ProtectedRoute>} />
        <Route path="/simulacion"             element={<ProtectedRoute><SimulacionPage /></ProtectedRoute>} />
        <Route path="/casos"                  element={<ProtectedRoute><CasosPage /></ProtectedRoute>} />
        <Route path="/historial"              element={<ProtectedRoute><HistorialPage /></ProtectedRoute>} />
        <Route path="/anatomia"               element={<ProtectedRoute><AnatomiaPage /></ProtectedRoute>} />

        {/* Informative Pages */}
        <Route path="/equipo/desarrolladores" element={<DesarrolladoresPage />} />
        <Route path="/equipo/direccion"       element={<DireccionPage />} />
        <Route path="/equipo/institucion"     element={<InstitucionPage />} />
        <Route path="/legal/terminos"         element={<TerminosPage />} />
        <Route path="/legal/privacidad"       element={<PrivacidadPage />} />
        <Route path="/legal/licencia"         element={<LicenciaPage />} />

        {/* Catch-all → landing */}
        <Route path="*"                       element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
