import React from 'react';
import { IonCard, IonIcon } from '@ionic/react';
import {
  locationOutline,
  calendarOutline,
  star,
  flashOutline,
} from 'ionicons/icons';
import { Bid, ServiceRequest } from '../../types';
import { RequestMediaChip } from '../shared/RequestMediaModal';
import { formatRequestPriceRangeEuros } from '../../utils/requestPriceRange';
import { bidPriceLabel } from '../../utils/bidPriceLabel';

interface CategoryStyle {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

interface MyWorkBidCardProps {
  bid: Bid;
  request: ServiceRequest;
  borderClass: string;
  statusLabel: string;
  badgeClass: string;
  catStyle: CategoryStyle;
  onClick: () => void;
}

export const MyWorkBidCard: React.FC<MyWorkBidCardProps> = ({
  bid,
  request,
  borderClass,
  statusLabel,
  badgeClass,
  catStyle,
  onClick,
}) => (
  <IonCard key={bid.id} className={`mw-card ${borderClass}`} onClick={onClick} button>
    <div className="mw-card-body">
      <div className="mw-card-main">
        <div className="mw-card-top">
          <div className="mw-card-pills">
            <span
              className="mw-category-pill"
              style={{ color: catStyle.color, background: catStyle.bg }}
            >
              <IonIcon icon={catStyle.icon} /> {catStyle.label}
            </span>
            <span className={`mw-status-badge ${badgeClass}`}>{statusLabel}</span>
          </div>
          <div className="mw-card-right">
            <span className="mw-price">{bidPriceLabel(bid)}</span>
            <span className="mw-price-label">TU PROPUESTA</span>
          </div>
        </div>
        <h3 className="mw-title">{request.title}</h3>
        <div className="mw-info-row">
          <IonIcon icon={locationOutline} />
          <span>{request.address.split(',')[0]}</span>
        </div>
        {request.desiredExecutionTime?.trim() ? (
          <div className="mw-timing-row primary">
            <IonIcon icon={calendarOutline} />
            <span>{request.desiredExecutionTime}</span>
          </div>
        ) : (
          <div className="mw-timing-row urgent">
            <IonIcon icon={flashOutline} />
            <span>Urgente: Lo antes posible</span>
          </div>
        )}
      </div>
    </div>
    <div className="mw-card-footer">
      <div className="mw-footer-left">
        <span className="mw-client-label">
          Cliente:{' '}
          <strong>{request.client?.fullName?.split(' ')[0]}</strong>
        </span>
        {request.client?.rating && (
          <span className="mw-rating-badge">
            <IonIcon icon={star} />
            {request.client.rating}
          </span>
        )}
      </div>
      <RequestMediaChip
        photoUrl={request.photoUrl}
        videoUrl={request.videoUrl}
        audioUrl={request.audioUrl}
      />
    </div>
  </IonCard>
);

interface MyWorkJobCardProps {
  job: ServiceRequest;
  borderClass: string;
  statusLabel: string;
  badgeClass: string;
  catStyle: CategoryStyle;
  dateToShow: string;
  onClick: () => void;
}

export const MyWorkJobCard: React.FC<MyWorkJobCardProps> = ({
  job,
  borderClass,
  statusLabel,
  badgeClass,
  catStyle,
  dateToShow,
  onClick,
}) => (
  <IonCard key={job.id} className={`mw-card ${borderClass}`} onClick={onClick} button>
    <div className="mw-card-body">
      <div className="mw-card-main">
        <div className="mw-card-top">
          <div className="mw-card-pills">
            <span
              className="mw-category-pill"
              style={{ color: catStyle.color, background: catStyle.bg }}
            >
              <IonIcon icon={catStyle.icon} /> {catStyle.label}
            </span>
            <span className={`mw-status-badge ${badgeClass}`}>{statusLabel}</span>
          </div>
          <div className="mw-card-right">
            <div className="mw-price-block">
              <span className="mw-price-sublabel">Rango estimado</span>
              <span className="mw-price success">{formatRequestPriceRangeEuros(job)}</span>
            </div>
            <span className="mw-price-label">GANADO</span>
          </div>
        </div>
        <h3 className="mw-title">{job.title}</h3>
        <div className="mw-info-row">
          <IonIcon icon={locationOutline} />
          <span>{job.preciseAddress || job.address}</span>
        </div>
        {dateToShow && (
          <div className="mw-timing-row primary">
            <IonIcon icon={calendarOutline} />
            <span>
              {new Date(dateToShow).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>
        )}
      </div>
    </div>
    <div className="mw-card-footer">
      <div className="mw-footer-left">
        <span className="mw-client-label">
          Cliente:{' '}
          <strong>{job.client?.fullName?.split(' ')[0]}</strong>
        </span>
        {job.client?.rating && (
          <span className="mw-rating-badge">
            <IonIcon icon={star} />
            {job.client.rating}
          </span>
        )}
      </div>
      <RequestMediaChip
        photoUrl={job.photoUrl}
        videoUrl={job.videoUrl}
        audioUrl={job.audioUrl}
      />
    </div>
  </IonCard>
);
