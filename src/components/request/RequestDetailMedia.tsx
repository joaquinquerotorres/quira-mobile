import React from 'react';
import { IonIcon } from '@ionic/react';
import { playCircleOutline, pauseCircleOutline } from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface RequestDetailMediaProps {
  request: ServiceRequest;
  isPlayingAudio: boolean;
  onToggleAudio: (url: string) => void;
}

export const RequestDetailMedia: React.FC<RequestDetailMediaProps> = ({
  request,
  isPlayingAudio,
  onToggleAudio,
}) => {
  const hasMedia = Boolean(request.videoUrl || request.photoUrl || request.audioUrl);

  if (!hasMedia) {
    return null;
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
    </div>
  );
};
