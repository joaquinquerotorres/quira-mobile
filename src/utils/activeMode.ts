/** Modo activo de la app: cliente vs profesional. */

export type ActiveMode = 'client' | 'pro';

export const ACTIVE_MODE_KEY = 'quira_active_mode';

export type ModeUser = {
  clientProfile?: unknown | null;
  professionalProfile?: unknown | null;
};

export function hasClientProfile(user: ModeUser | null | undefined): boolean {
  return Boolean(user?.clientProfile);
}

export function hasProfessionalProfile(user: ModeUser | null | undefined): boolean {
  return Boolean(user?.professionalProfile);
}

export function hasDualProfiles(user: ModeUser | null | undefined): boolean {
  return hasClientProfile(user) && hasProfessionalProfile(user);
}

export function getActiveMode(): ActiveMode | null {
  const raw = localStorage.getItem(ACTIVE_MODE_KEY);
  if (raw === 'client' || raw === 'pro') return raw;
  return null;
}

export function setActiveMode(mode: ActiveMode): void {
  localStorage.setItem(ACTIVE_MODE_KEY, mode);
}

export function clearActiveMode(): void {
  localStorage.removeItem(ACTIVE_MODE_KEY);
}

/** Home según modo. */
export function homePathForMode(mode: ActiveMode): string {
  return mode === 'pro' ? '/market' : '/request-list';
}

/**
 * Tras login: si tiene ambos perfiles → elegir modo;
 * si solo pro → modo pro; si solo cliente (o sin pro) → cliente.
 */
export function resolvePostLoginPath(user: ModeUser): string {
  if (hasDualProfiles(user)) {
    clearActiveMode();
    return '/choose-mode';
  }
  if (hasProfessionalProfile(user)) {
    setActiveMode('pro');
    return homePathForMode('pro');
  }
  setActiveMode('client');
  return homePathForMode('client');
}

/** Lee user de localStorage y el modo efectivo (default client). */
export function getEffectiveActiveMode(): ActiveMode {
  const stored = getActiveMode();
  if (stored) return stored;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'client';
    const user = JSON.parse(raw) as ModeUser;
    if (hasProfessionalProfile(user) && !hasClientProfile(user)) return 'pro';
  } catch {
    /* ignore */
  }
  return 'client';
}

export function readStoredUser(): ModeUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as ModeUser;
  } catch {
    return null;
  }
}
