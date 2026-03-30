import { IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import './LogoHeader.css';

export const LogoHeader: React.FC = () => (
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
);