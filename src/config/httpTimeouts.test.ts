import { describe, it, expect } from 'vitest';
import { PREDICT_REQUEST_TIMEOUT_MS } from './httpTimeouts';

describe('httpTimeouts', () => {
  it('PREDICT_REQUEST_TIMEOUT_MS es explícito y está en el rango recomendado 120–300 s', () => {
    expect(PREDICT_REQUEST_TIMEOUT_MS).toBe(300_000);
    expect(PREDICT_REQUEST_TIMEOUT_MS).toBeGreaterThanOrEqual(120_000);
    expect(PREDICT_REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(300_000);
  });
});
