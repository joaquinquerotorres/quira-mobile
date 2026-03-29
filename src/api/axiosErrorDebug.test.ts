import { describe, it, expect } from 'vitest';
import axios from 'axios';
import {
  axiosErrorUserHint,
  getBackendErrorMessage,
} from './axiosErrorDebug';

describe('getBackendErrorMessage', () => {
  it('extrae detail de API Platform / Symfony', () => {
    const err = new axios.AxiosError('bad');
    err.response = {
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: {} as never,
      data: { detail: 'Token de identidad inválido' },
    };
    expect(getBackendErrorMessage(err)).toBe('Token de identidad inválido');
  });

  it('extrae hydra:description', () => {
    const err = new axios.AxiosError('bad');
    err.response = {
      status: 422,
      statusText: 'Unprocessable',
      headers: {},
      config: {} as never,
      data: { 'hydra:description': 'Violación de validación' },
    };
    expect(getBackendErrorMessage(err)).toBe('Violación de validación');
  });

  it('devuelve undefined si no hay cuerpo util', () => {
    const err = new axios.AxiosError('bad');
    err.response = {
      status: 500,
      statusText: 'Error',
      headers: {},
      config: {} as never,
      data: {},
    };
    expect(getBackendErrorMessage(err)).toBeUndefined();
  });

  it('devuelve undefined para errores no-Axios', () => {
    expect(getBackendErrorMessage(new Error('fail'))).toBeUndefined();
  });
});

describe('axiosErrorUserHint', () => {
  it('sugiere red cuando no hay response', () => {
    const err = new axios.AxiosError('Network Error');
    err.code = 'ERR_NETWORK';
    expect(axiosErrorUserHint(err)).toMatch(/conexión|servidor/i);
  });
});
