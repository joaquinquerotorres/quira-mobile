import React from 'react';
import { IonIcon } from '@ionic/react';
import { StatusBadge } from '../listing/StatusBadge';
import { getCategoryStyle } from '../../utils/categoryStyles';
import type { ListingStatusKey } from '../../utils/listingStatus';
import '../listing/ListingCard.css';
import './Detail.css';

interface DetailHeroHeaderProps {
  status: ListingStatusKey;
  statusLabel: string;
  title: string;
  /** Badges extra (p. ej. ALTA DIFICULTAD). */
  extras?: React.ReactNode;
  className?: string;
}

/**
 * Debajo de la cabecera púrpura de página: StatusBadge + título.
 * El icono de categoría vive en el placeholder multimedia vía DetailCategoryIcon.
 */
export const DetailHeroHeader: React.FC<DetailHeroHeaderProps> = ({
  status,
  statusLabel,
  title,
  extras,
  className,
}) => (
  <div className={`detail-hero-header${className ? ` ${className}` : ''}`}>
    <div className="detail-hero-header-status-row">
      <StatusBadge status={status} label={statusLabel} />
      {extras}
    </div>
    <h1 className="detail-hero-title">{title}</h1>
  </div>
);

interface DetailCategoryIconProps {
  category: string | { code?: string; name?: string } | null | undefined;
  size?: 'md' | 'lg';
  className?: string;
}

/** Caja redondeada con icono de categoría (getCategoryStyle). */
export const DetailCategoryIcon: React.FC<DetailCategoryIconProps> = ({
  category,
  size = 'lg',
  className,
}) => {
  const style = getCategoryStyle(category);
  const dim = size === 'lg' ? 48 : 36;
  return (
    <div
      className={`detail-category-icon-box${className ? ` ${className}` : ''}`}
      style={{
        width: dim,
        height: dim,
        background: style.bg,
        border: `1px solid ${style.color}33`,
      }}
    >
      <IonIcon icon={style.icon} style={{ color: style.color, fontSize: size === 'lg' ? 24 : 18 }} />
    </div>
  );
};
