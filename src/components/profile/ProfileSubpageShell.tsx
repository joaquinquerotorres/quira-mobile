import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import '../../pages/Profile.css';

export const QuiraBrandTitle: React.FC = () => (
  <div className="brand-container">
    <span className="brand-text-main">Qu</span>
    <span className="brand-text-secondary">i</span>
    <span className="brand-text-main">r</span>
    <span className="brand-text-secondary">a</span>
  </div>
);

interface ProfileSubpageShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Extra class on the white content wrapper under the hero. */
  contentClassName?: string;
  onDidPresent?: () => void;
}

/**
 * Full-screen profile subpage chrome matching «Datos Personales»:
 * Quira brand toolbar + purple hero + content sheet.
 */
export const ProfileSubpageShell: React.FC<ProfileSubpageShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  contentClassName,
  onDidPresent,
}) => (
  <IonModal
    isOpen={isOpen}
    onDidDismiss={onClose}
    onDidPresent={onDidPresent}
  >
    <IonHeader className="ion-no-border">
      <IonToolbar color="primary" style={{ '--padding-top': '10px' }}>
        <IonButtons slot="start">
          <IonButton onClick={onClose} style={{ color: 'white' }}>
            <IonIcon icon={chevronBackOutline} style={{ fontSize: '24px' }} />
          </IonButton>
        </IonButtons>
        <IonTitle className="ion-text-center">
          <QuiraBrandTitle />
        </IonTitle>
        <IonButtons slot="end" style={{ width: '48px' }} />
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
      <div className="profile-edit-hero animate__animated animate__fadeIn">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div
        className={[
          'profile-edit-content',
          'profile-edit-content-main',
          contentClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </IonContent>
  </IonModal>
);

export default ProfileSubpageShell;
