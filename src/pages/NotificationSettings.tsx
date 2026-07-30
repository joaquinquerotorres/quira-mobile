import React, { useState, useEffect } from 'react';
import {
  IonItem,
  IonLabel,
  IonToggle,
  IonSpinner,
  IonToast,
  IonButton,
} from '@ionic/react';
import api from '../api/axios';
import { ClientProfile, ProfessionalProfile } from '../types';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import { getEffectiveActiveMode } from '../utils/activeMode';
import { refreshCurrentUserInStorage } from '../utils/refreshCurrentUser';
import './Profile.css';
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

  useEffect(() => {
    setNotifyRequestActivity(profile.notifyRequestActivity ?? true);
    setNotifyBidActivity(profile.notifyBidActivity ?? true);
    setNotifyReviews(profile.notifyReviews ?? true);
  }, [
    profile.id,
    profile.notifyRequestActivity,
    profile.notifyBidActivity,
    profile.notifyReviews,
  ]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(
        `${endpoint}/${profile.id}`,
        {
          notifyRequestActivity,
          notifyBidActivity,
          notifyReviews,
        },
        { headers: { 'Content-Type': 'application/merge-patch+json' } }
      );
      setToast('Preferencias guardadas');
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
    <div className="notification-settings-block">
      <div className="profile-section-title">{sectionTitle}</div>
      <div className="profile-menu-card">
        <IonItem lines="none" className="menu-item">
          <IonLabel className="ion-text-wrap item-label">
            {labels.notifyRequestActivity}
          </IonLabel>
          <IonToggle
            slot="end"
            checked={notifyRequestActivity}
            onIonChange={(e) => setNotifyRequestActivity(e.detail.checked)}
            color="primary"
          />
        </IonItem>
        <div className="menu-separator" />
        <IonItem lines="none" className="menu-item">
          <IonLabel className="ion-text-wrap item-label">
            {labels.notifyBidActivity}
          </IonLabel>
          <IonToggle
            slot="end"
            checked={notifyBidActivity}
            onIonChange={(e) => setNotifyBidActivity(e.detail.checked)}
            color="primary"
          />
        </IonItem>
        <div className="menu-separator" />
        <IonItem lines="none" className="menu-item">
          <IonLabel className="ion-text-wrap item-label">
            {labels.notifyReviews}
          </IonLabel>
          <IonToggle
            slot="end"
            checked={notifyReviews}
            onIonChange={(e) => setNotifyReviews(e.detail.checked)}
            color="primary"
          />
        </IonItem>
      </div>
      <IonButton
        expand="block"
        className="quira-main-btn profile-edit-save notification-save-btn"
        onClick={handleSave}
        disabled={saving || !hasChanges}
      >
        {saving ? <IonSpinner name="crescent" /> : 'Guardar cambios'}
      </IonButton>
      <IonToast
        isOpen={!!toast}
        message={toast || ''}
        duration={TOAST_DURATION_MS}
        onDidDismiss={() => setToast(null)}
        position="top"
      />
    </div>
  );
};

interface NotificationSettingsPanelProps {
  active?: boolean;
}

/** Body of Notificaciones — used inside ProfileSubpageShell. */
export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({
  active = true,
}) => {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const load = async () => {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setLoadingUser(false);
        return;
      }

      if (!cancelled) {
        setUser(JSON.parse(userStr));
        setLoadingUser(true);
      }

      await refreshCurrentUserInStorage();
      if (cancelled) return;

      const freshStr = localStorage.getItem('user');
      if (freshStr) {
        setUser(JSON.parse(freshStr));
      }
      setLoadingUser(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [active]);

  if (!user || loadingUser) {
    return (
      <div className="notification-loading">
        <IonSpinner name="crescent" />
      </div>
    );
  }

  const hasClient = Boolean(user.clientProfile);
  const hasPro = Boolean(user.professionalProfile);
  const activeMode = getEffectiveActiveMode();
  const showClientPrefs = hasClient && (activeMode === 'client' || !hasPro);
  const showProPrefs = hasPro && (activeMode === 'pro' || !hasClient);

  return (
    <div className="notification-settings-panel">
      {showClientPrefs && (
        <NotificationSection
          profile={user.clientProfile}
          labels={CLIENT_LABELS}
          endpoint="client_profiles"
          sectionTitle="Como cliente"
        />
      )}
      {showProPrefs && (
        <NotificationSection
          profile={user.professionalProfile}
          labels={PRO_LABELS}
          endpoint="professional_profiles"
          sectionTitle="Como profesional"
        />
      )}
    </div>
  );
};

export default NotificationSettingsPanel;
