import InteractiveBackgroundCanvas from '../../components/shared/InteractiveBackgroundCanvas';
import HeaderNav from '../../components/shared/HeaderNav';
import CronogramaTab from '../desarrollo/CronogramaTab';
import '../../styles/landing.css';
import '../../styles/desarrollo.css';

export default function CronogramaPage() {
  return (
    <div
      className="lp-root proy-web-root"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <InteractiveBackgroundCanvas />

      {/* Header Centrado */}
      <HeaderNav activeTab="cronograma" />

      {/* Contenido Principal Ocupando Casi Toda la Pestaña (Paddings optimizados sin colisión con botón de tema) */}
      <main style={{
        flex: 1,
        paddingTop: '92px',
        paddingBottom: '24px',
        paddingLeft: '24px',
        paddingRight: '78px',
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <div style={{ width: '100%', maxWidth: '1720px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CronogramaTab />
        </div>
      </main>
    </div>
  );
}
