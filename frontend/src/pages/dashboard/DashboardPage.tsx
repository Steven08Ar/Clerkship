import { useState } from 'react';
import { Plus, SlidersHorizontal, ArrowUpDown, Folder, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/shared/Sidebar';

/* ── Data ───────────────────────────────────────────────── */
interface FolderItem {
  id: string;
  name: string;
  files: number;
  size: string;
  color: string;
}

interface RecentFile {
  id: number;
  name: string;
  date: string;
  size: string;
}

const FOLDERS: FolderItem[] = [
  { id: 'gastro',   name: 'Gastroenterología', files: 23, size: '137 MB', color: '#E11D48' },
  { id: 'cardio',   name: 'Cardiología',        files: 8,  size: '56 MB',  color: '#0284C7' },
  { id: 'guias',    name: 'Guías clínicas',     files: 37, size: '92 MB',  color: '#9333EA' },
  { id: 'archived', name: 'Archivados',          files: 99, size: '267 MB', color: '#64748B' },
];

const RECENT: RecentFile[] = [
  { id: 1, name: 'Harrison — Medicina Interna',                date: 'Ago 5, 2023',  size: '1.0 MB' },
  { id: 2, name: 'Guía dolor abdominal agudo',                 date: 'Jul 31, 2023', size: '2.5 MB' },
  { id: 3, name: 'Sesgo de anclaje en estudiantes de medicina', date: 'Jul 25, 2023', size: '1.9 MB' },
];

const SORT_OPTIONS = ['Más reciente', 'Más antiguo', 'Nombre A–Z', 'Tamaño'];

/* ── Page ───────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [sortOpen,  setSortOpen]  = useState(false);
  const [sortLabel, setSortLabel] = useState('Más reciente');

  return (
    <div className="dash-root">
      <Sidebar />

      <div className="bib2-body">

        {/* Header */}
        <div className="bib2-header">
          <h1 className="bib2-title">Documentos</h1>
          <div className="bib2-actions">
            <button className="bib2-btn-new">
              <Plus size={15} strokeWidth={2.5} /> Nuevo
            </button>
            <button className="bib2-btn-outline">
              <SlidersHorizontal size={14} strokeWidth={1.8} /> Filtros
            </button>
            <div className="bib2-sort-wrap">
              <button
                className="bib2-btn-outline"
                onClick={() => setSortOpen(v => !v)}
              >
                <ArrowUpDown size={14} strokeWidth={1.8} />
                Ordenar: {sortLabel}
              </button>
              {sortOpen && (
                <div className="bib2-sort-dropdown">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      className={`bib2-sort-item${sortLabel === opt ? ' active' : ''}`}
                      onClick={() => { setSortLabel(opt); setSortOpen(false); }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bib2-divider" />

        {/* Folders */}
        <section className="bib2-section">
          <h2 className="bib2-section-title">Carpetas</h2>
          <div className="bib2-folders-row">
            {FOLDERS.map(f => (
              <button key={f.id} className="bib2-folder-card" onClick={() => navigate('/biblioteca')}>
                <div className="bib2-folder-icon">
                  <Folder size={32} fill={f.color + '28'} color={f.color} strokeWidth={1.5} />
                </div>
                <p className="bib2-folder-name">{f.name}</p>
                <p className="bib2-folder-meta">{f.files} archivos · {f.size}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Recent */}
        <section className="bib2-section">
          <h2 className="bib2-section-title">Recientes</h2>
          <div className="bib2-recent-row">
            {RECENT.map(file => (
              <button key={file.id} className="bib2-file-card" onClick={() => navigate('/biblioteca')}>
                <div className="bib2-file-icon">
                  <FileText size={20} strokeWidth={1.5} />
                </div>
                <div className="bib2-file-info">
                  <p className="bib2-file-name">{file.name}</p>
                  <p className="bib2-file-meta">{file.date} · {file.size}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
