import React, { useState } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonInput,
  IonToast,
  IonSpinner,
  useIonRouter,
} from '@ionic/react';
import { chevronBackOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
  const location = useLocation();
  const router = useIonRouter();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!password.trim()) {
      setToast('Introduce una contraseña.');
      return;
    }
    if (password.length < 6) {
      setToast('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setToast('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setToast(null);
    try {
      await api.post(
        '/users/reset-password',
        { token, password },
        { skipAuthRedirect: true }
      );
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setToast(
        axiosErr.response?.data?.message ||
          'Error al restablecer la contraseña. El enlace puede haber expirado.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="reset-password-invalid">
            <p>Enlace inválido o incompleto. Solicita un nuevo correo de recuperación desde la pantalla de inicio de sesión.</p>
            <IonButton expand="block" routerLink="/login">
              Ir a iniciar sesión
            </IonButton>
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
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Nueva contraseña</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="reset-password-content">
          {success ? (
            <div className="reset-password-success">
              <div className="reset-icon-circle success">
                <span>✓</span>
              </div>
              <h2>Contraseña actualizada</h2>
              <p>Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <IonButton expand="block" routerLink="/login" className="reset-password-btn">
                Iniciar sesión
              </IonButton>
            </div>
          ) : (
            <>
              <h2>Elige una nueva contraseña</h2>
              <p className="reset-password-desc">
                Introduce tu nueva contraseña (mínimo 6 caracteres).
              </p>

              <form onSubmit={handleSubmit} className="reset-password-form">
                <div className="reset-input-group">
                  <IonInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nueva contraseña"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value ?? '')}
                    className="reset-password-input"
                  />
                  <IonIcon
                    icon={showPassword ? eyeOffOutline : eyeOutline}
                    className="reset-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
                <div className="reset-input-group">
                  <IonInput
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repetir contraseña"
                    value={confirmPassword}
                    onIonInput={(e) => setConfirmPassword(e.detail.value ?? '')}
                    className="reset-password-input"
                  />
                </div>
                <IonButton
                  expand="block"
                  type="submit"
                  disabled={loading}
                  className="reset-password-btn"
                >
                  {loading ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    'Restablecer contraseña'
                  )}
                </IonButton>
              </form>
            </>
          )}
        </div>
        <IonToast
          isOpen={!!toast}
          message={toast || ''}
          duration={TOAST_DURATION_MS}
          onDidDismiss={() => setToast(null)}
          position="top"
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;
