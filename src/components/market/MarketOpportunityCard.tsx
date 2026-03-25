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
  arrowForwardOutline,
  checkmarkCircleOutline,
  star,
} from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { RequestMediaThumb } from '../shared/RequestMediaThumb';
import { getCategoryLabel } from '../../utils/categoryLabels';
import { resolveMediaUrl } from '../../utils/mediaUrl';

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
  playingAudioId: number | null;
  onToggleAudio: (e: React.MouseEvent, id: number, audioUrl: string) => void;
  onCardClick: () => void;
  onBidClick: (e: React.MouseEvent) => void;
  serverUrl: string;
  renderScheduleInfo: (isoString?: string) => React.ReactNode;
}

export const MarketOpportunityCard: React.FC<MarketOpportunityCardProps> = ({
  request,
  isBidden,
  isHigh,
  isBlurry,
  isLocked,
  addressInfo,
  playingAudioId,
  onToggleAudio,
  onCardClick,
  onBidClick,
  serverUrl,
  renderScheduleInfo,
}) => {
  return (
    <IonCard
      key={request.id}
      className={`mkt-card ${isBidden ? 'mkt-card-bidden' : 'mkt-card-default'}`}
      style={{ margin: '0 0 16px 0', overflow: 'hidden', position: 'relative' }}
      onClick={!isBlurry ? onCardClick : undefined}
      button={!isBlurry}
    >
      {/* OVERLAY BORROSO (ALTA DIFICULTAD) */}
      {isBlurry && (
        <div className="restricted-overlay blur">
          <IonIcon icon={lockClosedOutline} />
          <span className="overlay-title">TRABAJO DE ALTA DIFICULTAD</span>
          <span className="overlay-subtitle">Solo cuenta Profesional</span>
        </div>
      )}

      <div style={{ display: 'flex', padding: '0', filter: isBlurry ? 'blur(5px)' : 'none' }}>
        {/* THUMBNAIL */}
        <div className="mkt-thumb-wrap">
          <RequestMediaThumb
            variant="market"
            requestId={request.id!}
            photoSrc={request.photoUrl ? resolveMediaUrl(request.photoUrl) : undefined}
            audioUrl={isBlurry ? undefined : request.audioUrl}
            videoUrl={request.videoUrl}
            playingAudioId={playingAudioId}
            onToggleAudio={isBlurry ? undefined : onToggleAudio}
          />
          {isHigh && <span className="mkt-high-risk-badge">ALTA DIFICULTAD</span>}
        </div>

        {/* CONTENIDO */}
        <div style={{ padding: '20px 5px 10px 0', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', gap: '6px' }}>
            <span className="mkt-category">{getCategoryLabel(request.category)}</span>
          </div>

          <h3
            className="mkt-title"
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#1e293b',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {isBlurry ? 'Oportunidad Reservada' : request.title}
          </h3>

          <div
            className="info-row"
            style={{
              marginBottom: '8px',
              color: '#64748b',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <IonIcon icon={addressInfo.icon} style={{ marginRight: '6px' }} />
            <span style={{ fontWeight: 700 }}>{addressInfo.text}</span>
          </div>

          {renderScheduleInfo(request.scheduledAt)}
        </div>

        {/* COLUMNA DERECHA (PRECIO) */}
        <div className="market-card-right" style={{ flexShrink: 0, paddingRight: '15px' }}>
          <span className="mkt-price">{isBlurry ? '??? €' : `${request.priceAmount}€`}</span>

          {isBidden ? (
            <div className="bidden-badge" style={{ marginTop: '4px', fontSize: '0.6rem', padding: '2px 6px' }}>
              <IonIcon icon={checkmarkCircleOutline} style={{ fontSize: '10px', marginRight: '2px' }} /> ENVIADA
            </div>
          ) : (
            <span className="mkt-price-label">PRESUPUESTO</span>
          )}

          {!isBlurry && (
            <div className="arrow-box">
              <IonIcon icon={arrowForwardOutline} />
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          padding: '12px 15px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isBidden ? 'transparent' : '#ffffff',
          filter: isBlurry ? 'blur(5px)' : 'none',
        }}
      >
        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
          <span
            style={{
              marginRight: '10px',
              color: '#64748b',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Cliente:{' '}
            <strong style={{ color: '#1e293b' }}>
              {request.client?.fullName?.split(' ')[0] || 'Usuario'}
            </strong>
          </span>
          {request.client?.rating ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fffbeb',
                color: '#b45309',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.7rem',
                border: '1px solid #fde68a',
                flexShrink: 0,
              }}
            >
              <IonIcon icon={star} style={{ fontSize: '10px', marginRight: '2px', color: '#fbbf24' }} />
              {request.client.rating}
            </span>
          ) : (
            <IonBadge color="light" style={{ fontSize: '0.6rem', fontWeight: 700, flexShrink: 0 }}>
              NUEVO
            </IonBadge>
          )}
        </div>

        {!isBidden && (
          <IonButton
            size="small"
            color={isLocked ? 'medium' : 'secondary'}
            fill={isLocked ? 'outline' : 'solid'}
            shape="round"
            onClick={onBidClick}
            style={{ fontWeight: 800, height: '32px', opacity: isLocked ? 0.6 : 1, flexShrink: 0, marginLeft: '10px' }}
          >
            <IonIcon slot="start" icon={isLocked ? lockClosedOutline : hammerOutline} />
            {isLocked ? 'SOLO PRO' : 'ME INTERESA'}
          </IonButton>
        )}
      </div>
    </IonCard>
  );
};

