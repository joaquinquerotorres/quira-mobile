/** Rol Symfony / API Platform para operadores internos. */
export const ROLE_ADMIN = 'ROLE_ADMIN';

export type AdminRoleUser = {
  roles?: string[] | null;
} | null | undefined;

export function hasAdminRole(user: AdminRoleUser): boolean {
  const roles = user?.roles;
  if (!Array.isArray(roles)) return false;
  return roles.includes(ROLE_ADMIN);
}

/** Lee el user de localStorage y comprueba ROLE_ADMIN. */
export function isStoredUserAdmin(): boolean {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return false;
    return hasAdminRole(JSON.parse(raw) as AdminRoleUser);
  } catch {
    return false;
  }
}
