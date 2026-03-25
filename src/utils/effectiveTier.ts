/**
 * Calcula el tier efectivo del usuario.
 * Si es PRO o SOLVER pero paidThroughAt ha caducado, se trata como FREE en el frontend
 * (el backend mantiene el tipo para notificaciones/marketing).
 */
export type EffectiveTier = 'CLIENT' | 'FREE' | 'SOLVER' | 'PRO';

export interface UserForTier {
  roles?: string[];
  professionalProfile?: unknown;
  paidThroughAt?: string | null;
}

export function getEffectiveTier(user: UserForTier | null): EffectiveTier {
  if (!user) return 'CLIENT';
  const roles = user.roles || [];
  const paidThroughAt = user.paidThroughAt;
  const isPaidExpired = paidThroughAt != null && new Date(paidThroughAt) < new Date();
  const hasProOrSolver = roles.includes('ROLE_PRO') || roles.includes('ROLE_SOLVER');

  if (hasProOrSolver && isPaidExpired) return 'FREE';

  if (roles.includes('ROLE_PRO')) return 'PRO';
  if (roles.includes('ROLE_SOLVER')) return 'SOLVER';
  if (roles.includes('ROLE_FREE') || user.professionalProfile) return 'FREE';
  return 'CLIENT';
}

/** Indica si el usuario era PRO/SOLVER pero la cuota ha caducado (se trata como FREE) */
export function isDowngradedDueToExpiredPayment(user: UserForTier | null): boolean {
  if (!user) return false;
  const roles = user.roles || [];
  const paidThroughAt = user.paidThroughAt;
  const isPaidExpired = paidThroughAt != null && new Date(paidThroughAt) < new Date();
  return (roles.includes('ROLE_PRO') || roles.includes('ROLE_SOLVER')) && isPaidExpired;
}
