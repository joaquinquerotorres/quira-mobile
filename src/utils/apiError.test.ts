import { describe, expect, test } from 'vitest';
import { getApiErrorMessage } from './apiError';

describe('getApiErrorMessage', () => {
  test('prefers hydra:description when present', () => {
    const err = { response: { data: { 'hydra:description': 'Hydra message' } } };
    expect(getApiErrorMessage(err)).toBe('Hydra message');
  });

  test('falls back to message, then detail, then generic connection error', () => {
    expect(getApiErrorMessage({ response: { data: { message: 'Msg' } } })).toBe('Msg');
    expect(getApiErrorMessage({ response: { data: { detail: 'Detail' } } })).toBe('Detail');
    expect(getApiErrorMessage({ response: { data: {} } })).toBe('Error de conexión. Inténtalo de nuevo.');
  });

  test('uses Error.message for Error instances', () => {
    expect(getApiErrorMessage(new Error('Boom'))).toBe('Boom');
  });

  test('returns unknown fallback for non Error and no response shape', () => {
    expect(getApiErrorMessage('nope')).toBe('Error desconocido. Inténtalo de nuevo.');
    expect(getApiErrorMessage({})).toBe('Error desconocido. Inténtalo de nuevo.');
  });
});

