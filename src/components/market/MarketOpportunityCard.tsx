import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import {
  calendarOutline,
  flashOutline,
  hammerOutline,
  lockClosedOutline,
} from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { ListingCard } from '../listing';
import { formatRequestPriceRangeEuros } from '../../utils/requestPriceRange';

interface AddressInfo {
  text: string;
  icon: string;
}

interface MarketOpportunityCardProps {
  request: ServiceRequest;
  isBidden: boolean;
  isHigh: boolean;
  isBlurry: boolean;
  isLocked: boolean;
  addressInfo: AddressInfo;
  onCardClick: () => void;
  onBidClick: (e: React.MouseEvent) => void;
}

export const MarketOpportunityCard: React.FC<MarketOpportunityCardProps> = ({
  request,
  isBidden,
  isHigh,
  isBlurry,
  isLocked,
  addressInfo,
  onCardClick,
  onBidClick,
}) => {
  const preference = request.desiredExecutionTime?.trim();
  const metaRows = [
    { icon: addressInfo.icon, text: addressInfo.text },
    preference
      ? { icon: calendarOutline, text: preference, tone: 'primary' as const }
      : {
          icon: flashOutline,
          text: 'Urgente: Lo antes posible',
          tone: 'urgent' as const,
        },
  ];

  return (
    <ListingCard
      status={isBidden ? 'sent' : 'pending'}
      category={request.category}
      statusLabel={isBidden ? 'ENVIADA' : undefined}
      extraBadges={
        isHigh ? (
          <span className="listing-high-risk-badge">ALTA DIFICULTAD</span>
        ) : undefined
      }
      title={isBlurry ? 'Oportunidad Reservada' : request.title}
      price={{
        variant: 'range',
        value: isBlurry ? '??? €' : formatRequestPriceRangeEuros(request),
      }}
      metaRows={metaRows}
      onClick={!isBlurry ? onCardClick : undefined}
      button={!isBlurry}
      bodyStyle={
        isBlurry ? { filter: 'blur(5px)' } : undefined
      }
      overlay={
        isBlurry ? (
          <div className="restricted-overlay blur">
            <IonIcon icon={lockClosedOutline} />
            <span className="overlay-title">TRABAJO DE ALTA DIFICULTAD</span>
            <span className="overlay-subtitle">Solo cuenta Profesional</span>
          </div>
        ) : undefined
      }
      media={
        isBlurry
          ? null
          : {
              photoUrl: request.photoUrl,
              videoUrl: request.videoUrl,
              audioUrl: request.audioUrl,
              extraPhotoUrls: request.extraPhotoUrls,
              extraVideoUrls: request.extraVideoUrls,
              extraAudioUrls: request.extraAudioUrls,
            }
      }
      footer={{
        personPrefix: 'Cliente:',
        personName: request.client?.fullName?.split(' ')[0] || 'Usuario',
        rating: request.client?.rating,
        showNewBadge: !request.client?.rating,
        action: !isBidden ? (
          <IonButton
            size="small"
            color={isLocked ? 'medium' : 'secondary'}
            fill={isLocked ? 'outline' : 'solid'}
            shape="round"
            onClick={onBidClick}
            style={{
              opacity: isLocked ? 0.6 : 1,
              margin: 0,
              fontWeight: 800,
              height: 34,
            }}
          >
            <IonIcon
              slot="start"
              icon={isLocked ? lockClosedOutline : hammerOutline}
            />
            {isLocked ? 'SOLO PRO' : 'ME INTERESA'}
          </IonButton>
        ) : undefined,
      }}
    />
  );
};
