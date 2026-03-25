import React from 'react';
import { IonIcon, IonImg } from '@ionic/react';
import { playCircleOutline, pauseCircleOutline } from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';

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
        ) : (
          <div className="detail-image-placeholder">
            <IonImg
              src="https://jeofdevvotlovkjfbizv.supabase.co/storage/v1/object/public/quira/quira_requests.png"
              alt="Quira"
              style={{ objectFit: 'contain', width: '100%', height: '100%' }}
            />
          </div>
        )}
        <div className="price-badge-floating">{request.priceAmount}€</div>
      </div>
  );
};

