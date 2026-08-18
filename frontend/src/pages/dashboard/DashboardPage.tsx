import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, SlidersHorizontal, ArrowUpDown, FileText, FileSpreadsheet,
  Presentation, Image as ImageIcon, FileCode, File,
  MoreVertical, Pencil, Trash2, ArrowLeft, FolderPlus, UploadCloud, Loader2, Download, Eye
} from 'lucide-react';
import Sidebar from '../../components/shared/Sidebar';
import WelcomeOverlay from '../../components/shared/WelcomeOverlay';
import FolderModal from '../../components/dashboard/FolderModal';
import UploadDocumentModal from '../../components/dashboard/UploadDocumentModal';
import DocumentPreviewView from '../../components/dashboard/DocumentPreviewView';
import { formatFileSize } from '../../utils/fileUpload';
import { mainAuthErrorMessage } from '../../data/mainAuth';
import {
  listFolders, createFolder, updateFolder, deleteFolder,
  listDocuments, getDocument, uploadDocument, updateDocument, deleteDocument,
  type DocumentFolder, type DocumentSummary,
} from '../../data/documentosApi';

const SORT_OPTIONS = ['Más reciente', 'Más antiguo', 'Nombre A–Z'] as const;
type SortOption = typeof SORT_OPTIONS[number];

function splitExtension(name: string): { base: string; ext: string } {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return { base: name, ext: '' };
  return { base: name.slice(0, dot), ext: name.slice(dot) };
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

function sortFolders(folders: DocumentFolder[], sort: SortOption): DocumentFolder[] {
  const copy = [...folders];
  if (sort === 'Nombre A–Z') return copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'Más antiguo') return copy.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  return copy.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

function sortDocs(docs: DocumentSummary[], sort: SortOption): DocumentSummary[] {
  const copy = [...docs];
  if (sort === 'Nombre A–Z') return copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'Más antiguo') return copy.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
  return copy.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
}

function getDocTypeInfo(name: string, mime: string) {
  const n = (name || '').toLowerCase();
  const m = (mime || '').toLowerCase();
  const ext = n.split('.').pop() || '';

  // 1. PDF
  if (m.includes('pdf') || ext === 'pdf') {
    return { typeClass: 'bmd-pdf', typeLabel: 'PDF' };
  }

  // 2. PowerPoint (.pptx, .ppt, .pps, .ppsx)
  if (
    m.includes('presentation') ||
    m.includes('powerpoint') ||
    ['ppt', 'pptx', 'pps', 'ppsx', 'pot', 'potx'].includes(ext)
  ) {
    return { typeClass: 'bmd-ppt', typeLabel: 'PPT' };
  }

  // 3. Excel (.xlsx, .xls, .csv, spreadsheetml)
  if (
    m.includes('spreadsheetml') ||
    m.includes('excel') ||
    m.includes('csv') ||
    ['xls', 'xlsx', 'csv', 'xlsm', 'xltx'].includes(ext)
  ) {
    return { typeClass: 'bmd-xls', typeLabel: 'XLS' };
  }

  // 4. Word (.docx, .doc, wordprocessingml)
  if (
    m.includes('word') ||
    m.includes('wordprocessingml') ||
    ['doc', 'docx', 'rtf', 'dotx'].includes(ext)
  ) {
    return { typeClass: 'bmd-doc', typeLabel: 'DOC' };
  }

  // 5. Imágenes
  if (
    m.includes('image') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'tiff'].includes(ext)
  ) {
    return { typeClass: 'bmd-img', typeLabel: 'IMG' };
  }

  // 6. Texto plano / código
  if (m.includes('text') || ['txt', 'json', 'md', 'js', 'py', 'ts', 'html', 'css'].includes(ext)) {
    return { typeClass: 'bmd-txt', typeLabel: 'TXT' };
  }

  return { typeClass: 'bmd-file', typeLabel: 'FILE' };
}

function getPeekDocsForFolder(docsInFolder: DocumentSummary[], fileCount: number, folderId: string) {
  if (fileCount === 0) return [];

  const maxDocs = 6;
  let items = docsInFolder.slice(0, maxDocs);

  if (items.length === 0 && fileCount > 0) {
    const mockTypes = [
      { mime_type: 'application/pdf', name: 'Documento.pdf' },
      { mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'Informe.docx' },
      { mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'Datos.xlsx' },
      { mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', name: 'Presentacion.pptx' },
      { mime_type: 'image/png', name: 'Imagen.png' },
      { mime_type: 'application/pdf', name: 'Guia.pdf' },
    ];
    items = Array.from({ length: Math.min(fileCount, maxDocs) }, (_, i) => ({
      id: `mock-${folderId}-${i}`,
      folder_id: folderId,
      size_bytes: 1024,
      created_at: new Date().toISOString(),
      ...mockTypes[i % mockTypes.length],
    }));
  }

  // Hash simple para semilla de aleatoriedad determinista
  let hash = 0;
  for (let i = 0; i < folderId.length; i++) {
    hash = (hash << 5) - hash + folderId.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  const count = items.length;

  // Distribución amplia a lo largo de los 210px de la carpeta (no pegados)
  const baseSpans: Record<number, number[]> = {
    1: [0],
    2: [-34, 34],
    3: [-50, 0, 50],
    4: [-58, -20, 20, 58],
    5: [-64, -32, 0, 32, 64],
    6: [-70, -42, -14, 14, 42, 70],
  };

  const xList = baseSpans[count] || baseSpans[6];

  return items.map((doc, idx) => {
    const typeInfo = getDocTypeInfo(doc.name, doc.mime_type);

    // Variaciones pseudo-aleatorias orgánicas por documento
    const r1 = Math.sin(seed + idx * 17.13) * 10000;
    const rndRot = (r1 - Math.floor(r1)) * 26 - 13; // Entre -13° y +13°

    const r2 = Math.sin(seed + idx * 31.41) * 10000;
    const rndXJitter = ((r2 - Math.floor(r2)) - 0.5) * 10; // Jitter de posición X

    const r3 = Math.sin(seed + idx * 53.87) * 10000;
    // Elevación para que se vea el 60% (~30px a 34px de altura sobre la solapa frontal)
    const rndY = -29 - (r3 - Math.floor(r3)) * 5;

    const baseX = xList[idx] ?? 0;

    return {
      id: doc.id,
      name: doc.name,
      ...typeInfo,
      rotation: Math.round(rndRot),
      xOffset: Math.round(baseX + rndXJitter),
      yOffset: Math.round(rndY),
    };
  });
}

/* ── Page ───────────────────────────────────────────────── */
export default function DashboardPage() {
  const [showWelcome, setShowWelcome] = useState(() => {
    return sessionStorage.getItem('clerkship_show_welcome') === 'true';
  });

  const [sortOpen, setSortOpen] = useState(false);
  const [sortLabel, setSortLabel] = useState<SortOption>('Más reciente');
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [recent, setRecent] = useState<DocumentSummary[]>([]);
  const [allDocs, setAllDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [folderModal, setFolderModal] = useState<'create' | DocumentFolder | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState<DocumentFolder | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentSummary | null>(null);

  const [openFolder, setOpenFolder] = useState<DocumentFolder | null>(null);
  const [folderStack, setFolderStack] = useState<DocumentFolder[]>([]);
  const [folderDocs, setFolderDocs] = useState<DocumentSummary[]>([]);
  const [folderDocsLoading, setFolderDocsLoading] = useState(false);

  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleWelcomeComplete() {
    sessionStorage.removeItem('clerkship_show_welcome');
    setShowWelcome(false);
  }

  async function refreshAll() {
    setLoading(true);
    setError(null);
    try {
      const [{ folders: f }, { documents: d }, { documents: fullDocs }] = await Promise.all([
        listFolders(),
        listDocuments(undefined, 12),
        listDocuments(undefined, 300),
      ]);
      setFolders(f);
      setRecent(d);
      setAllDocs(fullDocs || []);
    } catch (err) {
      setError(mainAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshAll(); }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuFor(null);
    }
    if (menuFor) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuFor]);

  async function loadFolder(folder: DocumentFolder) {
    setOpenFolder(folder);
    setFolderDocsLoading(true);
    try {
      const { documents } = await listDocuments(folder.id);
      setFolderDocs(documents);
    } catch (err) {
      setError(mainAuthErrorMessage(err));
    } finally {
      setFolderDocsLoading(false);
    }
  }

  async function openFolderView(folder: DocumentFolder) {
    if (openFolder) setFolderStack(prev => [...prev, openFolder]);
    await loadFolder(folder);
  }

  async function goBackFolder() {
    if (folderStack.length > 0) {
      const stack = [...folderStack];
      const parent = stack.pop()!;
      setFolderStack(stack);
      await loadFolder(parent);
    } else {
      setOpenFolder(null);
      setFolderStack([]);
    }
  }

  function collectDescendantIds(allFolders: DocumentFolder[], rootId: string): string[] {
    const childrenOf: Record<string, string[]> = {};
    allFolders.forEach(f => {
      if (f.parent_folder_id) {
        (childrenOf[f.parent_folder_id] ||= []).push(f.id);
      }
    });
    const result: string[] = [];
    const stack = [...(childrenOf[rootId] || [])];
    while (stack.length) {
      const id = stack.pop()!;
      result.push(id);
      stack.push(...(childrenOf[id] || []));
    }
    return result;
  }

  async function handleSaveFolder(name: string, color: string) {
    if (folderModal === 'create') {
      const { folder } = await createFolder(name, color, openFolder?.id ?? null);
      setFolders(prev => [...prev, folder]);
    } else if (folderModal) {
      const { folder } = await updateFolder(folderModal.id, { name, color });
      setFolders(prev => prev.map(f => (f.id === folder.id ? folder : f)));
      if (openFolder?.id === folder.id) setOpenFolder(folder);
    }
    setFolderModal(null);
  }

  async function handleDeleteFolder(folder: DocumentFolder) {
    setBusyId(folder.id);
    try {
      await deleteFolder(folder.id);
      const toRemove = new Set([folder.id, ...collectDescendantIds(folders, folder.id)]);
      setFolders(prev => prev.filter(f => !toRemove.has(f.id)));
      if (openFolder && toRemove.has(openFolder.id)) {
        setOpenFolder(null);
        setFolderStack([]);
      }
      setConfirmDeleteFolder(null);
    } catch (err) {
      setError(mainAuthErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpload(
    file: { name: string; mime_type: string; data: string; size_bytes: number },
    folderId: string | null,
  ) {
    const { document } = await uploadDocument({ ...file, folder_id: folderId });
    setUploadModalOpen(false);
    if (folderId) {
      setFolders(prev => prev.map(f => (f.id === folderId ? { ...f, file_count: f.file_count + 1, total_size_bytes: f.total_size_bytes + file.size_bytes } : f)));
      if (openFolder?.id === folderId) setFolderDocs(prev => [document, ...prev]);
      setAllDocs(prev => [document, ...prev]);
    } else {
      setRecent(prev => [document, ...prev]);
      setAllDocs(prev => [document, ...prev]);
    }
    if (!folderId) setRecent(prev => prev.slice(0, 12));
  }

  async function handleDownload(doc: DocumentSummary) {
    // Trae el archivo completo (con los bytes) recién en este momento — el
    // listado solo tiene metadata, así que esto tarda un par de segundos en
    // archivos grandes. Sin el spinner se sentía como que el botón no hacía
    // nada, o que estaba roto.
    setDownloadingId(doc.id);
    try {
      const { document } = await getDocument(doc.id);
      const link = window.document.createElement('a');
      link.href = `data:${document.mime_type};base64,${document.data}`;
      link.download = document.name;
      link.click();
    } catch (err) {
      setError(mainAuthErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDeleteDocument(doc: DocumentSummary, fromFolder: boolean) {
    setBusyId(doc.id);
    try {
      await deleteDocument(doc.id);
      setAllDocs(prev => prev.filter(d => d.id !== doc.id));
      if (fromFolder) {
        setFolderDocs(prev => prev.filter(d => d.id !== doc.id));
        if (doc.folder_id) {
          setFolders(prev => prev.map(f => (f.id === doc.folder_id ? { ...f, file_count: Math.max(0, f.file_count - 1), total_size_bytes: Math.max(0, f.total_size_bytes - doc.size_bytes) } : f)));
        }
      } else {
        setRecent(prev => prev.filter(d => d.id !== doc.id));
      }
      setMenuFor(null);
    } catch (err) {
      setError(mainAuthErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function startRename(doc: DocumentSummary) {
    setRenamingId(doc.id);
    setRenameValue(splitExtension(doc.name).base);
    setMenuFor(null);
  }

  async function confirmRename(doc: DocumentSummary, fromFolder: boolean) {
    const { ext } = splitExtension(doc.name);
    const newBase = renameValue.trim();
    setRenamingId(null);
    if (!newBase) return;
    // La extensión nunca se toca — solo se deja editar el nombre.
    const newName = `${newBase}${ext}`;
    if (newName === doc.name) return;
    try {
      await updateDocument(doc.id, { name: newName });
      setAllDocs(prev => prev.map(d => (d.id === doc.id ? { ...d, name: newName } : d)));
      if (fromFolder) {
        setFolderDocs(prev => prev.map(d => (d.id === doc.id ? { ...d, name: newName } : d)));
      } else {
        setRecent(prev => prev.map(d => (d.id === doc.id ? { ...d, name: newName } : d)));
      }
    } catch (err) {
      setError(mainAuthErrorMessage(err));
    }
  }

  const sortedFolders = useMemo(
    () => sortFolders(folders.filter(f => !f.parent_folder_id), sortLabel),
    [folders, sortLabel],
  );
  const sortedChildFolders = useMemo(
    () => (openFolder ? sortFolders(folders.filter(f => f.parent_folder_id === openFolder.id), sortLabel) : []),
    [folders, sortLabel, openFolder],
  );
  const sortedRecent = useMemo(() => sortDocs(recent, sortLabel), [recent, sortLabel]);
  const sortedFolderDocs = useMemo(() => sortDocs(folderDocs, sortLabel), [folderDocs, sortLabel]);

  function getFileCardIcon(name: string, mime: string) {
    const info = getDocTypeInfo(name, mime);
    let IconComponent = FileText;
    let colorClass = 'fi-file';

    if (info.typeLabel === 'PDF') {
      IconComponent = FileText;
      colorClass = 'fi-pdf';
    } else if (info.typeLabel === 'DOC') {
      IconComponent = FileText;
      colorClass = 'fi-doc';
    } else if (info.typeLabel === 'XLS') {
      IconComponent = FileSpreadsheet;
      colorClass = 'fi-xls';
    } else if (info.typeLabel === 'PPT') {
      IconComponent = Presentation;
      colorClass = 'fi-ppt';
    } else if (info.typeLabel === 'IMG') {
      IconComponent = ImageIcon;
      colorClass = 'fi-img';
    } else if (info.typeLabel === 'TXT') {
      IconComponent = FileCode;
      colorClass = 'fi-txt';
    } else {
      IconComponent = File;
      colorClass = 'fi-file';
    }

    return { IconComponent, colorClass, label: info.typeLabel };
  }

  function renderFolderCard(f: DocumentFolder) {
    const c = f.color || '#10B981';
    const docsInFolder = allDocs.filter(doc => doc.folder_id === f.id);
    const peekDocs = getPeekDocsForFolder(docsInFolder, f.file_count, f.id);
    const metaParts = [
      f.subfolder_count > 0 ? `${f.subfolder_count} carpeta${f.subfolder_count === 1 ? '' : 's'}` : null,
      `${f.file_count} archivo${f.file_count === 1 ? '' : 's'}`,
      formatFileSize(f.total_size_bytes),
    ].filter(Boolean);

    return (
      <div key={f.id} className="bib2-folder-card-wrap">
        <button
          type="button"
          className="bib2-folder-3d"
          onClick={() => openFolderView(f)}
        >
          <div
            className="bib2-folder-tab-shape"
            style={{
              background: `${c}BF`,
              borderColor: `${c}E6`,
            }}
          />

          {/* Mini documentos que se asoman al hacer hover desde adentro de la carpeta */}
          {peekDocs.length > 0 && (
            <div className="bib2-folder-peek-container">
              {peekDocs.map((doc, idx) => (
                <div
                  key={doc.id || idx}
                  className="bib2-mini-doc-sheet"
                  style={{
                    '--peek-rot': `${doc.rotation}deg`,
                    '--peek-x': `${doc.xOffset}px`,
                    '--peek-y': `${doc.yOffset}px`,
                    '--peek-z': idx + 1,
                  } as any}
                >
                  <span className={`bib2-mini-doc-badge ${doc.typeClass}`}>
                    {doc.typeLabel}
                  </span>
                  <div className="bib2-mini-doc-lines">
                    <span className="bmd-line bmd-line-1" />
                    <span className="bmd-line bmd-line-2" />
                    <span className="bmd-line bmd-line-3" />
                  </div>
                  <span className="bib2-mini-doc-name">{doc.name}</span>
                </div>
              ))}
            </div>
          )}

          <div
            className="bib2-folder-front-flap"
            style={{
              background: `linear-gradient(135deg, ${c}BF 0%, ${c}99 100%)`,
              borderColor: `${c}E6`,
            }}
          >
            <div className="bib2-folder-front-info">
              <h3 className="bib2-folder-title-front" style={{ color: '#FFFFFF', opacity: 0.95 }}>{f.name}</h3>
              <p className="bib2-folder-meta-front" style={{ color: '#FFFFFF', opacity: 0.85 }}>{metaParts.join(' · ')}</p>
            </div>
          </div>
        </button>

        <div className="bib2-file-kebab-wrap bib2-folder-kebab-wrap" ref={menuFor === f.id ? menuRef : undefined}>
          <button type="button" className="bib2-file-kebab-btn bib2-folder-kebab-btn" onClick={() => setMenuFor(menuFor === f.id ? null : f.id)}>
            <MoreVertical size={15} color="#FFFFFF" />
          </button>
          {menuFor === f.id && (
            <div className="bib2-file-menu">
              <button type="button" onClick={() => { setFolderModal(f); setMenuFor(null); }}>
                <Pencil size={13} /> Editar
              </button>
              <button type="button" className="danger" onClick={() => { setConfirmDeleteFolder(f); setMenuFor(null); }}>
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderDocCard(doc: DocumentSummary, fromFolder: boolean) {
    const isRenaming = renamingId === doc.id;
    const { IconComponent, colorClass, label } = getFileCardIcon(doc.name, doc.mime_type);

    return (
      <div key={doc.id} className="bib2-file-card bib2-file-card-real">
        <button
          type="button"
          className="bib2-file-card-main"
          title="Ver vista previa del archivo"
          onClick={() => !isRenaming && setPreviewDoc(doc)}
        >
          <div className={`bib2-file-icon ${colorClass}`}>
            <IconComponent size={19} strokeWidth={1.8} />
            <span className={`bib2-file-icon-badge ${colorClass}`}>{label}</span>
          </div>
          <div className="bib2-file-info">
            {isRenaming ? (
              <span className="dfm-rename-row" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  className="dfm-rename-input"
                  value={renameValue}
                  autoFocus
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => confirmRename(doc, fromFolder)}
                  onKeyDown={e => { if (e.key === 'Enter') confirmRename(doc, fromFolder); if (e.key === 'Escape') setRenamingId(null); }}
                />
                {splitExtension(doc.name).ext && (
                  <span className="dfm-rename-ext" title="La extensión no se puede cambiar">
                    {splitExtension(doc.name).ext}
                  </span>
                )}
              </span>
            ) : (
              <p className="bib2-file-name">{doc.name}</p>
            )}
            <p className="bib2-file-meta">{formatDate(doc.created_at)} · {formatFileSize(doc.size_bytes)}</p>
          </div>
        </button>

        <div className="bib2-file-kebab-wrap" ref={menuFor === doc.id ? menuRef : undefined}>
          <button
            type="button"
            className="bib2-file-kebab-btn"
            onClick={() => setMenuFor(menuFor === doc.id ? null : doc.id)}
          >
            {busyId === doc.id ? <Loader2 size={15} className="dfm-spin" /> : <MoreVertical size={15} />}
          </button>
          {menuFor === doc.id && (
            <div className="bib2-file-menu">
              <button type="button" onClick={() => { setPreviewDoc(doc); setMenuFor(null); }}><Eye size={13} /> Vista previa</button>
              <button
                type="button"
                onClick={() => handleDownload(doc)}
                disabled={downloadingId === doc.id}
              >
                {downloadingId === doc.id ? (
                  <><Loader2 size={13} className="dfm-spin" /> Descargando...</>
                ) : (
                  <><Download size={13} /> Descargar</>
                )}
              </button>
              <button type="button" onClick={() => startRename(doc)}><Pencil size={13} /> Renombrar</button>
              <button type="button" className="danger" onClick={() => handleDeleteDocument(doc, fromFolder)}>
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="dash-root">
      {showWelcome && <WelcomeOverlay onComplete={handleWelcomeComplete} />}
      <Sidebar />

      <div className={`bib2-body ${previewDoc ? 'is-preview-mode' : ''}`}>
        {previewDoc ? (
          <DocumentPreviewView
            document={previewDoc}
            onBack={() => setPreviewDoc(null)}
          />
        ) : (
          <>
            {/* Header */}
            <div className="bib2-header">
              <h1 className="bib2-title">
                {openFolder ? (
                  <span className="bib2-folder-crumb">
                    <button type="button" onClick={goBackFolder}><ArrowLeft size={18} /></button>
                    {folderStack.length > 0
                      ? `${folderStack.map(f => f.name).join(' / ')} / ${openFolder.name}`
                      : openFolder.name}
                  </span>
                ) : 'Documentos'}
              </h1>
              <div className="bib2-actions">
                <div className="bib2-sort-wrap">
                  <button type="button" className="bib2-btn-new" onClick={() => setNewMenuOpen(v => !v)}>
                    <Plus size={15} strokeWidth={2.5} /> Nuevo
                  </button>
                  {newMenuOpen && (
                    <div className="bib2-sort-dropdown">
                      <button
                        type="button"
                        className="bib2-sort-item"
                        onClick={() => { setFolderModal('create'); setNewMenuOpen(false); }}
                      >
                        <FolderPlus size={14} /> Nueva carpeta
                      </button>
                      <button
                        type="button"
                        className="bib2-sort-item"
                        onClick={() => { setUploadModalOpen(true); setNewMenuOpen(false); }}
                      >
                        <UploadCloud size={14} /> Subir documento
                      </button>
                    </div>
                  )}
                </div>
                <button className="bib2-btn-outline" disabled title="Próximamente">
                  <SlidersHorizontal size={14} strokeWidth={1.8} /> Filtros
                </button>
                <div className="bib2-sort-wrap">
                  <button type="button" className="bib2-btn-outline" onClick={() => setSortOpen(v => !v)}>
                    <ArrowUpDown size={14} strokeWidth={1.8} />
                    Ordenar: {sortLabel}
                  </button>
                  {sortOpen && (
                    <div className="bib2-sort-dropdown">
                      {SORT_OPTIONS.map(opt => (
                        <button
                          key={opt}
                          type="button"
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

            {error && <p className="dfm-page-error">{error}</p>}
            {loading && <div className="bib2-loading"><Loader2 size={22} className="dfm-spin" /></div>}

            {!loading && !openFolder && (
              <>
                {/* Folders */}
                <section className="bib2-section">
                  <h2 className="bib2-section-title">Carpetas</h2>
                  {sortedFolders.length === 0 ? (
                    <p className="bib2-empty-note">No tenés carpetas todavía — creá una con "Nuevo".</p>
                  ) : (
                    <div className="bib2-folders-row">
                      {sortedFolders.map(f => renderFolderCard(f))}
                    </div>
                  )}
                </section>

                {/* Recent */}
                <section className="bib2-section">
                  <h2 className="bib2-section-title">Recientes</h2>
                  {sortedRecent.length === 0 ? (
                    <p className="bib2-empty-note">Todavía no subiste ningún documento.</p>
                  ) : (
                    <div className="bib2-recent-row">
                      {sortedRecent.map(doc => renderDocCard(doc, false))}
                    </div>
                  )}
                </section>
              </>
            )}

            {!loading && openFolder && (
              <>
                {sortedChildFolders.length > 0 && (
                  <section className="bib2-section">
                    <h2 className="bib2-section-title">Carpetas</h2>
                    <div className="bib2-folders-row">
                      {sortedChildFolders.map(f => renderFolderCard(f))}
                    </div>
                  </section>
                )}

                <section className="bib2-section">
                  {folderDocsLoading ? (
                    <div className="bib2-loading"><Loader2 size={22} className="dfm-spin" /></div>
                  ) : sortedFolderDocs.length === 0 && sortedChildFolders.length === 0 ? (
                    <p className="bib2-empty-note">Esta carpeta está vacía — subí un documento o creá una subcarpeta con "Nuevo".</p>
                  ) : sortedFolderDocs.length === 0 ? null : (
                    <div className="bib2-recent-row">
                      {sortedFolderDocs.map(doc => renderDocCard(doc, true))}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {folderModal && (
          <FolderModal
            folder={folderModal === 'create' ? null : folderModal}
            onClose={() => setFolderModal(null)}
            onSave={handleSaveFolder}
          />
        )}
        {uploadModalOpen && (
          <UploadDocumentModal
            folders={folders}
            defaultFolderId={openFolder?.id}
            onClose={() => setUploadModalOpen(false)}
            onUpload={handleUpload}
          />
        )}
        {confirmDeleteFolder && (
          <motion.div
            className="dfm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDeleteFolder(null)}
          >
            <motion.div
              className="dfm-modal dfm-confirm"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="dfm-header">
                <span>Eliminar carpeta</span>
                <button type="button" className="dfm-close-btn" onClick={() => setConfirmDeleteFolder(null)}><ArrowLeft size={16} /></button>
              </div>
              <p className="dfm-confirm-text">
                ¿Eliminar <strong>{confirmDeleteFolder.name}</strong>? Se van a borrar también los{' '}
                {confirmDeleteFolder.file_count} archivo{confirmDeleteFolder.file_count === 1 ? '' : 's'} que tiene adentro.
                Esto no se puede deshacer.
              </p>
              <button
                type="button"
                className="dfm-save-btn dfm-danger-btn"
                onClick={() => handleDeleteFolder(confirmDeleteFolder)}
                disabled={busyId === confirmDeleteFolder.id}
              >
                {busyId === confirmDeleteFolder.id ? 'Eliminando...' : 'Sí, eliminar todo'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
