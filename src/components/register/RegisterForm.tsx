import React from 'react';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonLabel,
  IonText,
} from '@ionic/react';
import { mailOutline, lockClosedOutline, personOutline, arrowForwardOutline } from 'ionicons/icons';
import './RegisterForm.css';

interface RegisterFormProps {
  fullName: string;
  email: string;
  password: string;
  loading: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  fullName,
  email,
  password,
  loading,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="register-form" data-testid="register-form">
    <div className="register-input-group">
      <IonLabel className="register-input-label">Nombre Completo</IonLabel>
      <div className="register-input-wrapper">
        <IonIcon icon={personOutline} className="register-input-icon" />
        <IonInput
          type="text"
          placeholder="Ej. Juan Pérez"
          value={fullName}
          onIonInput={(e) => onFullNameChange(e.detail.value || '')}
        />
      </div>
    </div>

    <div className="register-input-group">
      <IonLabel className="register-input-label">Correo Electrónico</IonLabel>
      <div className="register-input-wrapper">
        <IonIcon icon={mailOutline} className="register-input-icon" />
        <IonInput
          type="email"
          placeholder="tu@email.com"
          value={email}
          onIonInput={(e) => onEmailChange(e.detail.value || '')}
        />
      </div>
    </div>

    <div className="register-input-group">
      <IonLabel className="register-input-label">Contraseña</IonLabel>
      <div className="register-input-wrapper">
        <IonIcon icon={lockClosedOutline} className="register-input-icon" />
        <IonInput
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onIonInput={(e) => onPasswordChange(e.detail.value || '')}
        />
      </div>
    </div>

    <IonButton
      expand="block"
      type="submit"
      className="register-submit-btn"
      disabled={loading}
    >
      {loading ? 'CREANDO...' : 'COMENZAR AHORA'}
      <IonIcon slot="end" icon={arrowForwardOutline} />
    </IonButton>

    <div className="register-footer-links">
      <IonText color="medium">¿Ya tienes cuenta?</IonText>
      <IonButton fill="clear" routerLink="/login" className="register-login-link">
        Inicia Sesión
      </IonButton>
    </div>
  </form>
);
