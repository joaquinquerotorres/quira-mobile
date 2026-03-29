import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonButton,
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { confirmEmailWithToken } from '../api/verifyEmailApi';
import { getBackendErrorMessage } from '../api/axiosErrorDebug';
import { refreshCurrentUserInStorage } from '../utils/refreshCurrentUser';
import './VerifyEmail.css';

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [postVerifyCta, setPostVerifyCta] = useState<'session' | 'login'>('login');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(
        'Falta el enlace de verificación. Abre el correo y pulsa el botón, o pide un nuevo correo desde Perfil.',
      );
      return;
    }

    const verify = async () => {
      try {
        const data = await confirmEmailWithToken(token);
        if (!data.success) {
          setStatus('error');
          setMessage(
            data.message ||
              'No se pudo verificar el correo. El enlace puede haber caducado.',
          );
          return;
        }

        const hadSession = !!localStorage.getItem('quira_token');
        if (hadSession) {
          const ok = await refreshCurrentUserInStorage();
          setPostVerifyCta(ok ? 'session' : 'login');
        } else {
          setPostVerifyCta('login');
        }

        setStatus('success');
        setMessage(
          data.message?.trim()
            ? data.message
            : 'Tu correo quedó verificado correctamente.',
        );
      } catch (err: unknown) {
        setStatus('error');
        if (axios.isAxiosError(err) && err.response?.data) {
          const d = err.response.data as { success?: boolean; message?: string };
          if (typeof d.success === 'boolean' && d.success === false && d.message) {
            setMessage(d.message);
            return;
          }
        }
        setMessage(
          getBackendErrorMessage(err) ||
            'Token inválido o expirado. Solicita un nuevo correo de verificación desde Perfil.',
        );
      }
    };

    verify();
  }, [token]);

  const primaryHref =
    postVerifyCta === 'session' ? '/request-list' : '/login';
  const primaryLabel =
    postVerifyCta === 'session' ? 'Ir al inicio' : 'Ir a iniciar sesión';

  return (
    <IonPage>
      <IonContent fullscreen className="verify-email-content">
        <div className="verify-email-card">
          <div className="verify-email-logo">
            <span className="verify-logo-qu">Qu</span>
            <span className="verify-logo-i">i</span>
            <span className="verify-logo-ra">ra</span>
          </div>

          {status === 'loading' && (
            <div className="verify-email-loading">
              <IonSpinner name="crescent" color="primary" />
              <p>Verificando tu correo...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verify-email-result success">
              <div className="verify-icon-circle success">
                <span>✓</span>
              </div>
              <h2>¡Correo verificado!</h2>
              <p>{message}</p>
              <IonButton
                expand="block"
                routerLink={primaryHref}
                className="verify-email-btn"
              >
                {primaryLabel}
              </IonButton>
            </div>
          )}

          {status === 'error' && (
            <div className="verify-email-result error">
              <div className="verify-icon-circle error">
                <span>!</span>
              </div>
              <h2>Verificación fallida</h2>
              <p>{message}</p>
              <IonButton
                expand="block"
                fill="outline"
                color="primary"
                routerLink="/verify-email-pending"
                className="verify-email-btn"
              >
                Reenviar correo de verificación
              </IonButton>
              <IonButton
                expand="block"
                routerLink="/login"
                className="verify-email-btn"
              >
                Volver al inicio de sesión
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default VerifyEmail;
