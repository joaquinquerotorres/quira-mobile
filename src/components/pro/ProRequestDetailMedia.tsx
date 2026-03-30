import React from 'react';
import { IonIcon } from '@ionic/react';
import { playCircleOutline, pauseCircleOutline } from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface ProRequestDetailMediaProps {
  request: ServiceRequest;
  isPlayingAudio: boolean;
  onToggleAudio: (url: string) => void;
}

export const ProRequestDetailMedia: React.FC<ProRequestDetailMediaProps> = ({
  request,
  isPlayingAudio,
  onToggleAudio,
}) => {
  const hasMedia = Boolean(request.videoUrl || request.photoUrl || request.audioUrl);

  if (!hasMedia) {
    return null;
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
    </div>
  );
};
