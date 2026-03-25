import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckoutSession } from './stripeService';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() },
}));

describe('stripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createCheckoutSession returns url from API response', async () => {
    const mockUrl = 'https://checkout.stripe.com/c/pay/cs_test_xxx';
    vi.mocked(api.post).mockResolvedValue({ data: { url: mockUrl } });

    const result = await createCheckoutSession({
      tier: 'SOLVER',
      professionalProfileId: 42,
    });

    expect(result.url).toBe(mockUrl);
    expect(api.post).toHaveBeenCalledWith(
      '/stripe/checkout-session',
      expect.objectContaining({
        tier: 'SOLVER',
        professionalProfileId: 42,
        successUrl: expect.stringContaining('/become-pro?success=1'),
        cancelUrl: expect.stringContaining('/become-pro?canceled=1'),
      })
    );
  });

  it('createCheckoutSession passes custom successUrl and cancelUrl when provided', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { url: 'https://stripe.com/xxx' } });

    await createCheckoutSession({
      tier: 'PRO',
      professionalProfileId: 1,
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/stripe/checkout-session',
      expect.objectContaining({
        successUrl: 'https://app.test/success',
        cancelUrl: 'https://app.test/cancel',
      })
    );
  });

  it('createCheckoutSession throws when API returns no url', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await expect(
      createCheckoutSession({ tier: 'SOLVER', professionalProfileId: 1 })
    ).rejects.toThrow('No se recibió la URL de checkout');
  });

  it('createCheckoutSession throws when API returns null url', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { url: null } });

    await expect(
      createCheckoutSession({ tier: 'PRO', professionalProfileId: 1 })
    ).rejects.toThrow('No se recibió la URL de checkout');
  });
});
