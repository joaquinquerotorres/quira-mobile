/**
 * Catálogo de categorías alineado con `App\Enum\Category` del API Quira (22 códigos).
 * Sync: quira PR #5 / branch `cursor/pricing-categories-expand-f49b`.
 * La lógica interna usa códigos (PLUMBING, DIY, …). DYC es alias legacy de DIY.
 * MASONRY se muestra en UI como «Reformas».
 */

export const CATEGORY_CODES = [
  'CLEANING',
  'DIY',
  'ELECTRICITY',
  'GARDENING',
  'PAINTING',
  'PLUMBING',
  'HVAC',
  'MASONRY',
  'APPLIANCES',
  'MOVING',
  'LOCKSMITH',
  'POOL',
  'SEWING',
  'BLINDS',
  'GLAZING',
  'FURNITURE',
  'CLEAROUT',
  'PEST_CONTROL',
  'SMART_HOME',
  'BEAUTY',
  'PETS',
  'CARE',
] as const;

export type CategoryCode = (typeof CATEGORY_CODES)[number];

export const CATEGORY_LABELS: Record<CategoryCode, string> = {
  CLEANING: 'Limpieza',
  DIY: 'Manitas',
  ELECTRICITY: 'Electricidad',
  GARDENING: 'Jardinería',
  PAINTING: 'Pintura',
  PLUMBING: 'Fontanería',
  HVAC: 'Climatización',
  MASONRY: 'Reformas',
  APPLIANCES: 'Electrodomésticos',
  MOVING: 'Mudanzas y Portes',
  LOCKSMITH: 'Cerrajería',
  POOL: 'Mantenimiento de Piscinas',
  SEWING: 'Costura y Arreglos',
  BLINDS: 'Persianas y Toldos',
  GLAZING: 'Cristalería',
  FURNITURE: 'Restauración de Muebles',
  CLEAROUT: 'Vaciado de Pisos',
  PEST_CONTROL: 'Control de Plagas',
  SMART_HOME: 'Domótica y Seguridad',
  BEAUTY: 'Belleza',
  PETS: 'Mascotas',
  CARE: 'Cuidados',
};

export const CATEGORY_OPTIONS: Array<{ value: CategoryCode; label: string }> =
  CATEGORY_CODES.map((code) => ({
    value: code,
    label: CATEGORY_LABELS[code],
  }));

/** Normaliza código API (DYC → DIY) y mayúsculas. */
export function normalizeCategoryCode(raw: string | null | undefined): string {
  const normalized = String(raw || '').trim().toUpperCase();
  return normalized === 'DYC' ? 'DIY' : normalized;
}

export function isKnownCategoryCode(
  code: string | null | undefined,
): code is CategoryCode {
  const key = normalizeCategoryCode(code);
  return (CATEGORY_CODES as readonly string[]).includes(key);
}

export function getCategoryLabel(
  category: string | { code?: string; name?: string } | null | undefined,
): string {
  if (!category) return CATEGORY_LABELS.DIY;
  const code =
    typeof category === 'string' ? category : category.code || category.name || '';
  const key = normalizeCategoryCode(code);
  if (isKnownCategoryCode(key)) return CATEGORY_LABELS[key];
  return key || CATEGORY_LABELS.DIY;
}
