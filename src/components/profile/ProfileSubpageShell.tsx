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
 * Full-screen profile subpage chrome matching «Mis datos»:
 * compact toolbar title + slim purple subtitle strip + content.
 * Title and subtitle live in the same IonHeader so the primary background is continuous.
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
    <IonHeader className="ion-no-border profile-subpage-header">
      <IonToolbar color="primary" className="profile-subpage-toolbar">
        <IonButtons slot="start">
          <IonButton onClick={onClose} style={{ color: 'white' }}>
            <IonIcon icon={chevronBackOutline} style={{ fontSize: '24px' }} />
          </IonButton>
        </IonButtons>
        <IonTitle className="ion-text-center">{title}</IonTitle>
        <IonButtons slot="end" style={{ width: '48px' }} />
      </IonToolbar>
      {subtitle ? (
        <div className="profile-edit-hero profile-edit-hero--slim">
          <p>{subtitle}</p>
        </div>
      ) : (
        <div className="profile-edit-hero profile-edit-hero--slim profile-edit-hero--empty" />
      )}
    </IonHeader>
    <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
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
