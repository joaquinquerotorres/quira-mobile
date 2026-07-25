import React from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import { briefcaseOutline, personOutline } from 'ionicons/icons';
import {
  homePathForMode,
  setActiveMode,
  type ActiveMode,
} from '../utils/activeMode';
import './ChooseMode.css';

const ChooseMode: React.FC = () => {
  const choose = (mode: ActiveMode) => {
    setActiveMode(mode);
    window.location.href = homePathForMode(mode);
  };

  return (
    <IonPage>
      <IonContent className="choose-mode-content" fullscreen>
        <div className="choose-mode-wrap">
          <div className="choose-mode-brand">
            <span className="choose-mode-brand-main">Qu</span>
            <span className="choose-mode-brand-accent">i</span>
            <span className="choose-mode-brand-main">r</span>
            <span className="choose-mode-brand-accent">a</span>
          </div>
          <h1 className="choose-mode-title">¿Cómo quieres entrar?</h1>
          <p className="choose-mode-subtitle">
            Elige el perfil con el que vas a usar la app. Podrás cambiarlo cuando quieras.
          </p>

          <button
            type="button"
            className="choose-mode-card choose-mode-card--client"
            onClick={() => choose('client')}
          >
            <div className="choose-mode-card-icon">
              <IonIcon icon={personOutline} />
            </div>
            <div className="choose-mode-card-text">
              <strong>Cliente</strong>
              <span>Pedir servicios y gestionar tus solicitudes</span>
            </div>
          </button>

          <button
            type="button"
            className="choose-mode-card choose-mode-card--pro"
            onClick={() => choose('pro')}
          >
            <div className="choose-mode-card-icon">
              <IonIcon icon={briefcaseOutline} />
            </div>
            <div className="choose-mode-card-text">
              <strong>Profesional</strong>
              <span>Mercado, trabajos ganados y calendario</span>
            </div>
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ChooseMode;
