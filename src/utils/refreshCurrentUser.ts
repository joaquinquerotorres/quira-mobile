import api from '../api/axios';

function extractUser(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (p.id != null) return p;
  const hydra = p['hydra:member'];
  if (Array.isArray(hydra) && hydra[0]) return hydra[0] as Record<string, unknown>;
  const member = p.member;
  if (Array.isArray(member) && member[0]) return member[0] as Record<string, unknown>;
  return null;
}

function persistFreshUser(fresh: Record<string, unknown> | null): boolean {
  if (fresh && fresh.id != null) {
    localStorage.setItem('user', JSON.stringify(fresh));
    return true;
  }
  return false;
}

/**
 * Refresca `localStorage.user` desde GET /users/:id (mismo contrato que Profile).
 * Si el id local está obsoleto (p. ej. tras reseed de fixtures), reintenta por email.
 */
export async function refreshCurrentUserInStorage(): Promise<boolean> {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  try {
    const parsed = JSON.parse(userStr) as {
      id?: number;
      email?: string;
      '@id'?: string;
    };
    const rawId = parsed.id ?? parsed['@id']?.split('/').pop();
    const userId = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10);
    const email = typeof parsed.email === 'string' ? parsed.email.trim() : '';

    if (userId && !Number.isNaN(userId)) {
      try {
        const res = await api.get(`/users/${userId}`);
        if (persistFreshUser(extractUser(res.data))) {
          return true;
        }
      } catch {
        /* id obsoleto / 404 → fallback por email */
      }
    }

    if (email) {
      const res = await api.get(`/users?email=${encodeURIComponent(email)}`);
      return persistFreshUser(extractUser(res.data));
    }
  } catch {
    /* sin red / 401: mantener localStorage */
  }
  return false;
}
