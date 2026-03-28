/**
 * Tier efectivo alineado con el API: suscripción de pago activa solo si
 * paidThroughAt != null y paidThroughAt > ahora (ISO 8601).
 * Prioriza professionalProfile.paidThroughAt si viene informado (contrato backend).
 * Si es PRO/SOLVER por rol pero no hay pago vigente → FREE en UI (roles pueden conservarse en servidor).
 */

export type EffectiveTier = 'CLIENT' | 'FREE' | 'SOLVER' | 'PRO';

export interface UserForTier {
  roles?: string[];
  professionalProfile?: unknown;
  paidThroughAt?: string | null;
}

function professionalPaidThrough(prof: unknown): string | null {
  if (!prof || typeof prof !== 'object') return null;
  const p = prof as { paidThroughAt?: string | null };
  if (p.paidThroughAt != null && String(p.paidThroughAt).trim() !== '') {
    return p.paidThroughAt;
  }
  return null;
}

/** Fecha fin de periodo / suscripción: anidada en perfil profesional o en usuario. */
export function resolvePaidThroughAt(user: UserForTier | null): string | null {
  if (!user) return null;
  const nested = user.professionalProfile
    ? professionalPaidThrough(user.professionalProfile)
    : null;
  if (nested) return nested;
  if (user.paidThroughAt != null && String(user.paidThroughAt).trim() !== '') {
    return user.paidThroughAt;
  }
  return null;
}

/** Misma regla que el backend: activo solo con fecha futura estricta. */
export function hasActivePaidSubscription(user: UserForTier | null): boolean {
  const iso = resolvePaidThroughAt(user);
  if (iso == null) return false;
  return new Date(iso).getTime() > Date.now();
}

export function getEffectiveTier(user: UserForTier | null): EffectiveTier {
  if (!user) return 'CLIENT';
  const roles = user.roles || [];
  const hasProOrSolver =
    roles.includes('ROLE_PRO') || roles.includes('ROLE_SOLVER');

  if (hasProOrSolver && !hasActivePaidSubscription(user)) return 'FREE';

  if (roles.includes('ROLE_PRO') && hasActivePaidSubscription(user)) return 'PRO';
  if (roles.includes('ROLE_SOLVER') && hasActivePaidSubscription(user)) {
    return 'SOLVER';
  }
  if (roles.includes('ROLE_FREE') || user.professionalProfile) return 'FREE';
  return 'CLIENT';
}

/** PRO/SOLVER con rol pero sin suscripción vigente (caducada, null, o fecha no futura). */
export function isDowngradedDueToExpiredPayment(user: UserForTier | null): boolean {
  if (!user) return false;
  const roles = user.roles || [];
  const hasProOrSolver =
    roles.includes('ROLE_PRO') || roles.includes('ROLE_SOLVER');
  if (!hasProOrSolver) return false;
  return !hasActivePaidSubscription(user);
}
