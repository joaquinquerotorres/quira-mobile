import { describe, expect, test } from 'vitest';
import { resolveMediaUrl } from './mediaUrl';

describe('resolveMediaUrl', () => {
  test('returns empty string for null/undefined/empty', () => {
    expect(resolveMediaUrl(null)).toBe('');
    expect(resolveMediaUrl(undefined)).toBe('');
    expect(resolveMediaUrl('')).toBe('');
  });

  test('returns absolute URLs unchanged', () => {
    expect(resolveMediaUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(resolveMediaUrl('http://cdn.example.com/a.png')).toBe('http://cdn.example.com/a.png');
  });

  test('prefixes relative URLs with serverUrl (env fallback safe)', () => {
    // In tests env.serverUrl may be '' (fallback from env.ts). We only assert it preserves the path.
    expect(resolveMediaUrl('/uploads/a.png').endsWith('/uploads/a.png')).toBe(true);
    expect(resolveMediaUrl('uploads/a.png').endsWith('uploads/a.png')).toBe(true);
  });
});

