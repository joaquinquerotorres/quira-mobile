import { describe, expect, test } from 'vitest';
import {
  bidCommentLabel,
  defaultBidPricingType,
  getAllowedBidPricingTypes,
  getRequestPricingType,
  isBidCommentRequired,
} from './bidPricing';

describe('bidPricing', () => {
  test('pro can always choose FIXED or RANGE', () => {
    expect(getAllowedBidPricingTypes({ pricingType: 'FIXED' })).toEqual([
      'FIXED',
      'RANGE',
    ]);
    expect(getAllowedBidPricingTypes({ pricingType: 'RANGE' })).toEqual([
      'FIXED',
      'RANGE',
    ]);
    expect(getAllowedBidPricingTypes({ pricingType: 'VISIT_REQUIRED' })).toEqual([
      'FIXED',
      'RANGE',
    ]);
    expect(getAllowedBidPricingTypes({})).toEqual(['FIXED', 'RANGE']);
  });

  test('default selection follows IA estimate when FIXED/RANGE', () => {
    expect(defaultBidPricingType({ pricingType: 'FIXED' })).toBe('FIXED');
    expect(defaultBidPricingType({ pricingType: 'RANGE' })).toBe('RANGE');
    expect(defaultBidPricingType({ pricingType: 'VISIT_REQUIRED' })).toBe(
      'FIXED',
    );
  });

  test('reads pricing_type from aiDiagnosis fallback', () => {
    expect(
      getRequestPricingType({
        pricingType: null,
        aiDiagnosis: { pricing_type: 'range' },
      }),
    ).toBe('RANGE');
    expect(
      defaultBidPricingType({
        aiDiagnosis: { pricingType: 'RANGE' },
      }),
    ).toBe('RANGE');
  });

  test('comment required only for RANGE bids', () => {
    expect(isBidCommentRequired('RANGE')).toBe(true);
    expect(isBidCommentRequired('FIXED')).toBe(false);
    expect(bidCommentLabel('RANGE')).toMatch(/rango/i);
    expect(bidCommentLabel('FIXED')).toMatch(/opcional/i);
  });
});
