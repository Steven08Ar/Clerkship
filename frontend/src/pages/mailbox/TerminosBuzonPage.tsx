import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import '../../styles/mailbox.css';

/** Términos y condiciones del Buzón — contenido pendiente, se llena después. */
export default function TerminosBuzonPage() {
  return (
    <div className="dash-root">
      <Sidebar />
      <div className="mbx-terms-wrap">
        <div className="mbx-terms-card">
          <Link to="/buzon" className="mbx-terms-back"><ArrowLeft size={15} /> Volver al Buzón</Link>
          <h1>Términos y condiciones del Buzón</h1>
          <p className="mbx-terms-placeholder">Contenido próximamente.</p>
        </div>
      </div>
    </div>
  );
}
