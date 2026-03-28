import { describe, it, expect } from 'vitest';
import {
  getEffectiveTier,
  isDowngradedDueToExpiredPayment,
  resolvePaidThroughAt,
  hasActivePaidSubscription,
} from './effectiveTier';

describe('effectiveTier', () => {
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  describe('resolvePaidThroughAt', () => {
    it('prefers professionalProfile.paidThroughAt over user root', () => {
      expect(
        resolvePaidThroughAt({
          paidThroughAt: pastDate.toISOString(),
          professionalProfile: { paidThroughAt: futureDate.toISOString() },
        }),
      ).toBe(futureDate.toISOString());
    });
  });

  describe('hasActivePaidSubscription', () => {
    it('is false when paidThroughAt is null', () => {
      expect(
        hasActivePaidSubscription({
          roles: ['ROLE_PRO'],
          paidThroughAt: null,
          professionalProfile: {},
        }),
      ).toBe(false);
    });
  });

  describe('getEffectiveTier', () => {
    it('returns CLIENT for null user', () => {
      expect(getEffectiveTier(null)).toBe('CLIENT');
    });

    it('returns PRO when ROLE_PRO and paidThroughAt in the future', () => {
      expect(
        getEffectiveTier({
          roles: ['ROLE_PRO'],
          professionalProfile: {},
          paidThroughAt: futureDate.toISOString(),
        }),
      ).toBe('PRO');
    });

    it('returns FREE when ROLE_PRO but paidThroughAt expired', () => {
      expect(
        getEffectiveTier({
          roles: ['ROLE_PRO'],
          professionalProfile: {},
          paidThroughAt: pastDate.toISOString(),
        }),
      ).toBe('FREE');
    });

    it('returns FREE when ROLE_PRO but paidThroughAt is null (alineado con API)', () => {
      expect(
        getEffectiveTier({
          roles: ['ROLE_PRO'],
          professionalProfile: {},
          paidThroughAt: null,
        }),
      ).toBe('FREE');
    });

    it('returns FREE when ROLE_PRO but paidThroughAt is empty string', () => {
      expect(
        getEffectiveTier({
          roles: ['ROLE_PRO'],
          professionalProfile: {},
          paidThroughAt: '   ',
        }),
      ).toBe('FREE');
    });

    it('returns FREE when ROLE_SOLVER but paidThroughAt expired', () => {
      expect(
        getEffectiveTier({
          roles: ['ROLE_SOLVER'],
          professionalProfile: {},
          paidThroughAt: pastDate.toISOString(),
        }),
      ).toBe('FREE');
    });

    it('returns SOLVER when ROLE_SOLVER and paidThroughAt in the future', () => {
      expect(
        getEffectiveTier({
          roles: ['ROLE_SOLVER'],
          professionalProfile: {},
          paidThroughAt: futureDate.toISOString(),
        }),
      ).toBe('SOLVER');
    });
  });

  describe('isDowngradedDueToExpiredPayment', () => {
    it('returns true for ROLE_PRO with expired paidThroughAt', () => {
      expect(
        isDowngradedDueToExpiredPayment({
          roles: ['ROLE_PRO'],
          paidThroughAt: pastDate.toISOString(),
        }),
      ).toBe(true);
    });

    it('returns true for ROLE_PRO with null paidThroughAt', () => {
      expect(
        isDowngradedDueToExpiredPayment({
          roles: ['ROLE_PRO'],
          paidThroughAt: null,
          professionalProfile: {},
        }),
      ).toBe(true);
    });

    it('returns false for ROLE_PRO with future paidThroughAt', () => {
      expect(
        isDowngradedDueToExpiredPayment({
          roles: ['ROLE_PRO'],
          paidThroughAt: futureDate.toISOString(),
        }),
      ).toBe(false);
    });

    it('returns false for ROLE_FREE', () => {
      expect(
        isDowngradedDueToExpiredPayment({
          roles: ['ROLE_FREE'],
          paidThroughAt: pastDate.toISOString(),
        }),
      ).toBe(false);
    });
  });
});
