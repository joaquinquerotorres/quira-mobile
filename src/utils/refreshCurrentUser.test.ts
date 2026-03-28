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
});
