/**
 * MOCK TEMPORAL — Trabajos pendientes y Calificaciones sin revisar.
 *
 * A diferencia del resto del Dashboard (Almacenamiento, Documentos, Chats,
 * Buzón), estos dos NO tienen backend real todavía: "Casos clínicos" e
 * "Historial" (CasosPage.tsx / HistorialPage.tsx) siguen siendo datos
 * hardcodeados en el frontend, no hay tablas de asignaciones/calificaciones
 * en Postgres. El usuario pidió explícitamente dejarlos como mockup por
 * ahora y migrarlos a datos reales más adelante (tablas `assignments` /
 * `grades`, conectadas de verdad a Casos e Historial).
 *
 * Este archivo existe SOLO para alimentar las tarjetas del Dashboard sin
 * duplicar/acoplarse a los arreglos internos de esas dos páginas.
 */

export interface MockPendingCase {
  id: number;
  title: string;
  status: 'disponible' | 'en_progreso';
}

/** Espejo de los casos no completados en CasosPage.tsx (GASTRO_CASES). */
export const MOCK_PENDING_CASES: MockPendingCase[] = [
  { id: 4, title: 'Síndrome de intestino irritable (SII)', status: 'disponible' },
  { id: 5, title: 'Colecistitis aguda calculosa', status: 'disponible' },
  { id: 6, title: 'Pancreatitis aguda leve', status: 'en_progreso' },
  { id: 7, title: 'Hepatitis viral aguda tipo A', status: 'disponible' },
  { id: 8, title: 'Hemorragia digestiva alta no variceal', status: 'disponible' },
];

export interface MockUnreviewedGrade {
  id: number;
  caseTitle: string;
  score: number;
  date: string;
}

/** Espejo de un subconjunto de SESSIONS en HistorialPage.tsx, marcadas como "sin revisar". */
export const MOCK_UNREVIEWED_GRADES: MockUnreviewedGrade[] = [
  { id: 4, caseTitle: 'Síndrome de intestino irritable (SII)', score: 65, date: '2025-05-12' },
  { id: 9, caseTitle: 'Enfermedad de Crohn ileal', score: 68, date: '2025-04-20' },
  { id: 10, caseTitle: 'Adenocarcinoma gástrico avanzado', score: 72, date: '2025-04-15' },
];
