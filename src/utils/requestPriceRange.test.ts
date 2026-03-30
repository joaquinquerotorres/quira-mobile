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
        estimatedPriceMin: 40,
        estimatedPriceMax: 80,
        aiDiagnosis: undefined,
      }),
    ).toBe('40€ - 80€');
  });

  it('normalizes inverted min/max', () => {
    const r = getRequestPriceRangeEuros({
      estimatedPriceMin: 90,
      estimatedPriceMax: 30,
      aiDiagnosis: undefined,
    });
    expect(r).toEqual({ min: 30, max: 90 });
  });

  it('falls back to aiDiagnosis when API omits fields', () => {
    expect(
      formatRequestPriceRangeEuros({
        estimatedPriceMin: undefined as unknown as number,
        estimatedPriceMax: undefined as unknown as number,
        aiDiagnosis: { min: 10, max: 20 },
      }),
    ).toBe('10€ - 20€');
  });

  it('suggested bid is midpoint', () => {
    expect(
      suggestedBidPriceEuros({
        estimatedPriceMin: 40,
        estimatedPriceMax: 60,
        aiDiagnosis: undefined,
      }),
    ).toBe(50);
  });
});
