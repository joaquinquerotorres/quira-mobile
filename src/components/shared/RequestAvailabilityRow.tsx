import React from 'react';
import { IonIcon } from '@ionic/react';
import { calendarOutline, flashOutline } from 'ionicons/icons';
import { ServiceRequest } from '../../types';

export type RequestAvailabilityVariant = 'list' | 'market';

interface RequestAvailabilityRowProps {
  request: ServiceRequest;
  variant?: RequestAvailabilityVariant;
}

/**
 * Muestra la disponibilidad preferida del cliente (`desiredExecutionTime`) o «Lo antes posible» por defecto.
 */
export const RequestAvailabilityRow: React.FC<RequestAvailabilityRowProps> = ({
  request,
  variant = 'list',
}) => {
  const pref = request.desiredExecutionTime?.trim();

  if (variant === 'market') {
    if (pref) {
      const urgent = pref === 'Lo antes posible';
      return (
        <div
          className="info-row"
          style={{
            color: urgent ? '#ea580c' : 'var(--ion-color-primary)',
            fontWeight: 700,
          }}
        >
          <IonIcon icon={urgent ? flashOutline : calendarOutline} style={{ marginRight: '6px' }} />
          <span>{pref}</span>
        </div>
      );
    }
    return (
      <div className="info-row" style={{ color: '#ea580c', fontWeight: 700 }}>
        <IonIcon icon={flashOutline} style={{ marginRight: '6px' }} />
        <span>Lo antes posible</span>
      </div>
    );
  }

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginTop: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
  };

  if (pref) {
    const urgent = pref === 'Lo antes posible';
    return (
      <div style={{ ...rowStyle, color: urgent ? '#ea580c' : '#4f46e5' }}>
        <IonIcon icon={urgent ? flashOutline : calendarOutline} style={{ marginRight: '4px', fontSize: '14px' }} />
        <span>{pref}</span>
      </div>
    );
  }

  return (
    <div style={{ ...rowStyle, color: '#ea580c' }}>
      <IonIcon icon={flashOutline} style={{ marginRight: '4px', fontSize: '14px' }} />
      <span>Lo antes posible</span>
    </div>
  );
};
