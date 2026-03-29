import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonButton,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { resendVerificationEmail } from '../api/verifyEmailApi';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import './VerifyEmail.css';

/**
 * Usuario con sesión y email pendiente: reenvía el correo sin token del mail.
 * Útil si abrió el enlace en el sistema y vuelve a la app manualmente.
 */
const VerifyEmailPending: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const hasJwt = !!localStorage.getItem('quira_token');

  const handleResend = async () => {
    if (!hasJwt) {
      setToast('Inicia sesión para poder reenviar el correo de verificación.');
      return;
    }
    setLoading(true);
    try {
      const data = await resendVerificationEmail();
      setToast(
        data.success
          ? data.message ||
              'Si tu correo no estaba verificado, te hemos enviado un email.'
          : data.message || 'No se pudo enviar el correo. Inténtalo más tarde.',
      );
    } catch {
      setToast('No se pudo enviar el correo de verificación. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="verify-email-content">
        <div className="verify-email-card">
          <div className="verify-email-logo">
            <span className="verify-logo-qu">Qu</span>
            <span className="verify-logo-i">i</span>
            <span className="verify-logo-ra">ra</span>
          </div>

          <div className="verify-email-result">
            <h2>Verificar correo</h2>
            <p>
              Revisa tu bandeja de entrada (y spam) y pulsa el enlace del correo
              para confirmar tu email. Si no lo encuentras, puedes pedir uno nuevo.
            </p>

            {!hasJwt && (
              <p style={{ opacity: 0.85, fontSize: '0.95rem' }}>
                Para reenviar el correo necesitas haber iniciado sesión con la misma
                cuenta con la que te registraste.
              </p>
            )}

            <IonButton
              expand="block"
              className="verify-email-btn"
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? <IonSpinner name="crescent" /> : 'Reenviar correo de verificación'}
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              color="primary"
              routerLink="/profile"
              className="verify-email-btn"
            >
              Volver al perfil
            </IonButton>
            <IonButton
              expand="block"
              fill="clear"
              routerLink="/login"
              className="verify-email-btn"
            >
              Ir a iniciar sesión
            </IonButton>
          </div>
        </div>

        <IonToast
          isOpen={!!toast}
          message={toast || ''}
          duration={TOAST_DURATION_MS}
          onDidDismiss={() => setToast(null)}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default VerifyEmailPending;
