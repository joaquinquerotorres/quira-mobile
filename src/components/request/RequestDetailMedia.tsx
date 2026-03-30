import React from 'react';
import { IonIcon } from '@ionic/react';
import { playCircleOutline, pauseCircleOutline } from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  formatRequestPriceRangeEuros,
  getRequestPriceRangeEuros,
} from '../../utils/requestPriceRange';

interface RequestDetailMediaProps {
  request: ServiceRequest;
  serverUrl: string;
  isPlayingAudio: boolean;
  onToggleAudio: (url: string) => void;
}

export const RequestDetailMedia: React.FC<RequestDetailMediaProps> = ({
  request,
  serverUrl,
  isPlayingAudio,
  onToggleAudio,
}) => {
  const hasMedia = Boolean(request.videoUrl || request.photoUrl || request.audioUrl);
  const hasRange = Boolean(getRequestPriceRangeEuros(request));

  if (!hasMedia) {
    return hasRange ? (
      <div className="price-badge-inline">
        <span className="price-badge-floating-label">Rango estimado (IA)</span>
        <span className="price-badge-floating-value">{formatRequestPriceRangeEuros(request)}</span>
      </div>
    ) : null;
  }

  return (
    <div className="image-container-rounded">
        {request.videoUrl ? (
          <video
            src={resolveMediaUrl(request.videoUrl)}
            controls
            className="detail-media-video"
          />
        ) : request.photoUrl ? (
          <img
            src={resolveMediaUrl(request.photoUrl)}
            className="detail-image-img"
            alt="Detalle"
          />
        ) : request.audioUrl ? (
          <div
            className="detail-audio-player"
            onClick={() => onToggleAudio(request.audioUrl!)}
          >
            <div className={`audio-play-circle ${isPlayingAudio ? 'playing' : ''}`}>
              <IonIcon icon={isPlayingAudio ? pauseCircleOutline : playCircleOutline} />
            </div>
            <div className="audio-text-hint">
              {isPlayingAudio ? 'Reproduciendo...' : 'Escuchar explicación'}
            </div>
          </div>
        ) : null}
        {hasRange ? (
          <div className="price-badge-floating">
            <span className="price-badge-floating-label">Rango estimado (IA)</span>
            <span className="price-badge-floating-value">{formatRequestPriceRangeEuros(request)}</span>
          </div>
        ) : null}
      </div>
  );
};

