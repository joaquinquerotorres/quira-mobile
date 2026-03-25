import React from 'react';
import { IonImg, IonIcon } from '@ionic/react';
import { imageOutline, playCircleOutline, micOutline, pauseCircleOutline } from 'ionicons/icons';

type Variant = 'requestList' | 'market' | 'myWork';

interface RequestMediaThumbProps {
  variant: Variant;
  requestId: number;
  photoSrc?: string;
  audioUrl?: string;
  videoUrl?: string;
  playingAudioId: number | null;
  onToggleAudio?: (e: React.MouseEvent, id: number, audioUrl: string) => void;
}

const DEFAULT_LOGO =
  'https://jeofdevvotlovkjfbizv.supabase.co/storage/v1/object/public/quira/quira_requests.png';

export const RequestMediaThumb: React.FC<RequestMediaThumbProps> = ({
  variant,
  requestId,
  photoSrc,
  audioUrl,
  videoUrl,
  playingAudioId,
  onToggleAudio,
}) => {
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
    <div className={getWrapperClass()}>
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
          <IonImg
            src={DEFAULT_LOGO}
            alt="Quira"
            style={{ objectFit: 'contain', width: '100%', height: '100%' }}
          />
        </div>
      )}
    </div>
  );
};

