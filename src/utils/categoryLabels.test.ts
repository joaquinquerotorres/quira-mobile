import { describe, it, expect } from 'vitest';
import { getCategoryLabel, CATEGORY_LABELS } from './categoryLabels';

describe('getCategoryLabel', () => {
  it('maps known codes to Spanish labels', () => {
    expect(getCategoryLabel('PLUMBING')).toBe('Fontanería');
    expect(getCategoryLabel('DIY')).toBe('Manitas');
    expect(getCategoryLabel('HVAC')).toBe('Climatización');
  });

  it('normalizes DYC alias to DIY', () => {
    expect(getCategoryLabel('DYC')).toBe('Manitas');
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

describe('CATEGORY_LABELS', () => {
  it('has expected keys for API categories', () => {
    expect(Object.keys(CATEGORY_LABELS).length).toBeGreaterThanOrEqual(8);
    expect(CATEGORY_LABELS.MASONRY).toBe('Reformas');
  });
});
