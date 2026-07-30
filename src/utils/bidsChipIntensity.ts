/**
 * Intensidad visual del chip «Propuestas».
 * Umbrales discretos (más legibles que un gradiente continuo por cada unidad).
 *
 * - 0 → slate (neutro, como ahora)
 * - 1–2 → soft (interés bajo)
 * - 3–4 → mid (actividad clara)
 * - 5+ → hot (muy demandado)
 */
export type BidsChipIntensity = 'none' | 'soft' | 'mid' | 'hot';

export function getBidsChipIntensity(count: number): BidsChipIntensity {
  const n = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  if (n <= 0) return 'none';
  if (n <= 2) return 'soft';
  if (n <= 4) return 'mid';
  return 'hot';
}
