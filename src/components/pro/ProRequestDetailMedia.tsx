import React from 'react';
import { IonIcon } from '@ionic/react';
import { playCircleOutline, pauseCircleOutline } from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  formatRequestPriceRangeEuros,
  getRequestPriceRangeEuros,
} from '../../utils/requestPriceRange';

interface ProRequestDetailMediaProps {
  request: ServiceRequest;
  serverUrl: string;
  isPlayingAudio: boolean;
  onToggleAudio: (url: string) => void;
}

export const ProRequestDetailMedia: React.FC<ProRequestDetailMediaProps> = ({
  request,
  serverUrl,
  isPlayingAudio,
  onToggleAudio,
}) => {
  const hasMedia = Boolean(request.videoUrl || request.photoUrl || request.audioUrl);
  const hasRange = Boolean(getRequestPriceRangeEuros(request));

  if (!hasMedia) {
    return hasRange ? (
      <div className="pro-price-badge-inline">
        <span className="pro-price-badge-label">Rango estimado (IA)</span>
        <span className="pro-price-badge-value">{formatRequestPriceRangeEuros(request)}</span>
      </div>
    ) : null;
  }

  return (
    <div className="pro-image-container">
        {request.videoUrl ? (
          <video
            src={resolveMediaUrl(request.videoUrl)}
            controls
            className="pro-detail-video"
          />
        ) : request.photoUrl ? (
          <img
            src={resolveMediaUrl(request.photoUrl)}
            className="pro-detail-img"
            alt="Problema"
          />
        ) : request.audioUrl ? (
          <div
            className="pro-audio-player"
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
          <div className="pro-price-badge">
            <span className="pro-price-badge-label">Rango estimado (IA)</span>
            <span className="pro-price-badge-value">{formatRequestPriceRangeEuros(request)}</span>
          </div>
        ) : null}
      </div>
  );
};

