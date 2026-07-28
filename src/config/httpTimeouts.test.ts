import { describe, it, expect } from 'vitest';
import {
  PREDICT_POLL_INTERVAL_MS,
  PREDICT_POLL_TIMEOUT_MS,
  PREDICT_REQUEST_TIMEOUT_MS,
} from './httpTimeouts';

describe('httpTimeouts', () => {
  it('PREDICT_REQUEST_TIMEOUT_MS cubre la espera de Gemini tras subida por URL', () => {
    expect(PREDICT_REQUEST_TIMEOUT_MS).toBe(120_000);
    expect(PREDICT_REQUEST_TIMEOUT_MS).toBeGreaterThanOrEqual(60_000);
    expect(PREDICT_REQUEST_TIMEOUT_MS).toBeLessThanOrEqual(300_000);
  });

  it('polling de tareas predict tiene intervalo y tope sensatos', () => {
    expect(PREDICT_POLL_INTERVAL_MS).toBe(1_500);
    expect(PREDICT_POLL_TIMEOUT_MS).toBe(180_000);
    expect(PREDICT_POLL_TIMEOUT_MS).toBeGreaterThan(PREDICT_REQUEST_TIMEOUT_MS);
  });
});
