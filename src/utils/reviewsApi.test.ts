import { describe, expect, it, vi, beforeEach } from 'vitest';
import api from '../api/axios';
import {
  averageRating,
  fetchReviewsByAuthor,
  fetchReviewsByTarget,
  filterReceivedByMode,
  normalizeProfileReview,
} from './reviewsApi';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}));

describe('normalizeProfileReview', () => {
  it('maps API display fields (author string, rating, date, text)', () => {
    const item = normalizeProfileReview({
      id: 1,
      author: 'Ana Cliente',
      rating: 5,
      text: 'Muy bien',
      date: 'Hoy',
      targetName: 'Pepe Pro',
      requestTitle: 'Arreglar grifo',
      authorIsProfessional: false,
    });
    expect(item).toMatchObject({
      id: 1,
      authorName: 'Ana Cliente',
      targetName: 'Pepe Pro',
      rating: 5,
      comment: 'Muy bien',
      dateLabel: 'Hoy',
      requestTitle: 'Arreglar grifo',
      authorIsProfessional: false,
    });
  });

  it('falls back to score/comment/createdAt', () => {
    const item = normalizeProfileReview({
      id: 2,
      score: 4,
      comment: 'Ok',
      createdAt: '2026-01-15T12:00:00.000Z',
      authorName: 'Luis',
    });
    expect(item.rating).toBe(4);
    expect(item.comment).toBe('Ok');
    expect(item.authorName).toBe('Luis');
    expect(item.dateLabel.length).toBeGreaterThan(0);
  });
});

describe('filterReceivedByMode', () => {
  const items = [
    { id: 1, authorName: 'A', targetName: 'Me', rating: 5, comment: '', dateLabel: '', authorIsProfessional: true },
    { id: 2, authorName: 'B', targetName: 'Me', rating: 4, comment: '', dateLabel: '', authorIsProfessional: false },
  ];

  it('keeps pro-authored reviews in client mode', () => {
    expect(filterReceivedByMode(items, 'client').map((r) => r.id)).toEqual([1]);
  });

  it('keeps client-authored reviews in pro mode', () => {
    expect(filterReceivedByMode(items, 'pro').map((r) => r.id)).toEqual([2]);
  });

  it('returns all when facet flag is missing', () => {
    const plain = items.map(({ authorIsProfessional: _a, ...rest }) => rest);
    expect(filterReceivedByMode(plain, 'client')).toHaveLength(2);
  });
});

describe('averageRating', () => {
  it('returns null for empty list', () => {
    expect(averageRating([])).toBeNull();
  });

  it('rounds to one decimal', () => {
    expect(
      averageRating([
        { id: 1, authorName: '', targetName: '', rating: 5, comment: '', dateLabel: '' },
        { id: 2, authorName: '', targetName: '', rating: 4, comment: '', dateLabel: '' },
      ])
    ).toBe(4.5);
  });
});

describe('fetchReviewsByTarget / Author', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('fetches with target IRI and hydra:member', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        'hydra:member': [{ id: 9, author: 'X', rating: 5, text: 'ok', date: 'Hoy' }],
      },
    });
    const items = await fetchReviewsByTarget(3);
    expect(api.get).toHaveBeenCalledWith('/reviews', {
      params: { target: '/api/users/3' },
    });
    expect(items[0].authorName).toBe('X');
  });

  it('fetches with author IRI and member', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        member: [{ id: 1, author: 'Yo', targetName: 'Pro', score: 4, comment: 'bien' }],
      },
    });
    const items = await fetchReviewsByAuthor(7);
    expect(api.get).toHaveBeenCalledWith('/reviews', {
      params: { author: '/api/users/7' },
    });
    expect(items[0].targetName).toBe('Pro');
    expect(items[0].rating).toBe(4);
  });
});
