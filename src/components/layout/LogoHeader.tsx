import React, { useRef, useState } from 'react';
import {
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPopover,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { swapHorizontalOutline } from 'ionicons/icons';
import {
  getEffectiveActiveMode,
  hasDualProfiles,
  homePathForMode,
  readStoredUser,
  setActiveMode,
  type ActiveMode,
} from '../../utils/activeMode';
import './LogoHeader.css';

export const LogoHeader: React.FC = () => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverEvent = useRef<Event | undefined>(undefined);
  const user = readStoredUser();
  const showSwitcher = hasDualProfiles(user);
  const mode = getEffectiveActiveMode();

  const switchTo = (next: ActiveMode) => {
    setPopoverOpen(false);
    if (next === mode) return;
    setActiveMode(next);
    window.location.href = homePathForMode(next);
  };

  return (
    <div className="quira-header-wrap">
      <IonHeader className="ion-no-border quira-header">
        <IonToolbar color="primary">
          <IonTitle className="ion-text-center">
            <div className="brand-container">
              <span className="brand-text-main">Qu</span>
              <span className="brand-text-secondary">i</span>
              <span className="brand-text-main">r</span>
              <span className="brand-text-secondary">a</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      {showSwitcher && (
        <button
          type="button"
          className="mode-switcher-btn"
          aria-label="Cambiar perfil"
          onClick={(e) => {
            popoverEvent.current = e.nativeEvent;
            setPopoverOpen(true);
          }}
        >
          <IonIcon icon={swapHorizontalOutline} />
        </button>
      )}

      <IonPopover
        isOpen={popoverOpen}
        event={popoverEvent.current}
        onDidDismiss={() => setPopoverOpen(false)}
        side="bottom"
        alignment="end"
      >
        <IonList lines="none" className="mode-switcher-list">
          <IonItem
            button
            detail={false}
            className={mode === 'client' ? 'mode-switcher-active' : ''}
            onClick={() => switchTo('client')}
          >
            <IonLabel>
              <strong>Cliente</strong>
              {mode === 'client' && (
                <div className="mode-switcher-current">Actual</div>
              )}
            </IonLabel>
          </IonItem>
          <IonItem
            button
            detail={false}
            className={mode === 'pro' ? 'mode-switcher-active' : ''}
            onClick={() => switchTo('pro')}
          >
            <IonLabel>
              <strong>Profesional</strong>
              {mode === 'pro' && (
                <div className="mode-switcher-current">Actual</div>
              )}
            </IonLabel>
          </IonItem>
        </IonList>
      </IonPopover>
    </div>
  );
};
