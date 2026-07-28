import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshCurrentUserInStorage } from './refreshCurrentUser';
import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}));

describe('refreshCurrentUserInStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.get).mockReset();
  });

  it('writes user from GET /users/:id JSON body', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 5, email: 'a@b.c' }));
    vi.mocked(api.get).mockResolvedValue({
      data: {
        id: 5,
        email: 'a@b.c',
        paidThroughAt: '2030-06-01T00:00:00.000Z',
        roles: ['ROLE_PRO'],
      },
    });

    const ok = await refreshCurrentUserInStorage();

    expect(ok).toBe(true);
    expect(api.get).toHaveBeenCalledWith('/users/5');
    const stored = JSON.parse(localStorage.getItem('user')!);
    expect(stored.paidThroughAt).toBe('2030-06-01T00:00:00.000Z');
  });

  it('extracts user from hydra:member when API returns collection', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 7 }));
    vi.mocked(api.get).mockResolvedValue({
      data: {
        'hydra:member': [{ id: 7, paidThroughAt: '2031-01-01T00:00:00.000Z', roles: ['ROLE_SOLVER'] }],
      },
    });

    const ok = await refreshCurrentUserInStorage();

    expect(ok).toBe(true);
    const stored = JSON.parse(localStorage.getItem('user')!);
    expect(stored.id).toBe(7);
    expect(stored.paidThroughAt).toContain('2031');
  });

  it('returns false when no user in localStorage', async () => {
    const ok = await refreshCurrentUserInStorage();
    expect(ok).toBe(false);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('returns false on network error without throwing', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 1 }));
    vi.mocked(api.get).mockRejectedValue(new Error('network'));

    const ok = await refreshCurrentUserInStorage();

    expect(ok).toBe(false);
    expect(localStorage.getItem('user')).toContain('"id":1');
  });

  it('falls back to email lookup when GET by id fails', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 91, email: 'pro@test.com' })
    );
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/users/91') {
        throw Object.assign(new Error('Not Found'), { response: { status: 404 } });
      }
      if (url.startsWith('/users?email=')) {
        return {
          data: {
            'hydra:member': [
              {
                id: 167,
                email: 'pro@test.com',
                professionalProfile: { id: 106, notifyRequestActivity: true },
              },
            ],
          },
        };
      }
      throw new Error(`Unexpected url: ${url}`);
    });

    const ok = await refreshCurrentUserInStorage();

    expect(ok).toBe(true);
    expect(api.get).toHaveBeenCalledWith('/users/91');
    expect(api.get).toHaveBeenCalledWith('/users?email=pro%40test.com');
    const stored = JSON.parse(localStorage.getItem('user')!);
    expect(stored.id).toBe(167);
    expect(stored.professionalProfile.id).toBe(106);
  });
});
