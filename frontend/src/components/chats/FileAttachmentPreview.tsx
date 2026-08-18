import { FileText, Download } from 'lucide-react';
import { formatFileSize } from '../../utils/fileUpload';
import type { FileAttachmentInfo } from '../../data/chatsApi';

interface FileAttachmentPreviewProps {
  file: FileAttachmentInfo;
  variant: 'user' | 'contact';
  /** Si la imagen es clicable, abre el lightbox en vez de una pestaña nueva. */
  onImageClick?: () => void;
}

/**
 * Vista previa real de un archivo adjunto, directamente en la burbuja:
 * - Imagen: miniatura de tamaño fijo, click abre el lightbox de la conversación.
 * - PDF: mini visor embebido (el navegador ya sabe renderizar PDFs en un
 *   <iframe>, no hace falta ninguna librería) + botón para abrirlo completo.
 * - Cualquier otro documento: tarjeta con ícono + nombre + tamaño + descargar.
 */
export default function FileAttachmentPreview({ file, variant, onImageClick }: FileAttachmentPreviewProps) {
  const src = `data:${file.mime_type};base64,${file.data}`;
  const isImage = file.mime_type.startsWith('image/');
  const isPdf = file.mime_type === 'application/pdf';

  if (isImage) {
    return (
      <button type="button" className="file-attachment-image-wrap" onClick={onImageClick} title={file.name}>
        <img src={src} alt={file.name} className="file-attachment-image" />
      </button>
    );
  }

  if (isPdf) {
    return (
      <div className="file-attachment-pdf">
        <iframe src={src} title={file.name} className="file-attachment-pdf-frame" />
        <div className="file-attachment-pdf-footer">
          <span className="file-attachment-name">{file.name}</span>
          <a href={src} target="_blank" rel="noreferrer" className="file-attachment-open-link">Abrir</a>
        </div>
      </div>
    );
  }

  return (
    <a href={src} download={file.name} className={`file-attachment-doc ${variant}`}>
      <FileText size={20} />
      <div className="file-attachment-doc-info">
        <span className="file-attachment-name">{file.name}</span>
        <span className="file-attachment-size">{formatFileSize(file.size_bytes)}</span>
      </div>
      <Download size={16} />
    </a>
  );
}
