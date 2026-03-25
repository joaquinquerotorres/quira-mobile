import { describe, it, expect } from 'vitest';
import type { Bid } from '../types';
import {
  getMyActiveBid,
  getMyBidForProUi,
  getRequestIdFromBid,
  dedupePendingBidsByProProfile,
  dedupeBidsByRequestForMyWork,
} from './bidDisplay';

const minimalUser = (id: number) =>
  ({
    '@id': `/api/users/${id}`,
    id,
    email: 'p@test',
    roles: ['ROLE_PRO'],
    professionalProfile: { '@id': `/api/professional_profiles/${id}`, id, fullName: 'P', skills: [], isVerified: true },
  }) as Bid['professional'];

const minimalRequest = (rid: number) =>
  ({ '@id': `/api/requests/${rid}`, id: rid, title: 'T' }) as Bid['request'];

function makeBid(partial: Partial<Bid> & Pick<Bid, 'id' | 'status' | 'priceQuote' | 'createdAt'>): Bid {
  return {
    '@id': `/api/bids/${partial.id}`,
    comment: '',
    professional: minimalUser(1),
    request: minimalRequest(10),
    ...partial,
  } as Bid;
}

describe('bidDisplay', () => {
  it('getMyBidForProUi prefers PENDING over REJECTED', () => {
    const pending = makeBid({
      id: 2,
      status: 'PENDING',
      priceQuote: 100,
      createdAt: '2025-01-02',
    });
    const rejected = makeBid({
      id: 1,
      status: 'REJECTED',
      priceQuote: 50,
      createdAt: '2025-01-01',
    });
    expect(getMyBidForProUi([rejected, pending])).toBe(pending);
    expect(getMyActiveBid([rejected, pending])).toBe(pending);
  });

  it('getMyBidForProUi falls back to latest REJECTED', () => {
    const a = makeBid({ id: 1, status: 'REJECTED', priceQuote: 1, createdAt: '2025-01-01' });
    const b = makeBid({ id: 3, status: 'REJECTED', priceQuote: 2, createdAt: '2025-01-03' });
    expect(getMyBidForProUi([a, b]).id).toBe(3);
    expect(getMyActiveBid([a, b])).toBeUndefined();
  });

  it('dedupePendingBidsByProProfile keeps newest PENDING per professional profile', () => {
    const pro = minimalUser(7);
    const older = makeBid({
      id: 10,
      status: 'PENDING',
      priceQuote: 1,
      createdAt: '2025-01-01',
      professional: pro,
    });
    const newer = makeBid({
      id: 20,
      status: 'PENDING',
      priceQuote: 2,
      createdAt: '2025-01-02',
      professional: pro,
    });
    const other = makeBid({
      id: 11,
      status: 'PENDING',
      priceQuote: 3,
      createdAt: '2025-01-01',
      professional: minimalUser(8),
    });
    const result = dedupePendingBidsByProProfile([older, newer, other]);
    expect(result.map((b) => b.id).sort()).toEqual([11, 20]);
  });

  it('getRequestIdFromBid reads numeric id from @id when id field is absent (Hydra)', () => {
    const bid = makeBid({
      id: 5,
      status: 'PENDING',
      priceQuote: 1,
      createdAt: '2025-01-01',
      request: { '@id': '/api/requests/42' } as Bid['request'],
    });
    expect(getRequestIdFromBid(bid)).toBe(42);
  });

  it('dedupeBidsByRequestForMyWork prefers PENDING for same request', () => {
    const req = minimalRequest(99);
    const rej = makeBid({
      id: 1,
      status: 'REJECTED',
      priceQuote: 1,
      createdAt: '2025-01-01',
      request: req,
    });
    const pend = makeBid({
      id: 2,
      status: 'PENDING',
      priceQuote: 2,
      createdAt: '2025-01-02',
      request: req,
    });
    expect(dedupeBidsByRequestForMyWork([rej, pend])).toEqual([pend]);
  });
});
