import React from 'react';
import { IonCard, IonIcon } from '@ionic/react';
import { CategoryBadge } from './CategoryBadge';
import { StatusBadge } from './StatusBadge';
import {
  EstimatePriceBlock,
  type EstimatePriceVariant,
} from './EstimatePriceBlock';
import {
  ListingCardFooter,
  type ListingCardFooterMedia,
  type ListingCardFooterProps,
} from './ListingCardFooter';
import { RequestMediaChip } from '../shared/RequestMediaModal';
import { RequestBidsChip } from './RequestBidsChip';
import {
  getListingStatusTokens,
  type ListingStatusKey,
} from '../../utils/listingStatus';
import './ListingCard.css';

export interface ListingCardMetaRow {
  icon: string;
  text: string;
  tone?: 'default' | 'primary' | 'urgent';
}

export interface ListingCardProps {
  status: ListingStatusKey;
  category: string | { code?: string; name?: string } | null | undefined;
  statusLabel?: string;
  extraBadges?: React.ReactNode;
  /**
   * Media debajo de las meta rows (ubicación / disponibilidad).
   * Patrón tipo Airbnb/Marketplace: adjuntos junto al contexto temporal, no en la fila de badges.
   */
  media?: ListingCardFooterMedia | null;
  /**
   * Nº de propuestas. Si se pasa (incl. 0), se muestra el chip a la izquierda de Media.
   */
  bidsCount?: number | null;
  title: string;
  price: {
    variant: EstimatePriceVariant;
    value: string;
    caption?: string;
    tone?: 'default' | 'success';
  };
  metaRows?: ListingCardMetaRow[];
  footer: ListingCardFooterProps;
  onClick?: () => void;
  routerLink?: string;
  button?: boolean;
  overlay?: React.ReactNode;
  bodyStyle?: React.CSSProperties;
  className?: string;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  status,
  category,
  statusLabel,
  extraBadges,
  media,
  bidsCount,
  title,
  price,
  metaRows = [],
  footer,
  onClick,
  routerLink,
  button = true,
  overlay,
  bodyStyle,
  className,
}) => {
  const { borderClass } = getListingStatusTokens(status);
  const showBidsChip = bidsCount != null;
  const showChipsRow = showBidsChip || Boolean(media);

  return (
    <IonCard
      className={`listing-card ${borderClass}${className ? ` ${className}` : ''}`}
      onClick={onClick}
      routerLink={routerLink}
      button={button}
    >
      {overlay}
      <div className="listing-card-body" style={bodyStyle}>
        <div className="listing-card-main">
          <div className="listing-card-top">
            <div className="listing-card-pills">
              <CategoryBadge category={category} />
              {statusLabel && (
                <StatusBadge status={status} label={statusLabel} />
              )}
              {extraBadges}
            </div>
            <EstimatePriceBlock
              variant={price.variant}
              value={price.value}
              caption={price.caption}
              tone={price.tone}
            />
          </div>
          <h3 className="listing-card-title">{title}</h3>
          {metaRows.map((row) => (
            <div
              key={`${row.text}-${row.tone || 'default'}`}
              className={`listing-meta-row${row.tone && row.tone !== 'default' ? ` ${row.tone}` : ''}`}
            >
              <IonIcon icon={row.icon} />
              <span>{row.text}</span>
            </div>
          ))}
          {showChipsRow && (
            <div className="listing-card-media">
              {showBidsChip && <RequestBidsChip count={bidsCount} />}
              {media && (
                <RequestMediaChip
                  photoUrl={media.photoUrl}
                  videoUrl={media.videoUrl}
                  audioUrl={media.audioUrl}
                  extraPhotoUrls={media.extraPhotoUrls}
                  extraVideoUrls={media.extraVideoUrls}
                  extraAudioUrls={media.extraAudioUrls}
                  className="request-media-chip--inline"
                />
              )}
            </div>
          )}
        </div>
      </div>
      <ListingCardFooter {...footer} />
    </IonCard>
  );
};
