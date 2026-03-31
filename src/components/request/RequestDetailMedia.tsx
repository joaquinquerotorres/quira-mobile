import React from 'react';
import { IonIcon } from '@ionic/react';
import {
  playCircleOutline,
  pauseCircleOutline,
  waterOutline,
  flashOutline,
  hammerOutline,
  brushOutline,
  leafOutline,
  snowOutline,
  sparklesOutline,
  handLeftOutline,
} from 'ionicons/icons';
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
  const hasPrimaryMedia = Boolean(request.videoUrl || request.photoUrl || request.audioUrl);
  const normalizeCategoryKey = (category?: string | { code?: string; name?: string } | null) => {
    if (typeof category === 'string') return category.trim().toUpperCase();
    if (category && typeof category === 'object') {
      return String(category.code || category.name || '').trim().toUpperCase();
    }
    return '';
  };

  const getCategoryVisual = (category?: string | { code?: string; name?: string } | null) => {
    const normalized = normalizeCategoryKey(category);
    const key = normalized === 'DYC' ? 'DIY' : normalized;
    switch (key) {
      case 'PLUMBING':
        return { icon: waterOutline, bg: '#dbeafe', color: '#3b82f6' };
      case 'ELECTRICITY':
        return { icon: flashOutline, bg: '#fef9c3', color: '#eab308' };
      case 'MASONRY':
        return { icon: hammerOutline, bg: '#fee2e2', color: '#ef4444' };
      case 'PAINTING':
        return { icon: brushOutline, bg: '#f3e8ff', color: '#a855f7' };
      case 'GARDENING':
        return { icon: leafOutline, bg: '#dcfce7', color: '#22c55e' };
      case 'CLEANING':
        return { icon: sparklesOutline, bg: '#cffafe', color: '#06b6d4' };
      case 'HVAC':
        return { icon: snowOutline, bg: '#f1f5f9', color: '#64748b' };
      case 'DIY':
      default:
        return { icon: handLeftOutline, bg: '#f1f5f9', color: '#63d8ce' };
    }
  };
  const categoryVisual = getCategoryVisual(request.category);

  return (
    <div
      className={`image-container-rounded${!hasPrimaryMedia ? ' image-container-rounded--placeholder' : ''}`}
      style={!hasPrimaryMedia ? { background: categoryVisual.bg } : undefined}
    >
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
            <div
              className="detail-image-placeholder-icon-wrap"
              style={{ border: `1px solid ${categoryVisual.color}33` }}
            >
              <IonIcon
                icon={categoryVisual.icon}
                style={{ fontSize: '52px', color: categoryVisual.color }}
              />
            </div>
          </div>
        )}
      </div>
  );
};

