/**
 * Texto sutil de antigüedad en Quira a partir de ProfessionalProfile.createdAt.
 * Ej.: "En Quira desde mayo de 2026"
 */
const MONTHS_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

export function formatQuiraMemberSince(
  createdAt: string | null | undefined,
): string | null {
  if (createdAt == null || String(createdAt).trim() === '') return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  const month = MONTHS_ES[d.getMonth()];
  if (!month) return null;
  return `En Quira desde ${month} de ${d.getFullYear()}`;
}
