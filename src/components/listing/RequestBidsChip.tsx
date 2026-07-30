import React from 'react';
import { IonIcon } from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';
import '../shared/RequestMediaModal.css';

export interface RequestBidsChipProps {
  count: number;
  className?: string;
}

/** Chip neutro (slate) con nº de propuestas; siempre visible si se monta (incluye 0). */
export const RequestBidsChip: React.FC<RequestBidsChipProps> = ({
  count,
  className,
}) => (
  <span
    className={`request-bids-chip request-media-chip--inline${className ? ` ${className}` : ''}`}
    role="status"
    aria-label={`${count} propuestas`}
  >
    <IonIcon icon={peopleOutline} aria-hidden="true" />
    <span className="request-media-chip-label">Propuestas</span>
    <span className="request-bids-chip-count">{count}</span>
  </span>
);
