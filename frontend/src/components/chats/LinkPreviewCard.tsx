import { useState } from 'react';
import { Play } from 'lucide-react';

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

interface LinkPreviewCardProps {
  url: string;
}

/**
 * Vista previa de un link de YouTube/Vimeo directamente en la conversación
 * — igual que un PDF: una miniatura clicable que, al tocarla, se convierte
 * en el reproductor embebido ahí mismo (no hace falta salir del chat).
 * Si el link no es de un video reconocido, no renderiza nada.
 */
export default function LinkPreviewCard({ url }: LinkPreviewCardProps) {
  const [expanded, setExpanded] = useState(false);

  const youtubeId = extractYouTubeId(url);
  const vimeoId = !youtubeId ? extractVimeoId(url) : null;
  if (!youtubeId && !vimeoId) return null;

  if (expanded) {
    const embedSrc = youtubeId
      ? `https://www.youtube.com/embed/${youtubeId}?autoplay=1`
      : `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    return (
      <div className="link-preview-embed">
        <iframe
          src={embedSrc}
          title="Video"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // YouTube tiene miniaturas públicas sin necesitar API key; Vimeo no
  // (requeriría una llamada aparte a su API oEmbed) — se deja un ícono
  // genérico para Vimeo en vez de sumar esa dependencia de red externa.
  const thumbnail = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null;

  return (
    <button type="button" className="link-preview-card" onClick={() => setExpanded(true)} title="Reproducir video">
      {thumbnail ? (
        <img src={thumbnail} alt="Vista previa del video" className="link-preview-thumb" />
      ) : (
        <div className="link-preview-thumb link-preview-thumb-fallback">
          <Play size={28} />
        </div>
      )}
      <span className="link-preview-play-badge"><Play size={18} fill="currentColor" /></span>
    </button>
  );
}
