import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  imagesOutline,
  micOutline,
  pauseCircleOutline,
  playCircleOutline,
} from 'ionicons/icons';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import {
  collectRequestMedia,
  type RequestMediaItem,
} from '../../utils/requestMedia';
import './RequestMediaModal.css';

const KIND_LABEL: Record<RequestMediaItem['kind'], string> = {
  photo: 'Foto',
  video: 'Vídeo',
  audio: 'Audio',
};

interface RequestMediaSources {
  photoUrl?: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
}

interface RequestMediaChipProps extends RequestMediaSources {
  className?: string;
}

export const RequestMediaChip: React.FC<RequestMediaChipProps> = ({
  photoUrl,
  videoUrl,
  audioUrl,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const items = useMemo(
    () => collectRequestMedia({ photoUrl, videoUrl, audioUrl }),
    [photoUrl, videoUrl, audioUrl],
  );

  if (items.length === 0) return null;

  return (
    <>
      <button
        type="button"
        className={`request-media-chip${className ? ` ${className}` : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
      >
        <IonIcon icon={imagesOutline} />
        Media
        <span className="request-media-chip-count">{items.length}</span>
      </button>
      <RequestMediaModal
        isOpen={open}
        items={items}
        onDidDismiss={() => setOpen(false)}
      />
    </>
  );
};

interface RequestMediaModalProps {
  isOpen: boolean;
  items: RequestMediaItem[];
  onDidDismiss: () => void;
}

export const RequestMediaModal: React.FC<RequestMediaModalProps> = ({
  isOpen,
  items,
  onDidDismiss,
}) => {
  const [index, setIndex] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = items[index] ?? null;

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioPlaying(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setIndex(0);
      stopAudio();
    }
  }, [isOpen]);

  useEffect(() => {
    stopAudio();
  }, [index]);

  useEffect(() => () => stopAudio(), []);

  const goPrev = () => {
    setIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
  };

  const goNext = () => {
    setIndex((i) => (i >= items.length - 1 ? 0 : i + 1));
  };

  const toggleAudio = async () => {
    if (!current || current.kind !== 'audio') return;
    if (audioPlaying && audioRef.current) {
      stopAudio();
      return;
    }
    const audio = new Audio(resolveMediaUrl(current.url));
    audioRef.current = audio;
    audio.onended = () => setAudioPlaying(false);
    try {
      await audio.play();
      setAudioPlaying(true);
    } catch {
      setAudioPlaying(false);
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      initialBreakpoint={0.9}
      breakpoints={[0, 0.9, 1]}
      className="request-media-modal"
    >
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle style={{ fontWeight: 800 }}>Media</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => {
                stopAudio();
                onDidDismiss();
              }}
              color="medium"
            >
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="request-media-modal-body">
          {current && (
            <>
              <div className="request-media-kind-label">
                {KIND_LABEL[current.kind]} ({index + 1}/{items.length})
              </div>
              <div className="request-media-stage">
                {current.kind === 'photo' && (
                  <img
                    src={resolveMediaUrl(current.url)}
                    alt="Foto de la solicitud"
                  />
                )}
                {current.kind === 'video' && (
                  <video
                    key={current.url}
                    src={resolveMediaUrl(current.url)}
                    controls
                    playsInline
                  />
                )}
                {current.kind === 'audio' && (
                  <div className="request-media-audio-panel">
                    <IonButton
                      fill="clear"
                      color="light"
                      onClick={toggleAudio}
                      style={{ fontSize: '64px', height: 'auto' }}
                    >
                      <IonIcon
                        icon={audioPlaying ? pauseCircleOutline : playCircleOutline}
                      />
                    </IonButton>
                    <p>
                      <IonIcon icon={micOutline} style={{ marginRight: 6 }} />
                      Nota de voz del cliente
                    </p>
                  </div>
                )}
              </div>
              {items.length > 1 && (
                <div className="request-media-nav">
                  <IonButton fill="clear" onClick={goPrev}>
                    <IonIcon slot="icon-only" icon={chevronBackOutline} />
                  </IonButton>
                  <div className="request-media-dots">
                    {items.map((item, i) => (
                      <button
                        key={`${item.kind}-${item.url}`}
                        type="button"
                        className={`request-media-dot${i === index ? ' active' : ''}`}
                        aria-label={`Ir a ${KIND_LABEL[item.kind]}`}
                        onClick={() => setIndex(i)}
                      />
                    ))}
                  </div>
                  <IonButton fill="clear" onClick={goNext}>
                    <IonIcon slot="icon-only" icon={chevronForwardOutline} />
                  </IonButton>
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};
