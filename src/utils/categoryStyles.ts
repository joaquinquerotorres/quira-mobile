import {
  bedOutline,
  boatOutline,
  brushOutline,
  bugOutline,
  carOutline,
  constructOutline,
  cutOutline,
  flashOutline,
  hammerOutline,
  handLeftOutline,
  heartOutline,
  homeOutline,
  keyOutline,
  layersOutline,
  leafOutline,
  pawOutline,
  shirtOutline,
  snowOutline,
  sparklesOutline,
  squareOutline,
  trashOutline,
  waterOutline,
} from 'ionicons/icons';
import {
  CATEGORY_CODES,
  getCategoryLabel,
  isKnownCategoryCode,
  normalizeCategoryCode,
  type CategoryCode,
} from './categoryLabels';

export interface CategoryStyle {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export interface DiscoveryCategory {
  code: CategoryCode;
  name: string;
  icon: string;
  color: string;
  bg: string;
}

const CATEGORY_STYLES: Record<CategoryCode, Omit<CategoryStyle, 'label'>> = {
  PLUMBING: { icon: waterOutline, color: '#3b82f6', bg: '#dbeafe' },
  ELECTRICITY: { icon: flashOutline, color: '#eab308', bg: '#fef9c3' },
  MASONRY: { icon: hammerOutline, color: '#ef4444', bg: '#fee2e2' },
  PAINTING: { icon: brushOutline, color: '#a855f7', bg: '#f3e8ff' },
  GARDENING: { icon: leafOutline, color: '#22c55e', bg: '#dcfce7' },
  CLEANING: { icon: sparklesOutline, color: '#06b6d4', bg: '#cffafe' },
  HVAC: { icon: snowOutline, color: '#64748b', bg: '#f1f5f9' },
  DIY: { icon: handLeftOutline, color: '#63d8ce', bg: '#f1f5f9' },
  APPLIANCES: { icon: constructOutline, color: '#f97316', bg: '#ffedd5' },
  MOVING: { icon: carOutline, color: '#0ea5e9', bg: '#e0f2fe' },
  LOCKSMITH: { icon: keyOutline, color: '#ca8a04', bg: '#fef9c3' },
  POOL: { icon: boatOutline, color: '#14b8a6', bg: '#ccfbf1' },
  SEWING: { icon: shirtOutline, color: '#ec4899', bg: '#fce7f3' },
  BLINDS: { icon: layersOutline, color: '#8b5cf6', bg: '#ede9fe' },
  GLAZING: { icon: squareOutline, color: '#38bdf8', bg: '#e0f2fe' },
  FURNITURE: { icon: bedOutline, color: '#a16207', bg: '#fef3c7' },
  CLEAROUT: { icon: trashOutline, color: '#78716c', bg: '#f5f5f4' },
  PEST_CONTROL: { icon: bugOutline, color: '#65a30d', bg: '#ecfccb' },
  SMART_HOME: { icon: homeOutline, color: '#4f46e5', bg: '#e0e7ff' },
  BEAUTY: { icon: cutOutline, color: '#db2777', bg: '#fce7f3' },
  PETS: { icon: pawOutline, color: '#d97706', bg: '#ffedd5' },
  CARE: { icon: heartOutline, color: '#e11d48', bg: '#ffe4e6' },
};

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
  const key = normalizeCategoryCode(raw);

  if (isKnownCategoryCode(key)) {
    const style = CATEGORY_STYLES[key];
    return {
      label: getCategoryLabel(key),
      icon: style.icon,
      color: style.color,
      bg: style.bg,
    };
  }

  return {
    label: getCategoryLabel(category),
    icon: handLeftOutline,
    color: '#63d8ce',
    bg: '#f1f5f9',
  };
}

/** Categorías para discovery / chips (las 22 del API). */
export function getDiscoveryCategories(): DiscoveryCategory[] {
  return CATEGORY_CODES.map((code) => {
    const style = getCategoryStyle(code);
    return {
      code,
      name: style.label,
      icon: style.icon,
      color: style.color,
      bg: style.bg,
    };
  });
}
