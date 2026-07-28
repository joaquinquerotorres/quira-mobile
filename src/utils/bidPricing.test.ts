import { describe, expect, test } from 'vitest';
import {
  defaultBidPricingType,
  getAllowedBidPricingTypes,
  getRequestPricingType,
} from './bidPricing';

describe('bidPricing', () => {
  test('FIXED request only allows FIXED bids', () => {
    expect(getAllowedBidPricingTypes({ pricingType: 'FIXED' })).toEqual(['FIXED']);
    expect(defaultBidPricingType({ pricingType: 'FIXED' })).toBe('FIXED');
  });

  test('RANGE request only allows RANGE bids', () => {
    expect(getAllowedBidPricingTypes({ pricingType: 'RANGE' })).toEqual(['RANGE']);
    expect(defaultBidPricingType({ pricingType: 'RANGE' })).toBe('RANGE');
  });

  test('VISIT_REQUIRED allows FIXED or RANGE', () => {
    expect(getAllowedBidPricingTypes({ pricingType: 'VISIT_REQUIRED' })).toEqual([
      'FIXED',
      'RANGE',
    ]);
  });

  test('reads pricing_type from aiDiagnosis fallback', () => {
    expect(
      getRequestPricingType({
        pricingType: null,
        aiDiagnosis: { pricing_type: 'range' },
      }),
    ).toBe('RANGE');
    expect(
      getAllowedBidPricingTypes({
        aiDiagnosis: { pricingType: 'FIXED' },
      }),
    ).toEqual(['FIXED']);
  });

  test('unknown/empty defaults to FIXED or RANGE', () => {
    expect(getAllowedBidPricingTypes({})).toEqual(['FIXED', 'RANGE']);
  });
});
