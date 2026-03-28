import React, { useEffect, useState } from 'react';
import { IonAlert } from '@ionic/react';
import { isDowngradedDueToExpiredPayment } from '../utils/effectiveTier';

export const SESSION_KEY_DOWNGADE_DISMISSED = 'quira_downgrade_banner_dismissed';

/**
 * Muestra una alerta única por sesión cuando un PRO/SOLVER ha dejado de pagar
 * y se le trata como FREE. Solo con sesión activa (token), no en /login con datos huérfanos.
 * Al cerrar, no se vuelve a mostrar hasta el próximo login.
 */
export const DowngradeBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY_DOWNGADE_DISMISSED) === '1') return;

    const token = localStorage.getItem('quira_token');
    if (!token) return;

    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
      const user = JSON.parse(userStr);
      if (isDowngradedDueToExpiredPayment(user)) {
        setShowBanner(true);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(SESSION_KEY_DOWNGADE_DISMISSED, '1');
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
        { text: 'Renovar suscripción', handler: () => { handleDismiss(); window.location.href = '/become-pro'; } },
      ]}
    />
  );
};
