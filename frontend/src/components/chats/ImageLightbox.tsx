import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface LightboxImage {
  src: string;
  name: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Vista previa a pantalla completa de una imagen de la conversación, con
 * fondo oscurecido. Si hay más de una imagen en el chat, muestra una tira de
 * miniaturas abajo para saltar entre todas sin cerrar el lightbox.
 */
export default function ImageLightbox({ images, index, onClose, onNavigate }: ImageLightboxProps) {
  const current = images[index];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
      if (e.key === 'ArrowRight' && index < images.length - 1) onNavigate(index + 1);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, images.length, onClose, onNavigate]);

  if (!current) return null;

  return (
    <div className="image-lightbox-backdrop" onClick={onClose}>
      <button type="button" className="image-lightbox-close" onClick={onClose} title="Cerrar">
        <X size={22} />
      </button>

      {index > 0 && (
        <button
          type="button"
          className="image-lightbox-nav prev"
          onClick={e => { e.stopPropagation(); onNavigate(index - 1); }}
          title="Anterior"
        >
          <ChevronLeft size={26} />
        </button>
      )}
      {index < images.length - 1 && (
        <button
          type="button"
          className="image-lightbox-nav next"
          onClick={e => { e.stopPropagation(); onNavigate(index + 1); }}
          title="Siguiente"
        >
          <ChevronRight size={26} />
        </button>
      )}

      <img
        src={current.src}
        alt={current.name}
        className="image-lightbox-image"
        onClick={e => e.stopPropagation()}
      />

      {images.length > 1 && (
        <div className="image-lightbox-thumbs" onClick={e => e.stopPropagation()}>
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              className={`image-lightbox-thumb ${i === index ? 'active' : ''}`}
              onClick={() => onNavigate(i)}
            >
              <img src={img.src} alt={img.name} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
