/**
 * Mapeo código de categoría (API) -> nombre en español para mostrar al usuario.
 * La lógica interna usa los códigos (PLUMBING, DIY, etc.). DYC se trata como alias de DIY.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  PLUMBING: 'Fontanería',
  ELECTRICITY: 'Electricidad',
  MASONRY: 'Reformas',
  PAINTING: 'Pintura',
  GARDENING: 'Jardinería',
  CLEANING: 'Limpieza',
  HVAC: 'Climatización',
  DIY: 'Manitas',
};

export function getCategoryLabel(category: string | { code?: string; name?: string } | null | undefined): string {
  if (!category) return 'Manitas';
  const code = typeof category === 'string' ? category : (category.code || category.name || '');
  const normalized = (code || '').toUpperCase();
  const key = normalized === 'DYC' ? 'DIY' : normalized; // DYC es alias legacy de DIY
  return CATEGORY_LABELS[key] ?? (normalized || 'Manitas');
}
