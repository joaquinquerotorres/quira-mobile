import { describe, expect, test } from 'vitest';
import { getApiErrorMessage } from './apiError';

describe('getApiErrorMessage', () => {
  test('prefers hydra:description when present', () => {
    const err = { response: { data: { 'hydra:description': 'Hydra message' } } };
    expect(getApiErrorMessage(err)).toBe('Hydra message');
  });

  test('prefers API Platform violations message for POST /bids (422)', () => {
    const err = {
      response: {
        data: {
          violations: [
            {
              propertyPath: 'riskLevel',
              code: 'BID_HIGH_REQUIRES_PAID_SUBSCRIPTION',
              message: 'Las pujas HIGH requieren suscripción activa.',
            },
          ],
        },
      },
    };
    expect(getApiErrorMessage(err)).toBe('Las pujas HIGH requieren suscripción activa.');
  });

  test('with multiple violations, prefers BID_HIGH over BID_MONTHLY_LIMIT order', () => {
    const err = {
      response: {
        data: {
          violations: [
            { code: 'OTHER', message: 'Otro' },
            {
              code: 'BID_HIGH_REQUIRES_PAID_SUBSCRIPTION',
              message: 'HIGH requiere pago.',
            },
            {
              code: 'BID_MONTHLY_LIMIT_EXCEEDED',
              message: 'Límite mensual.',
            },
          ],
        },
      },
    };
    expect(getApiErrorMessage(err)).toBe('HIGH requiere pago.');
  });

  test('uses BID_MONTHLY_LIMIT_EXCEEDED when it is the only bid code', () => {
    const err = {
      response: {
        data: {
          violations: [
            { code: 'BID_MONTHLY_LIMIT_EXCEEDED', message: 'Has alcanzado el límite de pujas del mes.' },
          ],
        },
      },
    };
    expect(getApiErrorMessage(err)).toBe('Has alcanzado el límite de pujas del mes.');
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

