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
  useIonViewWillEnter,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import api from '../api/axios';
import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {
  const router = useIonRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useIonViewWillEnter(() => {
    setSuccess(false);
    setToast(null);
    setEmail('');
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setToast('Introduce tu email.');
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      await api.post('/users/forgot-password', { email: email.trim() }, {
        skipAuthRedirect: true,
      } as any);
      setSuccess(true);
      setToast('Si existe una cuenta con ese email, recibirás un enlace para recuperar tu contraseña.');
    } catch {
      setSuccess(true);
      setToast('Si existe una cuenta con ese email, recibirás un enlace para recuperar tu contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Recuperar contraseña</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="forgot-password-content">
          <h2>¿Olvidaste tu contraseña?</h2>
          <p>Introduce tu email y te enviaremos un enlace para crear una nueva contraseña.</p>

          {success ? (
            <div className="forgot-password-success">
              <p>Revisa tu bandeja de entrada (y la carpeta de spam). Si el email existe en nuestra base de datos, recibirás las instrucciones.</p>
              <button type="button" className="forgot-password-try-again" onClick={() => { setSuccess(false); setEmail(''); setToast(null); }}>
                ¿Te equivocaste? Probar con otro email
              </button>
              <IonButton expand="block" routerLink="/login">
                Volver a Iniciar sesión
              </IonButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forgot-password-form">
              <div className="forgot-password-input-wrap">
                <IonInput
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value ?? '')}
                  clearOnEdit={false}
                />
              </div>
              <IonButton
                expand="block"
                type="submit"
                disabled={loading}
                className="forgot-password-btn"
              >
                {loading ? (
                  <IonSpinner name="crescent" />
                ) : (
                  'Enviar enlace'
                )}
              </IonButton>
            </form>
          )}
        </div>
        <IonToast
          isOpen={!!toast}
          message={toast || ''}
          duration={4000}
          onDidDismiss={() => setToast(null)}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
