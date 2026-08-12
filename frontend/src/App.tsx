import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/landing.css';
import './styles/auth.css';
import './styles/inner.css';
import './styles/dashboard.css';

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

import CronogramaPage from './pages/desarrollo/CronogramaPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/"                       element={<LandingPage />} />
        <Route path="/proyecto"               element={<ProyectoPage />} />

        {/* Auth */}
        <Route path="/login"                  element={<LoginPage />} />
        <Route path="/register"               element={<RegisterPage />} />
        <Route path="/consent"                element={<ConsentPage />} />
        <Route path="/dashboard"              element={<DashboardPage />} />

        {/* Inner pages */}
        <Route path="/cronograma"             element={<CronogramaPage />} />
        <Route path="/explorar"               element={<ExplorarPage />} />
        <Route path="/equipo/desarrolladores" element={<DesarrolladoresPage />} />
        <Route path="/equipo/direccion"       element={<DireccionPage />} />
        <Route path="/equipo/institucion"     element={<InstitucionPage />} />
        <Route path="/legal/terminos"         element={<TerminosPage />} />
        <Route path="/legal/privacidad"       element={<PrivacidadPage />} />
        <Route path="/legal/licencia"         element={<LicenciaPage />} />
        <Route path="/documentacion"          element={<DocumentacionPage />} />
        <Route path="/biblioteca"             element={<BibliotecaPage />} />
        <Route path="/simulacion"             element={<SimulacionPage />} />
        <Route path="/casos"                  element={<CasosPage />} />
        <Route path="/historial"              element={<HistorialPage />} />
        <Route path="/anatomia"               element={<AnatomiaPage />} />

        {/* Catch-all → landing */}
        <Route path="*"                       element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
