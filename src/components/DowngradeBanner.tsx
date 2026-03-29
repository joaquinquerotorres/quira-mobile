import React, { useEffect, useState } from 'react';
import { IonAlert } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { isDowngradedDueToExpiredPayment } from '../utils/effectiveTier';

export const SESSION_KEY_DOWNGADE_DISMISSED = 'quira_downgrade_banner_dismissed';

/** Rutas de entrada / credenciales: no mostrar el aviso aunque quede token en localStorage. */
const AUTH_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/verify-email',
  '/reset-password',
]);

function dismissalStorageKey(userId: unknown): string {
  const id =
    userId != null && String(userId).trim() !== ''
      ? String(userId)
      : 'unknown';
  return `${SESSION_KEY_DOWNGADE_DISMISSED}_${id}`;
}

/**
 * Limpia el flag de "aviso ya cerrado" (sesión inválida o cierre de sesión).
 * No usar en logout si ya haces `localStorage.clear()`.
 */
export function clearDowngradeBannerDismissKeys(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY_DOWNGADE_DISMISSED);
  }
  if (typeof localStorage === 'undefined') return;
  const prefix = SESSION_KEY_DOWNGADE_DISMISSED;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k === prefix || (k != null && k.startsWith(`${prefix}_`))) {
      toRemove.push(k);
    }
  }
  toRemove.forEach((k) => localStorage.removeItem(k));
}

/**
 * Muestra una alerta cuando un PRO/SOLVER no tiene suscripción vigente.
 * - No se muestra en pantallas de login/registro aunque exista token guardado.
 * - El cierre se persiste en localStorage por usuario (sobrevive al reinicio de la app;
 *   sessionStorage se pierde en WebView al matar el proceso y reabría el aviso sin esto).
 */
export const DowngradeBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    if (AUTH_PATHS.has(pathname)) {
      setShowBanner(false);
      return;
    }

    const token = localStorage.getItem('quira_token');
    if (!token) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const user = JSON.parse(userStr);
      const key = dismissalStorageKey(user?.id ?? user?.email);
      if (typeof localStorage !== 'undefined' && localStorage.getItem(key) === '1') {
        return;
      }
      if (
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem(SESSION_KEY_DOWNGADE_DISMISSED) === '1'
      ) {
        localStorage.setItem(key, '1');
        sessionStorage.removeItem(SESSION_KEY_DOWNGADE_DISMISSED);
        return;
      }
      if (isDowngradedDueToExpiredPayment(user)) {
        setShowBanner(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, [pathname]);

  const handleDismiss = () => {
    const userStr = localStorage.getItem('user');
    try {
      if (userStr) {
        const user = JSON.parse(userStr);
        localStorage.setItem(dismissalStorageKey(user?.id ?? user?.email), '1');
      }
    } catch {
      /* ignore */
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY_DOWNGADE_DISMISSED, '1');
    }
    setShowBanner(false);
  };

  return (
    <IonAlert
      isOpen={showBanner}
      onDidDismiss={handleDismiss}
      header="Cuota no renovada"
      message="Tu suscripción ha caducado. A partir de ahora tu perfil se comporta como FREE (plan gratuito) hasta que renueves. Podrás seguir viendo tus trabajos en curso, pero tendrás límites en nuevas propuestas. ¿Quieres recuperar los beneficios de ser Pro?"
      buttons={[
        { text: 'Ahora no', role: 'cancel', handler: handleDismiss },
        {
          text: 'Renovar suscripción',
          handler: () => {
            handleDismiss();
            window.location.href = '/become-pro';
          },
        },
      ]}
    />
  );
};
