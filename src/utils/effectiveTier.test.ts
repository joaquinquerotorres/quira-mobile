import { describe, it, expect } from 'vitest';
import { getEffectiveTier, isDowngradedDueToExpiredPayment } from './effectiveTier';

describe('effectiveTier', () => {
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  describe('getEffectiveTier', () => {
    it('returns CLIENT for null user', () => {
      expect(getEffectiveTier(null)).toBe('CLIENT');
    });

    it('returns PRO when ROLE_PRO and paidThroughAt not expired', () => {
      expect(getEffectiveTier({
        roles: ['ROLE_PRO'],
        professionalProfile: {},
        paidThroughAt: futureDate.toISOString(),
      })).toBe('PRO');
    });

    it('returns FREE when ROLE_PRO but paidThroughAt expired', () => {
      expect(getEffectiveTier({
        roles: ['ROLE_PRO'],
        professionalProfile: {},
        paidThroughAt: pastDate.toISOString(),
      })).toBe('FREE');
    });

    it('returns FREE when ROLE_SOLVER but paidThroughAt expired', () => {
      expect(getEffectiveTier({
        roles: ['ROLE_SOLVER'],
        professionalProfile: {},
        paidThroughAt: pastDate.toISOString(),
      })).toBe('FREE');
    });

    it('returns SOLVER when ROLE_SOLVER and paidThroughAt not expired', () => {
      expect(getEffectiveTier({
        roles: ['ROLE_SOLVER'],
        professionalProfile: {},
        paidThroughAt: futureDate.toISOString(),
      })).toBe('SOLVER');
    });

    it('returns FREE when paidThroughAt is null (treated as not expired)', () => {
      expect(getEffectiveTier({
        roles: ['ROLE_PRO'],
        professionalProfile: {},
        paidThroughAt: null,
      })).toBe('PRO');
    });
  });

  describe('isDowngradedDueToExpiredPayment', () => {
    it('returns true for ROLE_PRO with expired paidThroughAt', () => {
      expect(isDowngradedDueToExpiredPayment({
        roles: ['ROLE_PRO'],
        paidThroughAt: pastDate.toISOString(),
      })).toBe(true);
    });

    it('returns false for ROLE_PRO with future paidThroughAt', () => {
      expect(isDowngradedDueToExpiredPayment({
        roles: ['ROLE_PRO'],
        paidThroughAt: futureDate.toISOString(),
      })).toBe(false);
    });

    it('returns false for ROLE_FREE', () => {
      expect(isDowngradedDueToExpiredPayment({
        roles: ['ROLE_FREE'],
        paidThroughAt: pastDate.toISOString(),
      })).toBe(false);
    });
  });
});
