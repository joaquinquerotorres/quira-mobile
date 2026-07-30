import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createFetchFreshness } from './fetchFreshness';

describe('createFetchFreshness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-30T12:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not skip before the first mark', () => {
    const f = createFetchFreshness(45_000);
    expect(f.shouldSkip('a')).toBe(false);
  });

  it('skips same key within TTL and allows after TTL or force', () => {
    const f = createFetchFreshness(45_000);
    f.mark('market|');
    expect(f.shouldSkip('market|')).toBe(true);
    expect(f.shouldSkip('market|', { force: true })).toBe(false);
    expect(f.shouldSkip('market|cat')).toBe(false);

    vi.advanceTimersByTime(45_001);
    expect(f.shouldSkip('market|')).toBe(false);
  });

  it('invalidate clears freshness', () => {
    const f = createFetchFreshness(45_000);
    f.mark('x');
    expect(f.shouldSkip('x')).toBe(true);
    f.invalidate();
    expect(f.shouldSkip('x')).toBe(false);
  });
});
