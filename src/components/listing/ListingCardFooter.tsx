import React from 'react';
import { IonBadge, IonButton, IonIcon } from '@ionic/react';
import { arrowForwardOutline, star } from 'ionicons/icons';

export interface ListingCardFooterMedia {
  photoUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
}

export interface ListingCardFooterEmptyCta {
  label: string;
  onClick: (e: React.MouseEvent) => void;
}

export interface ListingCardFooterProps {
  /** Texto pasivo (p. ej. estados sin CTA). */
  emptyText?: string;
  /**
   * CTA ghost cuando no hay profesional (p. ej. pendiente → "Buscar profesional").
   * Tiene prioridad sobre `emptyText`.
   */
  emptyCta?: ListingCardFooterEmptyCta;
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
  emptyCta,
  personPrefix,
  personName,
  rating,
  showNewBadge,
  action,
  mutedBackground,
}) => {
  const hasPerson = Boolean(personName);

  return (
    <div
      className={`listing-card-footer${mutedBackground ? ' muted-bg' : ''}`}
    >
      <div className="listing-footer-left">
        {!hasPerson && emptyCta && (
          <IonButton
            fill="outline"
            color="primary"
            size="small"
            className="listing-footer-empty-cta"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              emptyCta.onClick(e);
            }}
          >
            {emptyCta.label}
            <IonIcon slot="end" icon={arrowForwardOutline} />
          </IonButton>
        )}
        {!hasPerson && !emptyCta && emptyText && (
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
