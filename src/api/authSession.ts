import { clearDowngradeBannerDismissKeys } from '../components/DowngradeBanner';

/**
 * Limpia credenciales locales y envía a la pantalla de login.
 * Usado ante 401 sin skipAuthRedirect (ver docs/ARQUITECTURA.md).
 */
export function clearStoredAuthAndRedirectToLogin(): void {
  localStorage.removeItem('quira_token');
  localStorage.removeItem('user');
  localStorage.removeItem('quira_active_mode');
  clearDowngradeBannerDismissKeys();
  window.location.href = '/login';
}
