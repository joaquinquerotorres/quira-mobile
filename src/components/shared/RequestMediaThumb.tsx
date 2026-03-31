import React from 'react';
import { IonImg, IonIcon } from '@ionic/react';
import {
  imageOutline,
  playCircleOutline,
  micOutline,
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

type Variant = 'requestList' | 'market' | 'myWork';

interface RequestMediaThumbProps {
  variant: Variant;
  requestId: number;
  categoryCode?: string | { code?: string; name?: string } | null;
  photoSrc?: string;
  audioUrl?: string;
  videoUrl?: string;
  playingAudioId: number | null;
  onToggleAudio?: (e: React.MouseEvent, id: number, audioUrl: string) => void;
}

export const RequestMediaThumb: React.FC<RequestMediaThumbProps> = ({
  variant,
  requestId,
  categoryCode,
  photoSrc,
  audioUrl,
  videoUrl,
  playingAudioId,
  onToggleAudio,
}) => {
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
  const categoryVisual = getCategoryVisual(categoryCode);
  const hasPrimaryMedia = Boolean(videoUrl || audioUrl || photoSrc);
  const isPlaying = playingAudioId === requestId;

  const handleAudioClick = (e: React.MouseEvent) => {
    if (!audioUrl || !onToggleAudio) return;
    onToggleAudio(e, requestId, audioUrl);
  };

  // Map variant to CSS classes so we can reuse existing styles.
  const getWrapperClass = () => {
    switch (variant) {
      case 'requestList':
        return 'request-list-card-thumb';
      case 'market':
        return 'mkt-thumb';
      case 'myWork':
        return 'mw-thumb';
      default:
        return '';
    }
  };

  const getAudioClass = () => {
    switch (variant) {
      case 'requestList':
        return `request-list-thumb-media audio ${isPlaying ? 'playing' : ''}`;
      case 'market':
      case 'myWork':
        return `thumb-media audio ${isPlaying ? 'playing' : ''}`;
      default:
        return '';
    }
  };

  const getVideoClass = () => {
    switch (variant) {
      case 'requestList':
        return 'request-list-thumb-media video';
      case 'market':
      case 'myWork':
        return 'thumb-media video';
      default:
        return '';
    }
  };

  const getPlaceholderClass = () => {
    switch (variant) {
      case 'requestList':
        return 'request-list-thumb-placeholder';
      case 'market':
      case 'myWork':
        return 'thumb-placeholder';
      default:
        return '';
    }
  };

  return (
    <div
      className={getWrapperClass()}
      style={
        !hasPrimaryMedia
          ? {
              background: categoryVisual.bg,
              borderColor: `${categoryVisual.color}55`,
            }
          : undefined
      }
    >
      {videoUrl ? (
        <div className={getVideoClass()}>
          <IonIcon icon={playCircleOutline} />
        </div>
      ) : audioUrl ? (
        <div className={getAudioClass()} onClick={handleAudioClick}>
          <IonIcon icon={isPlaying ? pauseCircleOutline : micOutline} />
        </div>
      ) : photoSrc ? (
        <IonImg src={photoSrc} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
      ) : (
        <div className={getPlaceholderClass()}>
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IonIcon
              icon={categoryVisual.icon}
              style={{ fontSize: variant === 'requestList' ? '30px' : '28px', color: categoryVisual.color }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

