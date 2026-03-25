import React from 'react';
import { IonIcon, IonButton } from '@ionic/react';
import { videocamOutline, trashOutline } from 'ionicons/icons';

interface NewRequestInputVideoProps {
  videoBase64: string | null;
  onOpenOptions: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDelete: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const NewRequestInputVideo: React.FC<NewRequestInputVideoProps> = ({
  videoBase64,
  onOpenOptions,
  onFileSelect,
  onDelete,
  inputRef,
}) => (
  <div style={{ marginBottom: '30px' }} className="animate__animated animate__fadeIn">
    <input
      type="file"
      accept="video/*"
      capture="environment"
      onChange={onFileSelect}
      style={{ display: 'none' }}
      ref={inputRef as React.RefObject<HTMLInputElement>}
    />

    {!videoBase64 ? (
      <div
        className="record-btn-container large"
        onClick={onOpenOptions}
        style={{ height: '180px' }}
      >
        <div className="media-icon-circle blue">
          <IonIcon icon={videocamOutline} />
        </div>
        <span className="media-text-main">GRABAR VIDEO</span>
        <span className="record-text-sub">Muestra el problema en video</span>
      </div>
    ) : (
      <div className="media-preview-card video">
        <video src={videoBase64} controls className="video-player-preview" />
        <IonButton
          fill="clear"
          onClick={onDelete}
          className="delete-media-btn-overlay"
          aria-label="Eliminar vídeo"
        >
          <IonIcon slot="icon-only" icon={trashOutline} />
        </IonButton>
      </div>
    )}
  </div>
);
