import api from './axios';

export type VerifyEmailApiResponse = {
  success: boolean;
  message: string;
};

function normalizeVerifyEmailPayload(data: unknown): VerifyEmailApiResponse {
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    const success = typeof o.success === 'boolean' ? o.success : true;
    const message =
      typeof o.message === 'string'
        ? o.message
        : success
          ? 'Operación completada.'
          : 'No se pudo completar la operación.';
    return { success, message };
  }
  return { success: true, message: 'Operación completada.' };
}

/**
 * Confirma el email con el token del enlace (sin JWT).
 * POST /verify/email con { token } — coherente con GET /verify/email?token= en backend.
 */
export async function confirmEmailWithToken(
  token: string,
): Promise<VerifyEmailApiResponse> {
  const { data } = await api.post<unknown>(
    '/verify/email',
    { token },
    { skipAuthHeader: true, skipAuthRedirect: true },
  );
  return normalizeVerifyEmailPayload(data);
}

/**
 * Reenvía el correo de verificación (usuario autenticado, email pendiente).
 * POST /verify/email/resend con cuerpo vacío y Authorization: Bearer.
 */
export async function resendVerificationEmail(): Promise<VerifyEmailApiResponse> {
  const { data } = await api.post<unknown>('/verify/email/resend', {}, {
    skipAuthRedirect: true,
  });
  return normalizeVerifyEmailPayload(data);
}
