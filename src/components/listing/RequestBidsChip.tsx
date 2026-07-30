import React from 'react';
import { IonIcon } from '@ionic/react';
import { peopleOutline } from 'ionicons/icons';
import { getBidsChipIntensity } from '../../utils/bidsChipIntensity';
import '../shared/RequestMediaModal.css';

export interface RequestBidsChipProps {
  count: number;
  className?: string;
}

/** Chip de propuestas: slate si 0; tono más cálido según umbrales de actividad. */
export const RequestBidsChip: React.FC<RequestBidsChipProps> = ({
  count,
  className,
}) => {
  const intensity = getBidsChipIntensity(count);

  return (
    <span
      className={`request-bids-chip request-bids-chip--${intensity} request-media-chip--inline${className ? ` ${className}` : ''}`}
      role="status"
      aria-label={`${count} propuestas`}
      data-intensity={intensity}
    >
      <IonIcon icon={peopleOutline} aria-hidden="true" />
      <span className="request-media-chip-label">Propuestas</span>
      <span className="request-bids-chip-count">{count}</span>
    </span>
  );
};
