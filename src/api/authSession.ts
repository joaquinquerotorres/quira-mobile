/**
 * Limpia credenciales locales y envía a la pantalla de login.
 * Usado ante 401 sin skipAuthRedirect (ver docs/ARQUITECTURA.md).
 */
export function clearStoredAuthAndRedirectToLogin(): void {
  localStorage.removeItem('quira_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
