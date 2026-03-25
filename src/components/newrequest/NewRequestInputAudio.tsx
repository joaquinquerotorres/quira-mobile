import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import {
  micOutline,
  stopCircleOutline,
  playCircleOutline,
  pauseCircleOutline,
  trashOutline,
} from 'ionicons/icons';

interface NewRequestInputAudioProps {
  audioBase64: string | null;
  isRecording: boolean;
  isPlayingAudio: boolean;
  audioDuration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onOpenOptions: () => void;
  onPlayPreview: () => void;
  onDelete: () => void;
}

export const NewRequestInputAudio: React.FC<NewRequestInputAudioProps> = ({
  audioBase64,
  isRecording,
  isPlayingAudio,
  audioDuration,
  onStartRecording,
  onStopRecording,
  onOpenOptions,
  onPlayPreview,
  onDelete,
}) => (
  <div style={{ marginBottom: '30px' }} className="animate__animated animate__fadeIn">
    {!audioBase64 ? (
      <div
        className={`record-btn-container large ${isRecording ? 'recording-pulse' : ''}`}
        onClick={isRecording ? onStopRecording : onOpenOptions}
        style={{ height: '180px' }}
      >
        <div
          className={`media-icon-circle ${isRecording ? 'active-rec' : 'blue'}`}
        >
          <IonIcon icon={isRecording ? stopCircleOutline : micOutline} />
        </div>
        <span className="media-text-main">
          {isRecording ? 'GRABANDO...' : 'PULSAR PARA HABLAR'}
        </span>
        <span className="record-text-sub">Explica tu problema de viva voz</span>
      </div>
    ) : (
      <div className="media-preview-card audio">
        <div className="preview-left" onClick={onPlayPreview}>
          <div className="play-icon-box">
            <IonIcon
              icon={isPlayingAudio ? pauseCircleOutline : playCircleOutline}
            />
          </div>
          <div>
            <div className="preview-title">Nota de voz grabada</div>
            <div className="preview-sub">
              {Math.round(audioDuration)}s • Toca para escuchar
            </div>
          </div>
        </div>
        <IonButton fill="clear" onClick={onDelete} className="delete-media-btn" aria-label="Eliminar audio">
          <IonIcon slot="icon-only" icon={trashOutline} />
        </IonButton>
      </div>
    )}
  </div>
);
