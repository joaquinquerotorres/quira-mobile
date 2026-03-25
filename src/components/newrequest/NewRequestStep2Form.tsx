import React, { useState } from 'react';
import {
  IonIcon,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonActionSheet,
} from '@ionic/react';
import { VoiceRecorder, RecordingData } from 'capacitor-voice-recorder';
import {
  analyticsOutline,
  alertCircleOutline,
  saveOutline,
  cameraOutline,
  videocamOutline,
  micOutline,
  trashOutline,
} from 'ionicons/icons';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface NewRequestStep2FormProps {
  title: string;
  techDescription: string;
  price: number | undefined;
  aiRange: { min: number; max: number } | null;
  /** Nivel de riesgo estimado por la IA (no modificable por el usuario) */
  riskLevel?: RiskLevel;
  /** Disponibilidad preferida para realizar el trabajo (sin fecha exacta) */
  desiredExecutionTime: string;
  photoBase64: string | null;
  audioBase64: string | null;
  videoBase64: string | null;
  extraMedia: Array<{ type: 'photo' | 'video' | 'audio'; data: string }>;
  maxExtraMedia: number;
  onAddExtraMedia: (type: 'photo' | 'video' | 'audio', file: File) => void;
  onRemoveExtraMedia: (index: number) => void;
  onTitleChange: (value: string) => void;
  onTechDescriptionChange: (value: string) => void;
  onPriceChange: (value: number) => void;
  onDesiredExecutionTimeChange: (value: string) => void;
  onSubmit: () => void;
}

const EXTRA_MEDIA_TYPES: Array<'photo' | 'video' | 'audio'> = ['photo', 'video', 'audio'];

export const NewRequestStep2Form: React.FC<NewRequestStep2FormProps> = ({
  title,
  techDescription,
  price,
  aiRange,
  riskLevel,
  desiredExecutionTime,
  photoBase64,
  audioBase64,
  videoBase64,
  extraMedia,
  maxExtraMedia,
  onAddExtraMedia,
  onRemoveExtraMedia,
  onTitleChange,
  onTechDescriptionChange,
  onPriceChange,
  onDesiredExecutionTimeChange,
  onSubmit,
}) => {
  const [pickerType, setPickerType] = useState<'photo' | 'video' | 'audio' | null>(null);
  const [isRecordingExtraAudio, setIsRecordingExtraAudio] = useState(false);

  const RISK_LABELS: Record<RiskLevel, { label: string; bg: string; color: string }> = {
    LOW: { label: 'Bajo', bg: '#ecfdf5', color: '#166534' },
    MEDIUM: { label: 'Medio', bg: '#fffbeb', color: '#92400e' },
    HIGH: { label: 'Alto', bg: '#fef2f2', color: '#b91c1c' },
  };

  const openPickerFor = (type: 'photo' | 'video' | 'audio') => {
    if (extraMedia.length >= maxExtraMedia) return;
    setPickerType(type);
  };

  const triggerInput = (mode: 'gallery' | 'capture') => {
    if (!pickerType) return;
    const id = `extra-${pickerType}-${mode}-input`;
    const input = document.getElementById(id) as HTMLInputElement | null;
    if (input) {
      input.click();
    }
  };

  const startExtraAudioRecording = async () => {
    try {
      const permission = await VoiceRecorder.requestAudioRecordingPermission();
      if (!permission.value) {
        // Si no hay permiso, caemos al flujo de galería
        triggerInput('gallery');
        return;
      }
      await VoiceRecorder.startRecording();
      setIsRecordingExtraAudio(true);
      setPickerType(null);
    } catch {
      // En caso de error, caemos también a galería
      triggerInput('gallery');
    }
  };

  const stopExtraAudioRecording = async () => {
    try {
      const result: RecordingData = await VoiceRecorder.stopRecording();
      setIsRecordingExtraAudio(false);
      if (result.value && result.value.recordDataBase64) {
        const base64 = result.value.recordDataBase64;
        const byteString = atob(base64);
        const bytes = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          bytes[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/aac' });
        const file = new File(
          [blob],
          `extra-audio-${Date.now()}.aac`,
          { type: 'audio/aac' },
        );
        onAddExtraMedia('audio', file);
      }
    } catch {
      setIsRecordingExtraAudio(false);
    }
  };

  return (
    <div className="animate__animated animate__fadeIn">
    {(photoBase64 || audioBase64 || videoBase64) && (
      <div className="ai-result-card" style={{ marginBottom: '16px' }}>
        <IonLabel className="section-label" style={{ marginBottom: 8 }}>
          Adjuntos de tu solicitud
        </IonLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {photoBase64 && (
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Foto</span>
              <div
                style={{
                  marginTop: 6,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                }}
              >
                <img
                  src={photoBase64}
                  alt="Foto adjunta"
                  style={{ width: '100%', display: 'block', maxHeight: 200, objectFit: 'cover' }}
                />
              </div>
            </div>
          )}
          {videoBase64 && (
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Vídeo</span>
              <div
                style={{
                  marginTop: 6,
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                }}
              >
                <video
                  src={videoBase64}
                  controls
                  style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }}
                />
              </div>
            </div>
          )}
          {audioBase64 && (
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Audio</span>
              <div
                style={{
                  marginTop: 6,
                  padding: 10,
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                }}
              >
                <audio src={audioBase64} controls style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    )}

    <div className="ai-result-card">
      <div className="ai-badge-header">
        <IonIcon
          icon={analyticsOutline}
          style={{ marginRight: '8px', fontSize: '20px' }}
        />
        <span
          style={{
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Diagnóstico IA
        </span>
      </div>
      <div
        style={{
          background: '#fff7ed',
          color: '#c2410c',
          padding: '10px',
          borderRadius: '12px',
          fontSize: '0.8rem',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'start',
        }}
      >
        <IonIcon
          icon={alertCircleOutline}
          style={{ marginRight: '8px', fontSize: '16px', marginTop: '2px' }}
        />
        <span>
          Revisa los datos. Si la IA se ha equivocado, puedes editar el título,
          la descripción o la categoría ahora.
        </span>
      </div>
      {riskLevel && (
        <div
          style={{
            marginBottom: '18px',
            padding: '10px 12px',
            borderRadius: 12,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            fontSize: '0.8rem',
          }}
        >
          <div style={{ color: '#64748b' }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Dificultad estimada (IA)</div>
            <div>Usamos este dato para orientar qué tipo de profesional verá tu solicitud.</div>
          </div>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              background: RISK_LABELS[riskLevel].bg,
              color: RISK_LABELS[riskLevel].color,
              fontSize: '0.75rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {RISK_LABELS[riskLevel].label}
          </span>
        </div>
      )}
      <div style={{ marginBottom: '20px' }}>
        <IonLabel className="section-label">Título</IonLabel>
        <div className="input-wrapper">
          <IonInput
            value={title}
            onIonInput={(e) => onTitleChange(e.detail.value || '')}
          />
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <IonLabel className="section-label">Descripción técnica</IonLabel>
        <div className="input-wrapper textarea-wrapper">
          <IonTextarea
            rows={4}
            value={techDescription}
            onIonInput={(e) => onTechDescriptionChange(e.detail.value || '')}
          />
        </div>
      </div>
      <div className="price-box-container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <span
            style={{
              color: '#64748b',
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            PRECIO ESTIMADO
          </span>
          <span
            style={{
              color: 'var(--ion-color-primary)',
              fontWeight: 800,
            }}
          >
            {aiRange?.min}€ - {aiRange?.max}€
          </span>
        </div>
        {aiRange && (
          <p
            style={{
              margin: 0,
              marginBottom: '10px',
              fontSize: '0.7rem',
              color: '#64748b',
              lineHeight: 1.3,
            }}
          >
            El precio no incluye gastos de desplazamiento ni de posibles materiales/piezas.
          </p>
        )}
        <div
          className="input-wrapper"
          style={{ borderColor: 'var(--ion-color-primary)' }}
        >
          <IonInput
            type="number"
            min={aiRange?.min}
            value={price}
            onIonInput={(e) => {
              const raw = e.detail.value || '';
              const num = parseInt(raw, 10);
              if (Number.isNaN(num)) {
                onPriceChange(0);
              } else {
                onPriceChange(num);
              }
            }}
            style={{
              fontSize: '1.4rem',
              fontWeight: 900,
              color: 'var(--ion-color-primary)',
            }}
          />
        </div>
      </div>
    </div>

    <div className="schedule-card">
      <div className="section-header-row">
        <IonLabel className="section-label" style={{ marginBottom: 0 }}>
          ¿Cuándo lo necesitas?
        </IonLabel>
      </div>
      <div style={{ marginTop: 12 }}>
        <div className="input-wrapper">
          <IonSelect
            interface="action-sheet"
            value={desiredExecutionTime}
            placeholder="Selecciona una opción"
            onIonChange={(e) => onDesiredExecutionTimeChange(e.detail.value as string)}
          >
            <IonSelectOption value="Lo antes posible">Lo antes posible</IonSelectOption>
            <IonSelectOption value="Esta semana">Esta semana</IonSelectOption>
            <IonSelectOption value="La próxima semana">La próxima semana</IonSelectOption>
            <IonSelectOption value="A convenir al aceptar la oferta">
              A convenir al aceptar la oferta
            </IonSelectOption>
          </IonSelect>
        </div>
      </div>
    </div>

    {/* Media adicional opcional */}
    <div className="ai-result-card" style={{ marginTop: '12px' }}>
      <IonLabel className="section-label" style={{ marginBottom: 4 }}>
        Añadir más detalles (opcional)
      </IonLabel>
      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
        Cuanto más detallada sea tu solicitud (fotos, vídeos, audio), más fácil será que los
        profesionales te hagan una buena oferta.
      </p>
      <p style={{ marginTop: 6, marginBottom: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
        Puedes adjuntar hasta {maxExtraMedia} archivos adicionales (fotos, vídeos o audios).
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        {EXTRA_MEDIA_TYPES.map((type) => (
          <div
            key={type}
            style={{
              flex: 1,
              borderRadius: 14,
              border: '1px solid rgba(148, 163, 184, 0.4)',
              padding: '8px 10px',
              fontSize: '0.8rem',
              textAlign: 'center',
              cursor: extraMedia.length >= maxExtraMedia ? 'not-allowed' : 'pointer',
              opacity: extraMedia.length >= maxExtraMedia ? 0.4 : 1,
              background: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
            onClick={() => openPickerFor(type)}
          >
            <input
              id={`extra-${type}-gallery-input`}
              type="file"
              accept={type === 'photo' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*'}
              style={{ display: 'none' }}
              disabled={extraMedia.length >= maxExtraMedia}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                onAddExtraMedia(type, file);
                e.target.value = '';
              }}
            />
            <input
              id={`extra-${type}-capture-input`}
              type="file"
              accept={type === 'photo' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*'}
              // Para foto/vídeo se usa la cámara; para audio intentamos abrir el micro del dispositivo
              capture={type === 'audio' ? true : 'environment'}
              style={{ display: 'none' }}
              disabled={extraMedia.length >= maxExtraMedia}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                onAddExtraMedia(type, file);
                e.target.value = '';
              }}
            />
            <IonIcon
              icon={type === 'photo' ? cameraOutline : type === 'video' ? videocamOutline : micOutline}
              style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary)' }}
            />
            <span>
              {type === 'photo' ? 'Foto' : type === 'video' ? 'Vídeo' : 'Audio'}
            </span>
          </div>
        ))}
      </div>
      {isRecordingExtraAudio && (
        <div
          className="record-btn-container large recording-pulse"
          style={{ marginTop: 12, height: '120px' }}
          onClick={stopExtraAudioRecording}
        >
          <div className="media-icon-circle active-rec">
            <IonIcon icon={micOutline} />
          </div>
          <span className="media-text-main">GRABANDO AUDIO ADICIONAL...</span>
          <span className="record-text-sub">Toca para detener y adjuntar</span>
        </div>
      )}
      {extraMedia.length > 0 && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {extraMedia.map((m, idx) => (
            <div
              key={idx}
              style={{
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: 8,
                width: '100%',
                overflow: 'hidden',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ width: 56, textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  {m.type === 'photo' ? 'Foto' : m.type === 'video' ? 'Vídeo' : 'Audio'}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {m.type === 'photo' && (
                  <img
                    src={m.data}
                    alt=""
                    style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                {m.type === 'video' && (
                  <video
                    src={m.data}
                    controls
                    style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                {m.type === 'audio' && (
                  <audio
                    src={m.data}
                    controls
                    style={{ width: '100%' }}
                  />
                )}
              </div>
              <IonButton
                fill="clear"
                size="small"
                onClick={() => onRemoveExtraMedia(idx)}
                style={{ marginLeft: 'auto' }}
                aria-label="Eliminar adjunto"
              >
                <IonIcon slot="icon-only" icon={trashOutline} />
              </IonButton>
            </div>
          ))}
        </div>
      )}
    </div>
    <IonActionSheet
      isOpen={pickerType !== null}
      onDidDismiss={() => setPickerType(null)}
      header={
        pickerType === 'photo'
          ? 'Añadir foto'
          : pickerType === 'video'
          ? 'Añadir vídeo'
          : 'Añadir audio'
      }
      buttons={[
        {
          text:
            pickerType === 'photo'
              ? 'Hacer foto'
              : pickerType === 'video'
              ? 'Grabar vídeo'
              : 'Grabar audio',
          handler: () => {
            if (pickerType === 'audio') {
              startExtraAudioRecording();
            } else {
              triggerInput('capture');
            }
          },
        },
        {
          text: 'Elegir de la galería',
          handler: () => triggerInput('gallery'),
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ]}
    />
    <IonButton
      expand="block"
      className="quira-main-btn"
      onClick={onSubmit}
      style={{ marginBottom: '15px' }}
    >
      <IonIcon slot="start" icon={saveOutline} /> PUBLICAR SOLICITUD
    </IonButton>
  </div>
  );
};
