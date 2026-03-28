import api from '../api/axios';

export type SubscriptionTier = 'SOLVER' | 'PRO';

export interface CreateCheckoutSessionParams {
  tier: SubscriptionTier;
  professionalProfileId: number;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId?: string;
}

/**
 * Crea una sesión de Stripe Checkout para suscripción SOLVER o PRO.
 * El backend debe exponer POST /stripe/checkout-session
 * y devolver { url: string } para redirigir al usuario.
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<CheckoutSessionResponse> {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const successUrl = params.successUrl ?? `${base}/become-pro?success=1`;
  const cancelUrl = params.cancelUrl ?? `${base}/become-pro?canceled=1`;

  const response = await api.post<CheckoutSessionResponse>('/stripe/checkout-session', {
    tier: params.tier,
    professionalProfileId: params.professionalProfileId,
    successUrl,
    cancelUrl,
  });

  const data = response.data;
  if (!data?.url) {
    throw new Error('No se recibió la URL de checkout');
  }
  return data;
}

/**
 * Fuerza sincronización con Stripe en servidor (p. ej. tras Checkout success).
 * Imprescindible si el webhook llega tarde: luego GET /users/{id} para paidThroughAt.
 * POST /stripe/sync-subscription (JWT en cabecera vía interceptor).
 */
export async function syncSubscriptionFromStripe(): Promise<void> {
  await api.post('/stripe/sync-subscription', {});
}
