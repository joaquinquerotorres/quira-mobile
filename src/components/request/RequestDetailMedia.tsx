import React from 'react';
import { IonIcon } from '@ionic/react';
import { playCircleOutline, pauseCircleOutline } from 'ionicons/icons';
import { ServiceRequest } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { getCategoryStyle } from '../../utils/categoryStyles';
import { openRequestMediaFromSources } from '../shared/RequestMediaModal';

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
  const hasPrimaryMedia = Boolean(request.videoUrl || request.photoUrl || request.audioUrl);
  const categoryVisual = getCategoryStyle(request.category);

  const openGallery = (url: string, kind: 'photo' | 'video') => {
    openRequestMediaFromSources(request, { url, kind });
  };

  return (
    <div
      className={`image-container-rounded${!hasPrimaryMedia ? ' image-container-rounded--placeholder' : ''}`}
      style={!hasPrimaryMedia ? { background: categoryVisual.bg } : undefined}
    >
        {request.videoUrl ? (
          <video
            src={resolveMediaUrl(request.videoUrl)}
            className="detail-media-video detail-media-openable"
            muted
            playsInline
            preload="metadata"
            onClick={() => openGallery(request.videoUrl!, 'video')}
            aria-label="Ver vídeo en galería"
          />
        ) : request.photoUrl ? (
          <img
            src={resolveMediaUrl(request.photoUrl)}
            className="detail-image-img detail-media-openable"
            alt="Detalle"
            onClick={() => openGallery(request.photoUrl!, 'photo')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openGallery(request.photoUrl!, 'photo');
              }
            }}
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
            <div
              className="detail-image-placeholder-icon-wrap"
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
