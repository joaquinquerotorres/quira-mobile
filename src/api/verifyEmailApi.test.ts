import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './axios';
import { confirmEmailWithToken, resendVerificationEmail } from './verifyEmailApi';

vi.mock('./axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('verifyEmailApi', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it('confirmEmailWithToken envía token sin cabecera de auth', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, message: 'Verificado' },
    });

    const r = await confirmEmailWithToken('abc-token');

    expect(api.post).toHaveBeenCalledWith(
      '/verify/email',
      { token: 'abc-token' },
      { skipAuthHeader: true, skipAuthRedirect: true },
    );
    expect(r.success).toBe(true);
    expect(r.message).toBe('Verificado');
  });

  it('resendVerificationEmail usa /verify/email/resend', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: true, message: 'Enviado' },
    });

    await resendVerificationEmail();

    expect(api.post).toHaveBeenCalledWith('/verify/email/resend', {}, {
      skipAuthRedirect: true,
    });
  });

  it('normaliza cuerpo sin success explícito como éxito', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { message: 'Hecho' } });

    const r = await confirmEmailWithToken('t');

    expect(r.success).toBe(true);
    expect(r.message).toBe('Hecho');
  });

  it('normaliza success false con mensaje', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { success: false, message: 'Caducado' },
    });

    const r = await confirmEmailWithToken('t');

    expect(r.success).toBe(false);
    expect(r.message).toBe('Caducado');
  });
});
