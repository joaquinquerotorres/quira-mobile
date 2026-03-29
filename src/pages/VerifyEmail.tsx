import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonSpinner,
  IonButton,
  IonToast,
} from '@ionic/react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import './VerifyEmail.css';

const VerifyEmail: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No se ha encontrado un token de verificación.');
      return;
    }

    const verify = async () => {
      try {
        await api.post(
          '/verify/email',
          { token },
          { skipAuthRedirect: true }
        );
        setStatus('success');
        setMessage('Email verificado correctamente.');
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setStatus('error');
        setMessage(
          axiosErr.response?.data?.message ||
            'Token inválido o expirado. Solicita un nuevo correo de verificación.'
        );
      }
    };

    verify();
  }, [token]);

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
              <IonButton expand="block" routerLink="/login" className="verify-email-btn">
                Ir a iniciar sesión
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
                routerLink="/login"
                className="verify-email-btn"
              >
                Volver al inicio
              </IonButton>
            </div>
          )}
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

export default VerifyEmail;
