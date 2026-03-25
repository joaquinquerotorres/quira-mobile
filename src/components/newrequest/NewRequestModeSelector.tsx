import React from 'react';
import { IonSegment, IonSegmentButton, IonLabel, IonIcon } from '@ionic/react';
import { micOutline, videocamOutline, textOutline } from 'ionicons/icons';

interface NewRequestModeSelectorProps {
  value: 'AUDIO' | 'VIDEO' | 'TEXT';
  onChange: (mode: 'AUDIO' | 'VIDEO' | 'TEXT') => void;
}

export const NewRequestModeSelector: React.FC<NewRequestModeSelectorProps> = ({
  value,
  onChange,
}) => (
  <div style={{ marginBottom: '25px' }}>
    <IonSegment
      value={value}
      onIonChange={(e) => onChange(e.detail.value as 'AUDIO' | 'VIDEO' | 'TEXT')}
      className="mode-segment"
    >
      <IonSegmentButton value="AUDIO">
        <IonLabel>Audio</IonLabel>
        <IonIcon icon={micOutline} />
      </IonSegmentButton>
      <IonSegmentButton value="VIDEO">
        <IonLabel>Video</IonLabel>
        <IonIcon icon={videocamOutline} />
      </IonSegmentButton>
      <IonSegmentButton value="TEXT">
        <IonLabel>Escribir</IonLabel>
        <IonIcon icon={textOutline} />
      </IonSegmentButton>
    </IonSegment>
  </div>
);
