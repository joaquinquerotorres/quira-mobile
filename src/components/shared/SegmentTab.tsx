import React from 'react';
import { IonSegment, IonSegmentButton, IonLabel, IonIcon } from '@ionic/react';
import './SegmentTab.css'; 

interface SegmentOption {
  value: string;
  label: React.ReactNode; 
  icon?: string;
}

interface Props {
  value: string;
  onValueChange: (newValue: any) => void;
  options: SegmentOption[];
  className?: string;
}

export const SegmentTab: React.FC<Props> = ({ 
  value, 
  onValueChange, 
  options, 
  className 
}) => {
  return (
    <div className="segment-floater animate__animated animate__fadeInUp">
      <IonSegment 
        value={value} 
        onIonChange={e => onValueChange(e.detail.value)} 
        className={className}
      >
        {options.map((opt) => (
          <IonSegmentButton key={opt.value} value={opt.value}>
            <IonLabel className="segment-tab-label">
              {opt.icon && <IonIcon icon={opt.icon} style={{ fontSize: '16px' }} />}
              {opt.label}
            </IonLabel>
          </IonSegmentButton>
        ))}
      </IonSegment>
    </div>
  );
};