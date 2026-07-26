import React from 'react';
import {
  IonCard,
  IonBadge,
  IonButton,
  IonIcon,
} from '@ionic/react';
import {
  hammerOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
  star,
} from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { RequestMediaChip } from '../shared/RequestMediaModal';
import { getCategoryLabel } from '../../utils/categoryLabels';
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
  renderScheduleInfo: (desiredExecutionTime?: string | null) => React.ReactNode;
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
  renderScheduleInfo,
}) => {
  return (
    <IonCard
      key={request.id}
      className={`mkt-card ${isBidden ? 'mkt-card-bidden' : 'mkt-card-default'}`}
      onClick={!isBlurry ? onCardClick : undefined}
      button={!isBlurry}
    >
      {isBlurry && (
        <div className="restricted-overlay blur">
          <IonIcon icon={lockClosedOutline} />
          <span className="overlay-title">TRABAJO DE ALTA DIFICULTAD</span>
          <span className="overlay-subtitle">Solo cuenta Profesional</span>
        </div>
      )}

      <div
        className="mkt-card-body"
        style={{ filter: isBlurry ? 'blur(5px)' : 'none' }}
      >
        <div className="mkt-card-main">
          <div className="mkt-card-top">
            <div className="mkt-card-pills">
              <span className="mkt-category">{getCategoryLabel(request.category)}</span>
              {isHigh && <span className="mkt-high-risk-badge">ALTA DIFICULTAD</span>}
            </div>
            <div className="mkt-price-block">
              <span className="mkt-price-label">Rango estimado</span>
              <span className="mkt-price">
                {isBlurry ? '??? €' : formatRequestPriceRangeEuros(request)}
              </span>
            </div>
          </div>

          <h3 className="mkt-title">
            {isBlurry ? 'Oportunidad Reservada' : request.title}
          </h3>

          <div className="info-row mkt-meta-row">
            <IonIcon icon={addressInfo.icon} />
            <span>{addressInfo.text}</span>
          </div>

          {renderScheduleInfo(request.desiredExecutionTime)}

          {isBidden && (
            <div className="bidden-badge mkt-bidden-inline">
              <IonIcon icon={checkmarkCircleOutline} /> ENVIADA
            </div>
          )}
        </div>
      </div>

      <div
        className="mkt-card-footer"
        style={{ filter: isBlurry ? 'blur(5px)' : 'none' }}
      >
        <div className="mkt-footer-left">
          <span className="mkt-client-label">
            Cliente:{' '}
            <strong>
              {request.client?.fullName?.split(' ')[0] || 'Usuario'}
            </strong>
          </span>
          {request.client?.rating ? (
            <span className="mkt-rating-badge">
              <IonIcon icon={star} />
              {request.client.rating}
            </span>
          ) : (
            <IonBadge color="light" className="mkt-new-badge">
              NUEVO
            </IonBadge>
          )}
        </div>

        <div className="mkt-footer-actions">
          {!isBlurry && (
            <RequestMediaChip
              photoUrl={request.photoUrl}
              videoUrl={request.videoUrl}
              audioUrl={request.audioUrl}
            />
          )}
          {!isBidden && (
            <IonButton
              size="small"
              color={isLocked ? 'medium' : 'secondary'}
              fill={isLocked ? 'outline' : 'solid'}
              shape="round"
              onClick={onBidClick}
              className="mkt-bid-btn"
              style={{ opacity: isLocked ? 0.6 : 1 }}
            >
              <IonIcon
                slot="start"
                icon={isLocked ? lockClosedOutline : hammerOutline}
              />
              {isLocked ? 'SOLO PRO' : 'ME INTERESA'}
            </IonButton>
          )}
        </div>
      </div>
    </IonCard>
  );
};
