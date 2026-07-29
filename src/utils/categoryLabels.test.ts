import { describe, it, expect } from 'vitest';
import {
  CATEGORY_CODES,
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  getCategoryLabel,
  isKnownCategoryCode,
  normalizeCategoryCode,
} from './categoryLabels';

describe('getCategoryLabel', () => {
  it('maps known codes to Spanish labels', () => {
    expect(getCategoryLabel('PLUMBING')).toBe('Fontanería');
    expect(getCategoryLabel('DIY')).toBe('Manitas');
    expect(getCategoryLabel('HVAC')).toBe('Climatización');
    expect(getCategoryLabel('APPLIANCES')).toBe('Electrodomésticos');
    expect(getCategoryLabel('CARE')).toBe('Cuidados');
  });

  it('shows MASONRY as Reformas (not Albañilería)', () => {
    expect(getCategoryLabel('MASONRY')).toBe('Reformas');
  });

  it('normalizes DYC alias to DIY', () => {
    expect(getCategoryLabel('DYC')).toBe('Manitas');
    expect(normalizeCategoryCode('DYC')).toBe('DIY');
  });

  it('reads code from object', () => {
    expect(getCategoryLabel({ code: 'ELECTRICITY' })).toBe('Electricidad');
  });

  it('returns fallback for unknown code', () => {
    expect(getCategoryLabel('UNKNOWN_XYZ')).toBe('UNKNOWN_XYZ');
  });

  it('handles empty input with default', () => {
    expect(getCategoryLabel('')).toBe('Manitas');
    expect(getCategoryLabel(null)).toBe('Manitas');
  });
});

describe('CATEGORY_CODES / OPTIONS', () => {
  it('exposes the 22 API Category codes', () => {
    expect(CATEGORY_CODES).toHaveLength(22);
    expect(CATEGORY_OPTIONS).toHaveLength(22);
    expect(Object.keys(CATEGORY_LABELS)).toHaveLength(22);
  });

  it('includes new pricing categories', () => {
    for (const code of [
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
    ] as const) {
      expect(isKnownCategoryCode(code)).toBe(true);
      expect(CATEGORY_LABELS[code]).toBeTruthy();
    }
  });

  it('isKnownCategoryCode rejects unknown and accepts DYC via normalize', () => {
    expect(isKnownCategoryCode('NOT_A_CAT')).toBe(false);
    expect(isKnownCategoryCode('DYC')).toBe(true);
  });
});
