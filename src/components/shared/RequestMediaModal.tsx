import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  alertCircleOutline,
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

type OpenHandler = (items: RequestMediaItem[]) => void;

/** Un solo modal para toda la app (evita IonModal por card → pantalla negra intermitente). */
let openMediaHandler: OpenHandler | null = null;

export function openRequestMedia(items: RequestMediaItem[]): void {
  if (!items.length) return;
  openMediaHandler?.([...items]);
}

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
  const items = useMemo(
    () => collectRequestMedia({ photoUrl, videoUrl, audioUrl }),
    [photoUrl, videoUrl, audioUrl],
  );

  /** Evita que IonCard (routerLink/button) navegue al detalle al abrir media. */
  const blockCardNavigation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const openModal = (e: React.MouseEvent | React.PointerEvent) => {
    blockCardNavigation(e);
    openRequestMedia(items);
  };

  if (items.length === 0) return null;

  return (
    <button
      type="button"
      className={`request-media-chip${className ? ` ${className}` : ''}`}
      onClick={openModal}
      onPointerDown={blockCardNavigation}
      onMouseDown={blockCardNavigation}
      onTouchStart={blockCardNavigation}
    >
      <IonIcon icon={imagesOutline} aria-hidden="true" />
      <span className="request-media-chip-label">Media</span>
      <span className="request-media-chip-count">{items.length}</span>
    </button>
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
  const [mediaStatus, setMediaStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const safeIndex = items.length === 0 ? 0 : Math.min(index, items.length - 1);
  const current = items[safeIndex] ?? null;
  const resolvedSrc = current ? resolveMediaUrl(current.url) : '';

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setAudioPlaying(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIndex(0);
      setMediaStatus('loading');
      stopAudio();
      return;
    }
    setIndex(0);
    setMediaStatus(items[0]?.kind === 'audio' ? 'ready' : 'loading');
  }, [isOpen, items, stopAudio]);

  useEffect(() => {
    stopAudio();
    if (!current) {
      setMediaStatus('error');
      return;
    }
    setMediaStatus(current.kind === 'audio' ? 'ready' : 'loading');
  }, [safeIndex, current?.kind, current?.url, stopAudio]);

  useEffect(() => () => stopAudio(), [stopAudio]);

  const goPrev = () => {
    setIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
  };

  const goNext = () => {
    setIndex((i) => (i >= items.length - 1 ? 0 : i + 1));
  };

  const toggleAudio = async () => {
    if (!current || current.kind !== 'audio' || !resolvedSrc) return;
    if (audioPlaying && audioRef.current) {
      stopAudio();
      return;
    }
    const audio = new Audio(resolvedSrc);
    audioRef.current = audio;
    audio.onended = () => setAudioPlaying(false);
    audio.onerror = () => {
      setMediaStatus('error');
      setAudioPlaying(false);
    };
    try {
      await audio.play();
      setAudioPlaying(true);
      setMediaStatus('ready');
    } catch {
      setAudioPlaying(false);
      setMediaStatus('error');
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      initialBreakpoint={0.92}
      breakpoints={[0, 0.92, 1]}
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
          {!current || !resolvedSrc ? (
            <div className="request-media-empty">
              <IonIcon icon={alertCircleOutline} />
              <p>No hay media disponible para mostrar.</p>
            </div>
          ) : (
            <>
              <div className="request-media-kind-label">
                {KIND_LABEL[current.kind]} ({safeIndex + 1}/{items.length})
              </div>
              <div className="request-media-stage">
                {mediaStatus === 'loading' && current.kind !== 'audio' && (
                  <div className="request-media-stage-status">
                    <IonSpinner name="crescent" color="light" />
                    <span>Cargando…</span>
                  </div>
                )}
                {mediaStatus === 'error' && (
                  <div className="request-media-stage-status">
                    <IonIcon icon={alertCircleOutline} />
                    <span>No se pudo cargar este archivo.</span>
                  </div>
                )}
                {current.kind === 'photo' && (
                  <img
                    key={resolvedSrc}
                    src={resolvedSrc}
                    alt="Foto de la solicitud"
                    style={{
                      opacity: mediaStatus === 'ready' ? 1 : 0,
                      position: mediaStatus === 'ready' ? 'relative' : 'absolute',
                    }}
                    onLoad={() => setMediaStatus('ready')}
                    onError={() => setMediaStatus('error')}
                  />
                )}
                {current.kind === 'video' && (
                  <video
                    key={resolvedSrc}
                    src={resolvedSrc}
                    controls
                    playsInline
                    preload="metadata"
                    style={{
                      opacity: mediaStatus === 'error' ? 0 : 1,
                    }}
                    onLoadedData={() => setMediaStatus('ready')}
                    onError={() => setMediaStatus('error')}
                  />
                )}
                {current.kind === 'audio' && mediaStatus !== 'error' && (
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
                        key={`${item.kind}-${item.url}-${i}`}
                        type="button"
                        className={`request-media-dot${i === safeIndex ? ' active' : ''}`}
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

/** Host único: montar una vez en App (fuera de las cards). */
export const RequestMediaModalHost: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<RequestMediaItem[]>([]);

  useEffect(() => {
    openMediaHandler = (next) => {
      setItems(next);
      setIsOpen(true);
    };
    return () => {
      openMediaHandler = null;
    };
  }, []);

  return (
    <RequestMediaModal
      isOpen={isOpen}
      items={items}
      onDidDismiss={() => {
        setIsOpen(false);
        setItems([]);
      }}
    />
  );
};
