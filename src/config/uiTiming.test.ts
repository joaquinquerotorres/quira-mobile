import { describe, it, expect } from 'vitest';
import { TOAST_DURATION_MS } from './uiTiming';

describe('uiTiming', () => {
  it('TOAST_DURATION_MS permite leer el mensaje (varios segundos)', () => {
    expect(TOAST_DURATION_MS).toBe(6000);
    expect(TOAST_DURATION_MS).toBeGreaterThanOrEqual(4000);
  });
});
