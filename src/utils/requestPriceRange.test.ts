import { describe, expect, it } from 'vitest';
import {
  formatRequestPriceRangeEuros,
  getRequestPriceRangeEuros,
  suggestedBidPriceEuros,
} from './requestPriceRange';

describe('requestPriceRange', () => {
  it('formats from estimatedPriceMin/Max', () => {
    expect(
      formatRequestPriceRangeEuros({
        estimatedPriceMin: 4000,
        estimatedPriceMax: 8000,
        aiDiagnosis: undefined,
      }),
    ).toBe('40€ - 80€');
  });

  it('normalizes inverted min/max', () => {
    const r = getRequestPriceRangeEuros({
      estimatedPriceMin: 9000,
      estimatedPriceMax: 3000,
      aiDiagnosis: undefined,
    });
    expect(r).toEqual({ min: 30, max: 90 });
  });

  it('falls back to aiDiagnosis when API omits fields', () => {
    expect(
      formatRequestPriceRangeEuros({
        estimatedPriceMin: undefined as unknown as number,
        estimatedPriceMax: undefined as unknown as number,
        aiDiagnosis: { min: 1000, max: 2000 },
      }),
    ).toBe('10€ - 20€');
  });

  it('suggested bid is midpoint', () => {
    expect(
      suggestedBidPriceEuros({
        estimatedPriceMin: 4000,
        estimatedPriceMax: 6000,
        aiDiagnosis: undefined,
      }),
    ).toBe(50);
  });
});
