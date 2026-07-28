import React from 'react';
import { IonIcon } from '@ionic/react';
import { playCircleOutline, pauseCircleOutline } from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { getCategoryStyle } from '../../utils/categoryStyles';

interface ProRequestDetailMediaProps {
  request: ServiceRequest;
  serverUrl: string;
  isPlayingAudio: boolean;
  onToggleAudio: (url: string) => void;
}

export const ProRequestDetailMedia: React.FC<ProRequestDetailMediaProps> = ({
  request,
  isPlayingAudio,
  onToggleAudio,
}) => {
  const hasPrimaryMedia = Boolean(request.videoUrl || request.photoUrl || request.audioUrl);
  const categoryVisual = getCategoryStyle(request.category);

  return (
    <div
      className={`pro-image-container${!hasPrimaryMedia ? ' pro-image-container--placeholder' : ''}`}
      style={!hasPrimaryMedia ? { background: categoryVisual.bg } : undefined}
    >
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
        ) : (
          <div className="pro-detail-placeholder">
            <div
              className="pro-detail-placeholder-icon-wrap"
              style={{ border: `1px solid ${categoryVisual.color}33` }}
            >
              <IonIcon
                icon={categoryVisual.icon}
                style={{ fontSize: '32px', color: categoryVisual.color }}
              />
            </div>
          </div>
        )}
    </div>
  );
};
