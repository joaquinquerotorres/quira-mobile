import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonSpinner,
  IonToast,
  useIonRouter,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import api from '../api/axios';
import { ClientProfile, ProfessionalProfile } from '../types';
import './NotificationSettings.css';

const CLIENT_LABELS = {
  notifyRequestActivity: 'Dudas sobre mis solicitudes',
  notifyBidActivity: 'Nuevas ofertas en mis solicitudes',
  notifyReviews: 'Nuevas valoraciones recibidas',
};

const PRO_LABELS = {
  notifyRequestActivity: 'Nuevas solicitudes y respuestas a mis preguntas',
  notifyBidActivity: 'Cuando aceptan mis ofertas',
  notifyReviews: 'Nuevas reseñas recibidas',
};

type ProfileType = 'client' | 'professional';

interface NotificationSectionProps {
  profile: ClientProfile | ProfessionalProfile;
  labels: typeof CLIENT_LABELS | typeof PRO_LABELS;
  endpoint: 'client_profiles' | 'professional_profiles';
  sectionTitle: string;
}

const NotificationSection: React.FC<NotificationSectionProps> = ({
  profile,
  labels,
  endpoint,
  sectionTitle,
}) => {
  const [notifyRequestActivity, setNotifyRequestActivity] = useState(
    profile.notifyRequestActivity ?? true
  );
  const [notifyBidActivity, setNotifyBidActivity] = useState(
    profile.notifyBidActivity ?? true
  );
  const [notifyReviews, setNotifyReviews] = useState(
    profile.notifyReviews ?? true
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`${endpoint}/${profile.id}`, {
        notifyRequestActivity,
        notifyBidActivity,
        notifyReviews,
      });
      setToast('Preferencias guardadas');
      // Actualizar localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const key = endpoint === 'client_profiles' ? 'clientProfile' : 'professionalProfile';
        if (user[key]) {
          user[key] = {
            ...user[key],
            notifyRequestActivity,
            notifyBidActivity,
            notifyReviews,
          };
          localStorage.setItem('user', JSON.stringify(user));
        }
      }
    } catch {
      setToast('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    (profile.notifyRequestActivity ?? true) !== notifyRequestActivity ||
    (profile.notifyBidActivity ?? true) !== notifyBidActivity ||
    (profile.notifyReviews ?? true) !== notifyReviews;

  return (
    <div className="notification-section">
      <h3 className="notification-section-title">{sectionTitle}</h3>
      <IonList lines="full" className="notification-list">
        <IonItem lines="full">
          <IonLabel className="ion-text-wrap">{labels.notifyRequestActivity}</IonLabel>
          <IonToggle
            slot="end"
            checked={notifyRequestActivity}
            onIonChange={(e) => setNotifyRequestActivity(e.detail.checked)}
            color="primary"
          />
        </IonItem>
        <IonItem lines="full">
          <IonLabel className="ion-text-wrap">{labels.notifyBidActivity}</IonLabel>
          <IonToggle
            slot="end"
            checked={notifyBidActivity}
            onIonChange={(e) => setNotifyBidActivity(e.detail.checked)}
            color="primary"
          />
        </IonItem>
        <IonItem lines="full">
          <IonLabel className="ion-text-wrap">{labels.notifyReviews}</IonLabel>
          <IonToggle
            slot="end"
            checked={notifyReviews}
            onIonChange={(e) => setNotifyReviews(e.detail.checked)}
            color="primary"
          />
        </IonItem>
      </IonList>
      <IonButton
        expand="block"
        className="notification-save-btn"
        onClick={handleSave}
        disabled={saving || !hasChanges}
      >
        {saving ? (
          <IonSpinner name="crescent" />
        ) : (
          'Guardar cambios'
        )}
      </IonButton>
      <IonToast
        isOpen={!!toast}
        message={toast || ''}
        duration={2500}
        onDidDismiss={() => setToast(null)}
        position="top"
      />
    </div>
  );
};

const NotificationSettings: React.FC = () => {
  const router = useIonRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!user) {
    return (
      <IonPage>
        <IonContent>
          <div className="notification-loading">
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const hasClient = Boolean(user.clientProfile);
  const hasPro = Boolean(user.professionalProfile);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Configuración de notificaciones</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {hasClient && (
          <NotificationSection
            profile={user.clientProfile}
            labels={CLIENT_LABELS}
            endpoint="client_profiles"
            sectionTitle="Como cliente"
          />
        )}
        {hasPro && (
          <NotificationSection
            profile={user.professionalProfile}
            labels={PRO_LABELS}
            endpoint="professional_profiles"
            sectionTitle="Como profesional"
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default NotificationSettings;
