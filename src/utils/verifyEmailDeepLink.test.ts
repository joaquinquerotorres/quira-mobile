import { describe, it, expect } from 'vitest';
import { parseVerifyEmailTokenFromUrl } from './verifyEmailDeepLink';

describe('parseVerifyEmailTokenFromUrl', () => {
  it('extrae token de URL https del sitio público', () => {
    expect(
      parseVerifyEmailTokenFromUrl(
        'https://quira.app/verify-email?token=abc%2Bdef',
      ),
    ).toBe('abc+def');
  });

  it('acepta www y path sin barra final', () => {
    expect(
      parseVerifyEmailTokenFromUrl(
        'https://www.quira.app/verify-email?token=xyz',
      ),
    ).toBe('xyz');
  });

  it('acepta localhost (previews / entorno dev)', () => {
    expect(
      parseVerifyEmailTokenFromUrl(
        'https://localhost:5173/verify-email?token=dev-token',
      ),
    ).toBe('dev-token');
  });

  it('devuelve null si falta token o está vacío', () => {
    expect(parseVerifyEmailTokenFromUrl('https://quira.app/verify-email')).toBe(
      null,
    );
    expect(
      parseVerifyEmailTokenFromUrl('https://quira.app/verify-email?token='),
    ).toBe(null);
  });

  it('devuelve null para otras rutas', () => {
    expect(
      parseVerifyEmailTokenFromUrl('https://quira.app/login?token=x'),
    ).toBe(null);
  });
});
