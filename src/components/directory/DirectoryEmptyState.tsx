import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { briefcaseOutline } from 'ionicons/icons';

interface DirectoryEmptyStateProps {
  onViewAll: () => void;
}

export const DirectoryEmptyState: React.FC<DirectoryEmptyStateProps> = ({
  onViewAll,
}) => (
  <div
    className="ion-text-center"
    style={{ padding: '60px 20px', color: '#64748b' }}
  >
    <IonIcon
      icon={briefcaseOutline}
      style={{ fontSize: '3rem', opacity: 0.2, marginBottom: '10px' }}
    />
    <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>No hay resultados</p>
    <IonButton
      fill="clear"
      onClick={onViewAll}
      style={{ fontWeight: 800 }}
    >
      Ver todos los profesionales
    </IonButton>
  </div>
);
