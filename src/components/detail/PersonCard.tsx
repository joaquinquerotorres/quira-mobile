import React from 'react';
import { IonAvatar, IonIcon } from '@ionic/react';
import { star, timeOutline } from 'ionicons/icons';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import './Detail.css';

interface PersonCardProps {
  name: string;
  avatarUrl?: string | null;
  rating?: number | string | null;
  reviewCount?: number | null;
  /** Etiqueta superior (p. ej. "Cliente"). */
  sectionLabel?: string;
  /** Badge de plan solapado al avatar (FREE / SOLVER / PRO). */
  planBadge?: React.ReactNode;
  price?: React.ReactNode;
  availability?: string | null;
  comment?: string | null;
  highlight?: boolean;
  onPersonClick?: () => void;
  /** CTA principal (p. ej. Aceptar presupuesto / Llamar). */
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

function formatRating(rating: number | string | null | undefined): string | null {
  if (rating == null) return null;
  const numeric =
    typeof rating === 'number'
      ? rating
      : typeof rating === 'string'
        ? Number.parseFloat(rating)
        : NaN;
  return Number.isFinite(numeric) ? numeric.toFixed(1) : null;
}

function parseReviewCount(reviewCount: number | null | undefined): number | null {
  if (reviewCount == null) return null;
  const n = typeof reviewCount === 'number' ? reviewCount : Number(reviewCount);
  return Number.isFinite(n) ? n : null;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  name,
  avatarUrl,
  rating,
  reviewCount,
  sectionLabel,
  planBadge,
  price,
  availability,
  comment,
  highlight = false,
  onPersonClick,
  action,
  children,
  className,
}) => {
  const displayRating = formatRating(rating);
  const count = parseReviewCount(reviewCount);
  const hasReviews = count != null && count > 0;

  return (
    <div
      className={`detail-person-card${highlight ? ' detail-person-card--highlight' : ''}${className ? ` ${className}` : ''}`}
    >
      {sectionLabel && (
        <div className="detail-person-card-section-label">{sectionLabel}</div>
      )}

      <div className="detail-person-card-header">
        <div
          className={`detail-person-card-identity${onPersonClick ? ' detail-person-card-identity--clickable' : ''}`}
          role={onPersonClick ? 'button' : undefined}
          tabIndex={onPersonClick ? 0 : undefined}
          onClick={onPersonClick}
          onKeyDown={(e) => {
            if (onPersonClick && e.key === 'Enter') onPersonClick();
          }}
        >
          <div className="detail-person-card-avatar-wrap">
            <IonAvatar className="detail-person-card-avatar">
              {avatarUrl ? (
                <img src={resolveMediaUrl(avatarUrl)} alt="" />
              ) : (
                <span className="detail-person-card-avatar-initial">
                  {name?.charAt(0) || '?'}
                </span>
              )}
            </IonAvatar>
            {planBadge}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="detail-person-card-name">{name}</div>
            {hasReviews ? (
              <div className="detail-person-card-rating">
                <IonIcon icon={star} style={{ color: '#fbbf24', fontSize: '0.9rem' }} />
                <span style={{ fontWeight: 600 }}>{displayRating ?? '—'}</span>
                <span style={{ color: '#94a3b8' }}>({count})</span>
              </div>
            ) : (
              <div className="detail-person-card-rating detail-person-card-rating--empty">
                Sin valoraciones todavía
              </div>
            )}
          </div>
        </div>
        {price != null && <div className="detail-person-card-price">{price}</div>}
      </div>

      {comment && <div className="detail-person-card-comment">"{comment}"</div>}

      {availability && (
        <div className="detail-person-card-availability">
          <IonIcon icon={timeOutline} style={{ fontSize: '0.85rem' }} />
          <span>
            Disponibilidad: <strong>{availability}</strong>
          </span>
        </div>
      )}

      {children}
      {action && <div className="detail-person-card-action">{action}</div>}
    </div>
  );
};
