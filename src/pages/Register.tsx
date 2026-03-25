import React, { useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonToast,
  IonLoading,
  IonButtons,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useIonRouter } from '@ionic/react';
import api from '../api/axios';
import './Register.css';
import { RegisterHeader } from '../components/register/RegisterHeader';
import { RegisterForm } from '../components/register/RegisterForm';

const Register: React.FC = () => {
  const router = useIonRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setToast('Por favor, rellena todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        email,
        password,
        clientProfile: { fullName },
      };

      await api.post('/users', payload);

      setToast('¡Cuenta creada! Revisa tu correo para verificar tu cuenta antes de iniciar sesión.');
      setTimeout(() => router.push('/login'), 2000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: Record<string, unknown> } };
      const data = err.response?.data ?? {};
      const violations = data.violations as Array<{ message?: string }> | undefined;
      const hydraDesc = data['hydra:description'] as string | undefined;

      const msg =
        violations?.[0]?.message ?? hydraDesc ?? 'Error al registrarse. Verifica los datos.';

      setToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#f8fafc' } as React.CSSProperties}>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()} className="register-back-btn">
              <IonIcon icon={chevronBackOutline} color="dark" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding register-content">
        <div className="register-hero animate__animated animate__fadeIn">
          <RegisterHeader />
        </div>

        <div className="animate__animated animate__fadeInUp">
          <RegisterForm
            fullName={fullName}
            email={email}
            password={password}
            loading={loading}
            onFullNameChange={setFullName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleRegister}
          />
        </div>

        <IonLoading isOpen={loading} message="Registrando usuario..." />
        <IonToast
          isOpen={!!toast}
          message={toast ?? ''}
          duration={3000}
          onDidDismiss={() => setToast(null)}
          position="top"
          color="dark"
          style={{ '--border-radius': '12px' } as React.CSSProperties}
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;
