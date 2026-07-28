import { getCategoryStyle } from './categoryStyles';
import { getListingStatusTokens } from './listingStatus';

describe('categoryStyles', () => {
  test('returns pill style for known categories', () => {
    expect(getCategoryStyle('PLUMBING').label).toBe('Fontanería');
    expect(getCategoryStyle('ELECTRICITY').color).toBe('#eab308');
    expect(getCategoryStyle('DYC').label).toBe('Manitas');
  });
});

describe('listingStatus', () => {
  test('maps status keys to border and badge classes', () => {
    expect(getListingStatusTokens('pending').borderClass).toContain('pending');
    expect(getListingStatusTokens('assigned').badgeClass).toContain('assigned');
    expect(getListingStatusTokens('sent').borderClass).toContain('sent');
  });
});
