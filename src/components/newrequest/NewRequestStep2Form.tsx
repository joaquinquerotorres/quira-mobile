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
  audioDataUrlToBlob,
  buildAudioDataUrlForApi,
  extensionForAudioMime,
} from '../../utils/audioDataUrl';
import {
  analyticsOutline,
  alertCircleOutline,
  saveOutline,
  cameraOutline,
  videocamOutline,
  micOutline,
  trashOutline,
} from 'ionicons/icons';
import { CATEGORY_OPTIONS } from '../../utils/categoryLabels';
import { formatRequestPriceRangeEuros } from '../../utils/requestPriceRange';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface NewRequestStep2FormProps {
  title: string;
  techDescription: string;
  /** Texto libre del cliente (modo texto + imagen), sin sobrescribir con la IA. */
  clientOriginalDescription?: string;
  /** Rango estimado por la IA para el servicio en la zona (solo lectura). */
  aiRange: { min: number; max: number } | null;
  /** Diagnóstico IA completo (para reglas de visualización como VISIT_REQUIRED). */
  aiDiagnosis?: Record<string, unknown> | null;
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
  category: string;
  onCategoryChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onTechDescriptionChange: (value: string) => void;
  onDesiredExecutionTimeChange: (value: string) => void;
  clarifyingQuestions: string[];
  clarifyingAnswers: string[];
  onClarifyingAnswerChange: (index: number, value: string) => void;
  onSubmit: () => void;
  /** Aviso de moderación cuando predict marca safe=false (sigue permitiendo editar/publicar). */
  unsafeNotice?: string | null;
}

const EXTRA_MEDIA_TYPES: Array<'photo' | 'video' | 'audio'> = ['photo', 'video', 'audio'];

export const NewRequestStep2Form: React.FC<NewRequestStep2FormProps> = ({
  title,
  techDescription,
  clientOriginalDescription = '',
  aiRange,
  aiDiagnosis = null,
  riskLevel,
  desiredExecutionTime,
  photoBase64,
  audioBase64,
  videoBase64,
  extraMedia,
  maxExtraMedia,
  onAddExtraMedia,
  onRemoveExtraMedia,
  category,
  onCategoryChange,
  onTitleChange,
  onTechDescriptionChange,
  onDesiredExecutionTimeChange,
  clarifyingQuestions,
  clarifyingAnswers,
  onClarifyingAnswerChange,
  onSubmit,
  unsafeNotice = null,
}) => {
  const [pickerType, setPickerType] = useState<'photo' | 'video' | 'audio' | null>(null);
  const [isRecordingExtraAudio, setIsRecordingExtraAudio] = useState(false);
  const pricingType = String(
    aiDiagnosis?.pricing_type ?? aiDiagnosis?.pricingType ?? '',
  ).toUpperCase();
  const isVisitRequiredPricing = pricingType === 'VISIT_REQUIRED';

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
        const dataUrl = buildAudioDataUrlForApi(result.value);
        if (!dataUrl) return;
        const blob = audioDataUrlToBlob(dataUrl);
        const ext = extensionForAudioMime(blob.type);
        const file = new File(
          [blob],
          `extra-audio-${Date.now()}.${ext}`,
          { type: blob.type },
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
              <div className="step2-attach-media-wrap">
                <img
                  src={photoBase64}
                  alt="Foto adjunta"
                  className="step2-attach-photo"
                />
              </div>
            </div>
          )}
          {videoBase64 && (
            <div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Vídeo</span>
              <div className="step2-attach-media-wrap is-video">
                <video
                  src={videoBase64}
                  controls
                  className="step2-attach-video"
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
      {clientOriginalDescription.trim() ? (
        <div
          style={{
            marginBottom: '18px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#64748b',
              marginBottom: '8px',
            }}
          >
            Tu texto original
          </div>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.45, color: '#0f172a' }}>
            {clientOriginalDescription.trim()}
          </p>
        </div>
      ) : null}
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
          Diagnóstico Quira
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
          Revisa los datos. Si Quira se ha equivocado, puedes editar el título,
          la descripción técnica o la categoría ahora.
        </span>
      </div>
      {unsafeNotice && (
        <div
          role="status"
          aria-label="Aviso de moderación"
          style={{
            background: '#fef2f2',
            color: '#991b1b',
            padding: '10px',
            borderRadius: '12px',
            fontSize: '0.8rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'start',
            border: '1px solid #fecaca',
          }}
        >
          <IonIcon
            icon={alertCircleOutline}
            style={{ marginRight: '8px', fontSize: '16px', marginTop: '2px' }}
          />
          <span>{unsafeNotice}</span>
        </div>
      )}
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
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Dificultad estimada (Quira)</div>
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
      <div style={{ marginBottom: '20px' }}>
        <IonLabel className="section-label">Categoría</IonLabel>
        <div className="input-wrapper">
          <IonSelect
            interface="action-sheet"
            cancelText="Cancelar"
            value={category}
            placeholder="Selecciona categoría"
            onIonChange={(e) => onCategoryChange(String(e.detail.value ?? ''))}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <IonSelectOption key={opt.value} value={opt.value}>
                {opt.label}
              </IonSelectOption>
            ))}
          </IonSelect>
        </div>
      </div>
      <div className="price-box-container step2-price-range-readonly">
        <div className="step2-price-range-header">
          <span className="step2-price-range-label">Rango estimado en tu zona (Quira)</span>
        </div>
        {aiRange ? (
          <>
            <div className="step2-price-range-value" aria-live="polite">
              {formatRequestPriceRangeEuros({
                estimatedPriceMin: aiRange.min,
                estimatedPriceMax: aiRange.max,
                aiDiagnosis: aiDiagnosis ?? undefined,
              })}
            </div>
            {!isVisitRequiredPricing && (
              <p className="step2-price-range-hint">
                Estimación orientativa para servicios similares en tu zona; no incluye desplazamiento ni
                materiales/piezas.
              </p>
            )}
          </>
        ) : (
          <p className="step2-price-range-hint" style={{ marginBottom: 0 }}>
            No hay rango de precio disponible. Vuelve al paso anterior y vuelve a analizar la solicitud.
          </p>
        )}
      </div>

      {clarifyingQuestions.length > 0 && (
        <div className="clarifying-block">
          <div className="clarifying-block-header">
            <IonLabel className="section-label clarifying-title">Preguntas de Quira (obligatorias)</IonLabel>
            <span className="clarifying-count">
              {clarifyingAnswers.filter((a) => a.trim() !== '').length}/{clarifyingQuestions.length}
            </span>
          </div>
          <p className="clarifying-subtitle">
            Para mejorar el diagnóstico y el precio, responde todas antes de publicar.
          </p>
          <div className="clarifying-list">
            {clarifyingQuestions.map((question, index) => (
              <div key={`${index}-${question}`} className="clarifying-item">
                <div className="clarifying-question-row">
                  <span className="clarifying-question-index">{index + 1}</span>
                  <div className="clarifying-question-text">
                    {question}
                  </div>
                </div>
                <div className="input-wrapper clarifying-input-wrap">
                  <IonInput
                    value={clarifyingAnswers[index] ?? ''}
                    placeholder="Escribe tu respuesta..."
                    onIonInput={(e) => onClarifyingAnswerChange(index, e.detail.value ?? '')}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
                  <div className="step2-extra-video-shell">
                    <video
                      src={m.data}
                      controls
                      className="step2-extra-video"
                    />
                  </div>
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
