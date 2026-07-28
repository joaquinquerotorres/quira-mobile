import {
  brushOutline,
  flashOutline,
  hammerOutline,
  handLeftOutline,
  leafOutline,
  snowOutline,
  sparklesOutline,
  waterOutline,
} from 'ionicons/icons';
import { getCategoryLabel } from './categoryLabels';

export interface CategoryStyle {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

/**
 * Estilo visual de categoría (píldora + icono). Fuente única para listados.
 * Referencia: pantalla Mi Trabajo.
 */
export function getCategoryStyle(
  category: string | { code?: string; name?: string } | null | undefined,
): CategoryStyle {
  const raw =
    typeof category === 'string'
      ? category
      : category?.code || category?.name || '';
  const normalized = (raw || '').toUpperCase();
  const key = normalized === 'DYC' ? 'DIY' : normalized;

  switch (key) {
    case 'PLUMBING':
      return { label: 'Fontanería', icon: waterOutline, color: '#3b82f6', bg: '#dbeafe' };
    case 'ELECTRICITY':
      return { label: 'Electricidad', icon: flashOutline, color: '#eab308', bg: '#fef9c3' };
    case 'MASONRY':
      return { label: 'Reformas', icon: hammerOutline, color: '#ef4444', bg: '#fee2e2' };
    case 'PAINTING':
      return { label: 'Pintura', icon: brushOutline, color: '#a855f7', bg: '#f3e8ff' };
    case 'GARDENING':
      return { label: 'Jardinería', icon: leafOutline, color: '#22c55e', bg: '#dcfce7' };
    case 'CLEANING':
      return { label: 'Limpieza', icon: sparklesOutline, color: '#06b6d4', bg: '#cffafe' };
    case 'HVAC':
      return { label: 'Climatización', icon: snowOutline, color: '#64748b', bg: '#f1f5f9' };
    case 'DIY':
      return { label: 'Manitas', icon: handLeftOutline, color: '#63d8ce', bg: '#f1f5f9' };
    default:
      return {
        label: getCategoryLabel(category),
        icon: handLeftOutline,
        color: '#63d8ce',
        bg: '#f1f5f9',
      };
  }
}
