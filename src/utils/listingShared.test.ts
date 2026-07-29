import { getCategoryStyle, getDiscoveryCategories } from './categoryStyles';
import { getListingStatusTokens } from './listingStatus';
import { CATEGORY_CODES } from './categoryLabels';

describe('categoryStyles', () => {
  test('returns pill style for known categories', () => {
    expect(getCategoryStyle('PLUMBING').label).toBe('Fontanería');
    expect(getCategoryStyle('ELECTRICITY').color).toBe('#eab308');
    expect(getCategoryStyle('DYC').label).toBe('Manitas');
    expect(getCategoryStyle('MASONRY').label).toBe('Reformas');
    expect(getCategoryStyle('APPLIANCES').label).toBe('Electrodomésticos');
  });

  test('getDiscoveryCategories returns all 22 API categories', () => {
    const discovery = getDiscoveryCategories();
    expect(discovery).toHaveLength(22);
    expect(discovery.map((c) => c.code)).toEqual([...CATEGORY_CODES]);
    expect(discovery.find((c) => c.code === 'MASONRY')?.name).toBe('Reformas');
  });
});

describe('listingStatus', () => {
  test('maps status keys to border and badge classes', () => {
    expect(getListingStatusTokens('pending').borderClass).toContain('pending');
    expect(getListingStatusTokens('assigned').badgeClass).toContain('assigned');
    expect(getListingStatusTokens('sent').borderClass).toContain('sent');
  });
});
