import React from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import { star } from 'ionicons/icons';

export interface ListingCardFooterMedia {
  photoUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
}

export interface ListingCardFooterProps {
  /** Texto pasivo opcional (solo si hay contenido en el footer). */
  emptyText?: string;
  /** Prefijo: "Cliente:", "Pro:", "Finalizado por:". */
  personPrefix?: string;
  personName?: string;
  rating?: string | number | null;
  showNewBadge?: boolean;
  /** CTA o badge de acción (ME INTERESA, etc.). */
  action?: React.ReactNode;
  mutedBackground?: boolean;
}

export const ListingCardFooter: React.FC<ListingCardFooterProps> = ({
  emptyText,
  personPrefix,
  personName,
  rating,
  showNewBadge,
  action,
  mutedBackground,
}) => {
  const hasPerson = Boolean(personName);
  const hasLeft = hasPerson || Boolean(emptyText);
  if (!hasLeft && !action) {
    return null;
  }

  return (
    <div
      className={`listing-card-footer${mutedBackground ? ' muted-bg' : ''}`}
    >
      <div className="listing-footer-left">
        {!hasPerson && emptyText && (
          <span className="listing-footer-text muted">{emptyText}</span>
        )}
        {hasPerson && (
          <>
            <span className="listing-footer-text">
              {personPrefix ? `${personPrefix} ` : ''}
              <strong>{personName}</strong>
            </span>
            {rating != null && rating !== '' && (
              <span className="listing-rating-badge">
                <IonIcon icon={star} />
                {rating}
              </span>
            )}
            {showNewBadge && (
              <IonBadge color="light" className="listing-new-badge">
                NUEVO
              </IonBadge>
            )}
          </>
        )}
      </div>
      {action && (
        <div
          className="listing-footer-actions"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {action}
        </div>
      )}
    </div>
  );
};
