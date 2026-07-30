import { describe, expect, it } from 'vitest';
import { formatQuiraMemberSince } from './formatQuiraMemberSince';

describe('formatQuiraMemberSince', () => {
  it('formats month and year in Spanish', () => {
    expect(formatQuiraMemberSince('2026-05-12T12:00:00+00:00')).toBe(
      'En Quira desde mayo de 2026',
    );
    expect(formatQuiraMemberSince('2024-01-15T12:00:00Z')).toBe(
      'En Quira desde enero de 2024',
    );
    expect(formatQuiraMemberSince('2025-12-20T12:00:00+01:00')).toBe(
      'En Quira desde diciembre de 2025',
    );
  });

  it('returns null when missing or invalid', () => {
    expect(formatQuiraMemberSince(null)).toBeNull();
    expect(formatQuiraMemberSince(undefined)).toBeNull();
    expect(formatQuiraMemberSince('')).toBeNull();
    expect(formatQuiraMemberSince('   ')).toBeNull();
    expect(formatQuiraMemberSince('not-a-date')).toBeNull();
  });
});
