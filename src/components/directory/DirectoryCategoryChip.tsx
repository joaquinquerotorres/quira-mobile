import React from 'react';
import { IonChip, IonLabel, IonIcon, IonNote } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';

interface DirectoryCategoryChipProps {
  categoryLabel: string;
  onClear: () => void;
}

export const DirectoryCategoryChip: React.FC<DirectoryCategoryChipProps> = ({
  categoryLabel,
  onClear,
}) => (
  <div
    style={{
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }}
  >
    <IonChip
      style={{ background: 'var(--ion-color-primary)', color: 'white', margin: 0 }}
      onClick={onClear}
    >
      <IonLabel>{categoryLabel}</IonLabel>
      <IonIcon icon={closeOutline} style={{ color: 'white' }} />
    </IonChip>
    <IonNote
      style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}
    >
      Pulsa para ver todos
    </IonNote>
  </div>
);
