/** Primer link http(s) que aparezca en un texto, o null si no hay ninguno.
 *  Separado de LinkPreviewCard.tsx a propósito: un archivo de componente no
 *  puede exportar también funciones sueltas sin romper Fast Refresh de Vite. */
export function extractFirstUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+/);
  return m ? m[0] : null;
}
