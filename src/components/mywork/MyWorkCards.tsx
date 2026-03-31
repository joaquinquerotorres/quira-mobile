import React from 'react';
import { IonCard, IonIcon } from '@ionic/react';
import {
  locationOutline,
  calendarOutline,
  arrowForwardOutline,
  star,
  flashOutline,
} from 'ionicons/icons';
import { Bid, ServiceRequest } from '../../types';
import { RequestMediaThumb } from '../shared/RequestMediaThumb';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatRequestPriceRangeEuros } from '../../utils/requestPriceRange';

interface CategoryStyle {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

interface MyWorkBidCardProps {
  bid: Bid;
  request: ServiceRequest;
  requestId: number;
  borderClass: string;
  statusLabel: string;
  badgeClass: string;
  catStyle: CategoryStyle;
  serverUrl: string;
  playingAudioId: number | null;
  onToggleAudio: (e: React.MouseEvent, id: number, audioUrl: string) => void;
  onClick: () => void;
}

export const MyWorkBidCard: React.FC<MyWorkBidCardProps> = ({
  bid,
  request,
  requestId,
  borderClass,
  statusLabel,
  badgeClass,
  catStyle,
  serverUrl,
  playingAudioId,
  onToggleAudio,
  onClick,
}) => (
  <IonCard key={bid.id} className={`mw-card ${borderClass}`} onClick={onClick} button>
    <div className="mw-card-body">
      <div className="mw-thumb-wrap">
        <RequestMediaThumb
          variant="myWork"
          requestId={requestId}
          categoryCode={request.category}
          photoSrc={request.photoUrl ? resolveMediaUrl(request.photoUrl) : undefined}
          audioUrl={request.audioUrl}
          videoUrl={request.videoUrl}
          playingAudioId={playingAudioId}
          onToggleAudio={onToggleAudio}
        />
        <span className={`mw-status-badge ${badgeClass}`}>{statusLabel}</span>
      </div>
      <div className="mw-card-content">
        <div className="mw-card-top">
          <span
            className="mw-category-pill"
            style={{ color: catStyle.color, background: catStyle.bg }}
          >
            <IonIcon icon={catStyle.icon} /> {catStyle.label}
          </span>
        </div>
        <h3 className="mw-title">{request.title}</h3>
        <div className="mw-info-row">
          <IonIcon icon={locationOutline} />
          <span>{request.address.split(',')[0]}</span>
        </div>
        {request.desiredExecutionTime?.trim() ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--ion-color-primary)',
            }}
          >
            <IonIcon
              icon={calendarOutline}
              style={{ marginRight: '6px', fontSize: '14px' }}
            />
            <span>
              {request.desiredExecutionTime}
            </span>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#ea580c',
            }}
          >
            <IonIcon
              icon={flashOutline}
              style={{ marginRight: '6px', fontSize: '14px' }}
            />
            <span>Urgente: Lo antes posible</span>
          </div>
        )}
      </div>
      <div className="mw-card-right">
        <span className="mw-price">{bid.priceQuote}€</span>
        <span className="mw-price-label">TU PROPUESTA</span>
        <div className="arrow-box">
          <IonIcon icon={arrowForwardOutline} />
        </div>
      </div>
    </div>
    <div className="mw-card-footer">
      <div className="mw-footer-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#64748b' }}>
            Cliente:{' '}
            <strong style={{ color: '#1e293b' }}>
              {request.client?.fullName?.split(' ')[0]}
            </strong>
          </span>
          {request.client?.rating && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fffbeb',
                color: '#b45309',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.65rem',
                border: '1px solid #fde68a',
              }}
            >
              <IonIcon
                icon={star}
                style={{
                  fontSize: '10px',
                  marginRight: '3px',
                  color: '#fbbf24',
                }}
              />
              {request.client.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  </IonCard>
);

interface MyWorkJobCardProps {
  job: ServiceRequest;
  jobId: number;
  borderClass: string;
  statusLabel: string;
  badgeClass: string;
  catStyle: CategoryStyle;
  serverUrl: string;
  dateToShow: string;
  playingAudioId: number | null;
  onToggleAudio: (e: React.MouseEvent, id: number, audioUrl: string) => void;
  onClick: () => void;
}

export const MyWorkJobCard: React.FC<MyWorkJobCardProps> = ({
  job,
  jobId,
  borderClass,
  statusLabel,
  badgeClass,
  catStyle,
  serverUrl,
  dateToShow,
  playingAudioId,
  onToggleAudio,
  onClick,
}) => (
  <IonCard key={job.id} className={`mw-card ${borderClass}`} onClick={onClick} button>
    <div className="mw-card-body">
      <div className="mw-thumb-wrap">
        <RequestMediaThumb
          variant="myWork"
          requestId={jobId}
          categoryCode={job.category}
          photoSrc={job.photoUrl ? resolveMediaUrl(job.photoUrl) : undefined}
          audioUrl={job.audioUrl}
          videoUrl={job.videoUrl}
          playingAudioId={playingAudioId}
          onToggleAudio={onToggleAudio}
        />
        <span className={`mw-status-badge ${badgeClass}`}>{statusLabel}</span>
      </div>
      <div className="mw-card-content">
        <div className="mw-card-top">
          <span
            className="mw-category-pill"
            style={{ color: catStyle.color, background: catStyle.bg }}
          >
            <IonIcon icon={catStyle.icon} /> {catStyle.label}
          </span>
        </div>
        <h3 className="mw-title">{job.title}</h3>
        <div className="mw-info-row">
          <IonIcon icon={locationOutline} />
          <span>{job.preciseAddress || job.address}</span>
        </div>
        {dateToShow && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--ion-color-primary)',
            }}
          >
            <IonIcon
              icon={calendarOutline}
              style={{ marginRight: '6px', fontSize: '14px' }}
            />
            <span>
              {new Date(dateToShow).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        )}
      </div>
      <div className="mw-card-right">
        <div className="mw-price-block">
          <span className="mw-price-sublabel">Rango IA</span>
          <span className="mw-price success">{formatRequestPriceRangeEuros(job)}</span>
        </div>
        <span className="mw-price-label">GANADO</span>
        <div className="arrow-box">
          <IonIcon icon={arrowForwardOutline} />
        </div>
      </div>
    </div>
    <div className="mw-card-footer">
      <div className="mw-footer-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#64748b' }}>
            Cliente:{' '}
            <strong style={{ color: '#1e293b' }}>
              {job.client?.fullName?.split(' ')[0]}
            </strong>
          </span>
          {job.client?.rating && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                background: '#fffbeb',
                color: '#b45309',
                padding: '2px 6px',
                borderRadius: '6px',
                fontWeight: 800,
                fontSize: '0.65rem',
                border: '1px solid #fde68a',
              }}
            >
              <IonIcon
                icon={star}
                style={{
                  fontSize: '10px',
                  marginRight: '3px',
                  color: '#fbbf24',
                }}
              />
              {job.client.rating}
            </span>
          )}
        </div>
      </div>
    </div>
  </IonCard>
);

