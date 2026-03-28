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

/**
 * Refresca `localStorage.user` desde GET /users/:id (mismo contrato que Profile).
 * Tras Stripe Checkout u otros cambios en servidor, conviene llamar antes de confiar en la UI.
 */
export async function refreshCurrentUserInStorage(): Promise<boolean> {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  try {
    const parsed = JSON.parse(userStr) as { id?: number; '@id'?: string };
    const rawId = parsed.id ?? parsed['@id']?.split('/').pop();
    const userId = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10);
    if (!userId || Number.isNaN(userId)) return false;
    const res = await api.get(`/users/${userId}`);
    const fresh = extractUser(res.data);
    if (fresh && fresh.id != null) {
      localStorage.setItem('user', JSON.stringify(fresh));
      return true;
    }
  } catch {
    /* sin red / 401: mantener localStorage */
  }
  return false;
}
