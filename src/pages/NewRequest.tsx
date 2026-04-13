import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButton, IonIcon, IonLoading, IonToast, useIonRouter, IonActionSheet, useIonViewWillLeave,
  useIonViewWillEnter,
} from '@ionic/react';
import { colorWandOutline, imagesOutline, micOutline, videocamOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import { VoiceRecorder, RecordingData } from 'capacitor-voice-recorder';
import { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import * as Sentry from '@sentry/capacitor';
import { isAxiosError } from 'axios';
import api from '../api/axios';
import {
  axiosErrorUserHint,
  buildAxiosErrorReport,
} from '../api/axiosErrorDebug';
import './NewRequest.css';
import '../components/layout/LogoHeader.css';
import { NewRequestModeSelector } from '../components/newrequest/NewRequestModeSelector';
import { NewRequestInputAudio } from '../components/newrequest/NewRequestInputAudio';
import { NewRequestInputVideo } from '../components/newrequest/NewRequestInputVideo';
import { NewRequestInputText } from '../components/newrequest/NewRequestInputText';
import { NewRequestLocation } from '../components/newrequest/NewRequestLocation';
import { NewRequestStep2Form } from '../components/newrequest/NewRequestStep2Form';

import { env } from '../config/env';
import { PREDICT_REQUEST_TIMEOUT_MS } from '../config/httpTimeouts';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import { getVerificationStatus } from '../hooks/useUserVerification';
import { uploadRequestMediaWithTicket } from '../services/uploadService';
import { buildAudioDataUrlForApi } from '../utils/audioDataUrl';
import {
  getVideoUploadConnectionHint,
  type VideoUploadConnectionHint,
} from '../utils/videoUploadNetworkHint';
import {
  maybeCompressVideoDataUrlForPredict,
  predictVideoPayloadDecodedBytes,
  shouldCompressVideoForUpload,
  PREDICT_VIDEO_MAX_DECODED_BYTES_FOR_COMPRESS_DEFAULT,
  PREDICT_VIDEO_MAX_DECODED_BYTES_FOR_COMPRESS_NATIVE,
  PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC,
  PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC_NATIVE,
} from '../utils/videoCompressForPredict';

const GOOGLE_API_KEY = env.googleMapsKey;

const NEW_REQUEST_DRAFT_KEY = 'quira_new_request_draft_v1';

type NewRequestDraftSnapshotV1 = {
  v: 1;
  step: 1 | 2;
  inputMode: 'AUDIO' | 'VIDEO' | 'TEXT';
  userDescription: string;
  clientOriginalDescription: string;
  photoBase64: string | null;
  audioBase64: string | null;
  audioDuration: number;
  videoBase64: string | null;
  title: string;
  techDescription: string;
  category: string;
  aiRange: { min: number; max: number } | null;
  aiDiagnosis: Record<string, unknown> | null;
  clarifyingQuestions: string[];
  clarifyingAnswers: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  desiredExecutionTime: string;
  address: string;
  locationLabel: string;
  coords: { lat: number; lng: number } | null;
  extraMedia: Array<{ type: 'photo' | 'video' | 'audio'; data: string }>;
  videoUploadNetworkHint: VideoUploadConnectionHint | null;
};

const NewRequest: React.FC = () => {
  const router = useIonRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // --- SELECCIÓN DE MODO ---
  const [inputMode, setInputMode] = useState<'AUDIO' | 'VIDEO' | 'TEXT'>('AUDIO');

  // --- ESTADOS DE CONTENIDO ---
  const [userDescription, setUserDescription] = useState('');
  /** Texto del paso 1 en modo TEXT; no se sobrescribe con el resumen de la IA. */
  const [clientOriginalDescription, setClientOriginalDescription] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  // Audio
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Video
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [mediaPickerType, setMediaPickerType] = useState<'photo' | 'video' | 'audio' | null>(null);

  // Datos IA y Formulario
  const [title, setTitle] = useState('');
  const [techDescription, setTechDescription] = useState('');
  const [category, setCategory] = useState('DIY');
  const [aiRange, setAiRange] = useState<{ min: number; max: number } | null>(null);
  const [aiDiagnosis, setAiDiagnosis] = useState<Record<string, unknown> | null>(null);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<string[]>([]);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | null>(null);
  const [desiredExecutionTime, setDesiredExecutionTime] = useState<string>('Lo antes posible');

  const [address, setAddress] = useState<string>('');
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // Media extra opcional en step 2 (máx 3 elementos)
  const [extraMedia, setExtraMedia] = useState<Array<{ type: 'photo' | 'video' | 'audio'; data: string }>>([]);
  const MAX_EXTRA_MEDIA = 3;

  /** Aviso en pestaña vídeo si hay datos móviles o red lenta (detalle fino solo en app nativa). */
  const [videoUploadNetworkHint, setVideoUploadNetworkHint] =
    useState<VideoUploadConnectionHint | null>(null);

  useEffect(() => {
    VoiceRecorder.requestAudioRecordingPermission();
  }, []);

  useEffect(() => {
    if (step !== 1 || inputMode !== 'VIDEO') {
      setVideoUploadNetworkHint(null);
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const h = await getVideoUploadConnectionHint();
      if (!cancelled) setVideoUploadNetworkHint(h);
    };

    void refresh();

    let removeListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void Network.addListener('networkStatusChange', () => {
        void refresh();
      }).then((handle) => {
        removeListener = () => handle.remove();
      });
    }

    return () => {
      cancelled = true;
      removeListener?.();
    };
  }, [step, inputMode]);

  const resetDraft = () => {
    setStep(1);
    setInputMode('AUDIO');
    setLoading(false);
    setLoadingMessage('');
    setUserDescription('');
    setPhotoBase64(null);
    setIsRecording(false);
    setAudioBase64(null);
    setAudioDuration(0);
    setIsPlayingAudio(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setVideoBase64(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
    setMediaPickerType(null);
    setTitle('');
    setTechDescription('');
    setCategory('DIY');
    setAiRange(null);
    setAiDiagnosis(null);
    setClarifyingQuestions([]);
    setClarifyingAnswers([]);
    setRiskLevel(null);
    setDesiredExecutionTime('Lo antes posible');
    setAddress('');
    setLocationLabel('');
    setCoords(null);
    setExtraMedia([]);
    setVideoUploadNetworkHint(null);
  };

  const persistDraftSnapshot = () => {
    const snapshot: NewRequestDraftSnapshotV1 = {
      v: 1,
      step,
      inputMode,
      userDescription,
      clientOriginalDescription,
      photoBase64,
      audioBase64,
      audioDuration,
      videoBase64,
      title,
      techDescription,
      category,
      aiRange,
      aiDiagnosis,
      clarifyingQuestions,
      clarifyingAnswers,
      riskLevel,
      desiredExecutionTime,
      address,
      locationLabel,
      coords,
      extraMedia,
      videoUploadNetworkHint,
    };
    try {
      sessionStorage.setItem(NEW_REQUEST_DRAFT_KEY, JSON.stringify(snapshot));
    } catch (e) {
      if (
        e instanceof DOMException &&
        (e.name === 'QuotaExceededError' || e.code === 22)
      ) {
        setToast(
          'No se pudo guardar el borrador automáticamente (demasiado pesado). Si vas a Perfil, podrías perder el borrador.',
        );
      }
    }
  };

  useIonViewWillEnter(() => {
    const raw = sessionStorage.getItem(NEW_REQUEST_DRAFT_KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as NewRequestDraftSnapshotV1;
      if (d.v !== 1) return;
      sessionStorage.removeItem(NEW_REQUEST_DRAFT_KEY);
      setStep(d.step);
      setInputMode(d.inputMode);
      setUserDescription(d.userDescription);
      setClientOriginalDescription(d.clientOriginalDescription);
      setPhotoBase64(d.photoBase64);
      setAudioBase64(d.audioBase64);
      setAudioDuration(d.audioDuration);
      setVideoBase64(d.videoBase64);
      setMediaPickerType(null);
      setTitle(d.title);
      setTechDescription(d.techDescription);
      setCategory(d.category);
      setAiRange(d.aiRange);
      setAiDiagnosis(d.aiDiagnosis ?? null);
      setClarifyingQuestions(Array.isArray(d.clarifyingQuestions) ? d.clarifyingQuestions : []);
      setClarifyingAnswers(Array.isArray(d.clarifyingAnswers) ? d.clarifyingAnswers : []);
      setRiskLevel(d.riskLevel);
      setDesiredExecutionTime(d.desiredExecutionTime);
      setAddress(d.address);
      setLocationLabel(d.locationLabel);
      setCoords(d.coords);
      setExtraMedia(d.extraMedia);
      setVideoUploadNetworkHint(d.videoUploadNetworkHint);
    } catch {
      sessionStorage.removeItem(NEW_REQUEST_DRAFT_KEY);
    }
  });

  // Si el usuario abandona la pantalla (tabs, back, navegación), limpiamos el borrador.
  useIonViewWillLeave(() => {
    resetDraft();
  });

  const clearAudioCaptureState = () => {
    setAudioBase64(null);
    setAudioDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingAudio(false);
    const audioFileInput = document.getElementById(
      'step1-audio-file-input',
    ) as HTMLInputElement | null;
    if (audioFileInput) audioFileInput.value = '';
  };

  /** Cada pestaña es independiente: solo cuenta lo que el usuario ve al pulsar analizar. */
  const handleModeChange = async (mode: 'AUDIO' | 'VIDEO' | 'TEXT') => {
    if (inputMode === 'AUDIO' && mode !== 'AUDIO' && isRecording) {
      try {
        await VoiceRecorder.stopRecording();
      } catch {
        /* ignorar si ya estaba parado */
      }
      setIsRecording(false);
    }

    if (mode !== 'AUDIO') {
      clearAudioCaptureState();
    }
    if (mode !== 'VIDEO') {
      setVideoBase64(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
    if (mode !== 'TEXT') {
      setUserDescription('');
      setClientOriginalDescription('');
      setPhotoBase64(null);
    }

    setInputMode(mode);
  };

  // --- HANDLERS MEDIA ---

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      setPhotoBase64(image.dataUrl || null);
    } catch { /* Usuario canceló */ }
  };

  // AUDIO RECORDING
  const startRecording = async () => {
    try {
        const canRecord = await VoiceRecorder.requestAudioRecordingPermission();
        if (canRecord.value) {
            await VoiceRecorder.startRecording();
            setIsRecording(true);
        } else { setToast("Necesitamos permiso de micrófono."); }
    } catch (e) { setToast("Error al iniciar micrófono"); }
  };

  const stopRecording = async () => {
    try {
        const result: RecordingData = await VoiceRecorder.stopRecording();
        setIsRecording(false);
        if (result.value && result.value.recordDataBase64) {
            const dataUrl = buildAudioDataUrlForApi(result.value);
            if (dataUrl) {
              setAudioBase64(dataUrl);
              setAudioDuration((result.value.msDuration ?? 0) / 1000);
            }
        }
    } catch (e) { setToast("Error al parar grabación"); }
  };

  // AUDIO PREVIEW
  const playAudioPreview = () => {
      if (!audioBase64) return;
      if (!audioRef.current) {
          audioRef.current = new Audio(audioBase64);
          audioRef.current.onended = () => setIsPlayingAudio(false);
      }
      if (isPlayingAudio) {
          audioRef.current.pause();
          setIsPlayingAudio(false);
      } else {
          audioRef.current.play();
          setIsPlayingAudio(true);
      }
  };

  const deleteAudio = () => {
    clearAudioCaptureState();
  };

  // VIDEO INPUT
  const triggerVideoInput = () => {
      videoInputRef.current?.click();
  };

  const handleVideoFile = (event: any) => {
      const file = event.target.files[0];
      if (file) {
          // 1. Límite de Tamaño: Bajamos a 25MB (Suficiente para 15s HD)
          if (file.size > 25 * 1024 * 1024) { 
              setToast("El vídeo es demasiado pesado. Máximo 25MB.");
              return;
          }

          // 2. (Opcional pero recomendado) Validación de duración
          // Esto requiere crear un elemento video temporal para leer la metadata
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = function() {
              window.URL.revokeObjectURL(video.src);
              if (video.duration > 20) { // Límite 20 segundos
                  setToast("Por favor, resume el problema en 20 segundos máximo.");
                  return;
              }
              
              // Si pasa las validaciones, procesamos
              const reader = new FileReader();
              reader.onloadend = () => {
                  setVideoBase64(reader.result as string);
              };
              reader.readAsDataURL(file);
          }
          video.src = URL.createObjectURL(file);
      }
  };

  const deleteVideo = () => {
      setVideoBase64(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSelectAudioFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setToast('El audio es demasiado pesado. Máximo 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      setAudioBase64(result);
      setAudioDuration(0);
    };
    reader.readAsDataURL(file);
  };

  const triggerMediaInput = (kind: 'video' | 'audio') => {
    if (kind === 'video') {
      videoInputRef.current?.click();
    } else if (kind === 'audio') {
      const input = document.getElementById('step1-audio-file-input') as HTMLInputElement | null;
      input?.click();
    }
  };

  // --- UBICACIÓN ---

  const isCordobaArea = (components: any[]): boolean => {
    if (!components) return false;
    const get = (type: string) =>
      components.find((c: any) => c.types?.includes(type))?.long_name as string | undefined;
    const province =
      get('administrative_area_level_2') ||
      get('administrative_area_level_1');
    const country = get('country');
    const isSpain = country === 'España' || country === 'Spain';
    const isCordoba =
      province === 'Córdoba' ||
      province === 'Cordoba';
    return Boolean(isSpain && isCordoba);
  };

  const extractLocationLabelFromComponents = (components: any[]): string | null => {
    if (!components) return null;
    const get = (type: string) =>
      components.find((c: any) => c.types?.includes(type))?.long_name as string | undefined;

    const locality =
      get('locality') ||
      get('postal_town') ||
      get('administrative_area_level_3');
    const province =
      get('administrative_area_level_2') ||
      get('administrative_area_level_1');
    const country = get('country');

    const isSpain = country === 'España' || country === 'Spain';

    if (locality && province && isSpain && locality !== province) {
      return `${locality}, ${province} (España)`;
    }
    if (locality && isSpain) {
      return `${locality} (España)`;
    }
    if (!locality && province && isSpain) {
      return `${province} (España)`;
    }
    if (locality && province && country) {
      return `${locality}, ${province} (${country})`;
    }
    if (locality && country) {
      return `${locality} (${country})`;
    }
    return null;
  };
  const getCurrentLocation = async () => {
    setLoading(true);
    setLoadingMessage('Localizando...');
    try {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
        });
        const { latitude, longitude } = coordinates.coords;
        setCoords({ lat: latitude, lng: longitude });
        if (GOOGLE_API_KEY) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`);
            const data = await res.json();
            if (data.results?.[0]) {
               const result = data.results[0];
               const comps = result.address_components;
               if (!isCordobaArea(comps)) {
                 setToast("Por ahora solo aceptamos direcciones en Córdoba (Andalucía).");
                 setAddress('');
                 setLocationLabel('');
                 setCoords(null);
                 return;
               }
               setAddress(result.formatted_address.replace(', España', ''));
               const label = extractLocationLabelFromComponents(comps);
               setLocationLabel(label || '');
            } else {
               const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
               setAddress(fallback);
               setLocationLabel('');
            }
        } else {
            // Sin API key de Google, mantenemos funcionalidad mínima con coordenadas.
            const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            setAddress(fallback);
            setLocationLabel('');
        }
    } catch (error: any) {
      const code = error?.code || error?.message;
      if (typeof code === 'string' && code.includes('timeout')) {
        setToast('No se pudo obtener la ubicación a tiempo. Intenta de nuevo cerca de una ventana o con el GPS activado.');
      } else {
        setToast("No se pudo obtener la ubicación.");
      }
    } finally { setLoading(false); }
  };

  const handleAddressSelect = async (value: { label: string; value: string } | null) => {
    if (!value) { setAddress(''); setLocationLabel(''); setCoords(null); return; }
    setAddress(value.label);
    // Priorizamos exactamente lo elegido en el selector (barrio/zona incluida)
    // para no degradar a una ubicación genérica como "Córdoba (España)".
    setLocationLabel(value.label.replace(', España', ''));
    try {
      const results = await geocodeByAddress(value.label);
      const result = results[0];
      const comps = (result as any).address_components;
      if (!isCordobaArea(comps)) {
        setToast("Por ahora solo aceptamos direcciones en Córdoba (Andalucía).");
        setAddress('');
        setLocationLabel('');
        setCoords(null);
        return;
      }
      const { lat, lng } = await getLatLng(result);
      setCoords({ lat, lng });
      // Mantenemos locationLabel basado en lo seleccionado por el usuario.
    } catch {
      // Fallos puntuales al resolver la dirección; el usuario puede seguir editando.
    }
  };

  const handleAddExtraMedia = (type: 'photo' | 'video' | 'audio', file: File) => {
    if (extraMedia.length >= MAX_EXTRA_MEDIA) {
      setToast(`Solo puedes añadir hasta ${MAX_EXTRA_MEDIA} archivos adicionales.`);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      // Reutilizamos los mismos límites básicos de tamaño/duración que en el resto de la app
      if (type === 'video' && file.size > 25 * 1024 * 1024) {
        setToast('El vídeo es demasiado pesado. Máximo 25MB.');
        return;
      }
      if (type === 'photo' && file.size > 10 * 1024 * 1024) {
        setToast('La imagen es demasiado pesada. Máximo 10MB.');
        return;
      }
      if (type === 'audio' && file.size > 10 * 1024 * 1024) {
        setToast('El audio es demasiado pesado. Máximo 10MB.');
        return;
      }
      setExtraMedia(prev => [...prev, { type, data: result }]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveExtraMedia = (index: number) => {
    setExtraMedia(prev => prev.filter((_, i) => i !== index));
  };

  // --- ANÁLISIS IA ---
  const handleAnalyze = async () => {
    // VALIDACIÓN SEGÚN MODO
    if (inputMode === 'AUDIO' && !audioBase64) {
        setToast("Por favor, graba un audio explicando el problema.");
        return;
    }
    if (inputMode === 'VIDEO' && !videoBase64) {
        setToast("Por favor, graba o sube un video.");
        return;
    }
    if (inputMode === 'TEXT' && !userDescription) {
        setToast("Por favor, escribe una descripción del problema.");
        return;
    }
    if (!address) {
        setToast("La dirección es obligatoria.");
        return;
    }

    const verification = getVerificationStatus();
    if (!verification?.canCreateRequest) {
      if (!verification?.hasClientPhone) {
        setToast(
          'Debes añadir y verificar tu número de teléfono en tu perfil antes de publicar una solicitud.',
        );
      } else {
        setToast(
          'Debes verificar tu número de teléfono en tu perfil antes de publicar una solicitud.',
        );
      }
      return;
    }

    setLoading(true);
    setLoadingMessage(
      inputMode === 'VIDEO'
        ? 'Subiendo vídeo y consultando a la IA… En 4G puede tardar varios minutos.'
        : inputMode === 'AUDIO' && audioBase64 && audioBase64.length > 2_500_000
          ? 'Subiendo audio… Puede tardar si la red es lenta.'
          : 'Consultando a la IA…',
    );
    let predictRequestId = '';
    try {
      const locationForAi = locationLabel || address;
      predictRequestId = `predict-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const predictAudio = inputMode === 'AUDIO' ? audioBase64 : null;
      const predictImage = inputMode === 'TEXT' ? photoBase64 : null;
      let predictVideo = inputMode === 'VIDEO' ? videoBase64 : null;
      const predictDescription = inputMode === 'TEXT' ? userDescription : '';

      let videoCompressMeta: {
        attempted: boolean;
        compressed: boolean;
        originalBytes: number;
        resultBytes: number;
      } | null = null;

      if (inputMode === 'VIDEO' && predictVideo) {
        const netHint = await getVideoUploadConnectionHint();
        const videoBytes = predictVideoPayloadDecodedBytes(predictVideo);
        const videoCompressClientOpts = Capacitor.isNativePlatform()
          ? {
              maxDecodedBytes:
                PREDICT_VIDEO_MAX_DECODED_BYTES_FOR_COMPRESS_NATIVE,
              maxDurationSec: PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC_NATIVE,
            }
          : {
              maxDecodedBytes:
                PREDICT_VIDEO_MAX_DECODED_BYTES_FOR_COMPRESS_DEFAULT,
              maxDurationSec: PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC,
            };
        const willTryCompress = shouldCompressVideoForUpload(
          netHint,
          videoBytes,
          videoCompressClientOpts,
        );
        setLoadingMessage(
          willTryCompress
            ? 'Optimizando vídeo para la red… Puede tardar un poco.'
            : 'Subiendo vídeo y consultando a la IA…',
        );
        const compressResult = await maybeCompressVideoDataUrlForPredict(
          predictVideo,
          netHint,
          videoCompressClientOpts,
        );
        predictVideo = compressResult.dataUrl;
        videoCompressMeta = {
          attempted: willTryCompress,
          compressed: compressResult.compressed,
          originalBytes: compressResult.originalBytes,
          resultBytes: compressResult.resultBytes,
        };
        if (compressResult.compressed) {
          setLoadingMessage('Consultando a la IA…');
        }
      }

      const getDataUrlMeta = (value: string | null) => {
        if (!value) return { mime: null as string | null, length: 0 };
        const mimeMatch = value.match(/^data:([^;]+);base64,/);
        return { mime: mimeMatch ? mimeMatch[1] : null, length: value.length };
      };
      const audioMeta = getDataUrlMeta(predictAudio);
      const imageMeta = getDataUrlMeta(predictImage);
      const videoMeta = getDataUrlMeta(predictVideo);

      Sentry.addBreadcrumb({
        category: 'predict',
        level: 'info',
        message: 'predict:start',
        data: {
          requestId: predictRequestId,
          inputMode,
          hasAudio: !!predictAudio,
          hasImage: !!predictImage,
          hasVideo: !!predictVideo,
          audioMime: audioMeta.mime,
          imageMime: imageMeta.mime,
          videoMime: videoMeta.mime,
          audioLength: audioMeta.length,
          imageLength: imageMeta.length,
          videoLength: videoMeta.length,
          locationLength: locationForAi.length,
          predictTimeoutMs: PREDICT_REQUEST_TIMEOUT_MS,
          videoCompress: videoCompressMeta,
        },
      });

      const response = await api.post(
        '/predict',
        {
          description: predictDescription,
          image: predictImage,
          audio: predictAudio,
          video: predictVideo,
          location: locationForAi,
        },
        { timeout: PREDICT_REQUEST_TIMEOUT_MS },
      );
      
      const aiData = (response.data ?? {}) as Record<string, unknown>;
      Sentry.addBreadcrumb({
        category: 'predict',
        level: 'info',
        message: 'predict:response_received',
        data: {
          requestId: predictRequestId,
          status: response.status,
          topLevelKeys: Object.keys(aiData).slice(0, 12),
        },
      });
      const safeTitle = String(aiData.title ?? '').trim();
      const safeDescription = String(aiData.description ?? '').trim();
      const safeCategory = String(aiData.category ?? '').trim().toUpperCase();
      const safeFlagRaw = aiData.safe ?? aiData.is_safe;
      const isSafe = typeof safeFlagRaw === 'boolean'
        ? safeFlagRaw
        : String(safeFlagRaw ?? '').toLowerCase() === 'true';
      const safetyReasonRaw = aiData.safety_reason ?? aiData.reason ?? null;
      const safetyReason = typeof safetyReasonRaw === 'string' && safetyReasonRaw.trim() !== ''
        ? safetyReasonRaw.trim()
        : null;
      const textSnapshot = inputMode === 'TEXT' ? userDescription.trim() : '';

      // Normalizamos para que el formulario siempre quede relleno aunque Gemini devuelva
      // un payload parcial o con nombres distintos.
      setTitle(safeTitle || 'Solicitud pendiente de revisión');
      setTechDescription(safeDescription || 'Revisa y completa los detalles técnicos de tu solicitud.');
      setCategory(safeCategory || 'DIY');
      // No sustituir userDescription por summary_text: el texto del cliente se conserva para paso 2 y API.
      if (inputMode === 'TEXT') {
        setClientOriginalDescription(textSnapshot);
      } else {
        setClientOriginalDescription('');
      }

      const rawRisk = (aiData.risk_level || aiData.riskLevel || '').toString().toUpperCase();
      if (rawRisk === 'LOW' || rawRisk === 'MEDIUM' || rawRisk === 'HIGH') {
        setRiskLevel(rawRisk as 'LOW' | 'MEDIUM' | 'HIGH');
      } else {
        setRiskLevel(null);
      }
      
      const minCentsRaw = Number(aiData.estimated_price_min ?? aiData.estimatedPriceMin ?? 0);
      const maxCentsRaw = Number(aiData.estimated_price_max ?? aiData.estimatedPriceMax ?? 0);
      const minCents = Number.isFinite(minCentsRaw) ? Math.max(0, Math.round(minCentsRaw)) : 0;
      const maxCents = Number.isFinite(maxCentsRaw) ? Math.max(minCents, Math.round(maxCentsRaw)) : minCents;
      const aiClarifyingQuestions = Array.isArray(aiData.clarifying_questions)
        ? aiData.clarifying_questions
            .filter((q): q is string => typeof q === 'string' && q.trim() !== '')
            .map((q) => q.trim())
            .slice(0, 3)
        : [];
      setAiRange({ min: minCents, max: maxCents });
      setAiDiagnosis({
        ...aiData,
        safe: isSafe,
        safety_reason: safetyReason,
        estimated_price_min: minCents,
        estimated_price_max: maxCents,
        clarifying_questions: aiClarifyingQuestions,
      });
      setClarifyingQuestions(aiClarifyingQuestions);
      setClarifyingAnswers(aiClarifyingQuestions.map(() => ''));
      Sentry.addBreadcrumb({
        category: 'predict',
        level: 'info',
        message: 'predict:parsed_ok',
        data: {
          requestId: predictRequestId,
          safe: isSafe,
          safetyReason,
          titleFilled: (safeTitle || '').length > 0,
          descriptionFilled: (safeDescription || '').length > 0,
          categoryFilled: (safeCategory || '').length > 0,
          minCents,
          maxCents,
          clarifyingQuestionsCount: aiClarifyingQuestions.length,
        },
      });
      
      if (aiData.urgency === 'SCHEDULED' && aiData.schedule_intent) {
        setToast(`📅 Fecha aproximada detectada: "${aiData.schedule_intent}". Podrás ajustar tu disponibilidad preferida en el siguiente paso.`);
      }
      setStep(2);
    } catch (error: unknown) {
      const anyErr = error as { response?: { status?: number; data?: Record<string, unknown> }; message?: string };
      const status = anyErr?.response?.status;
      const errData = anyErr?.response?.data ?? {};
      const axiosHint = axiosErrorUserHint(error);
      const isLikelyUploadOrServerCut =
        isAxiosError(error) &&
        !error.response &&
        (error.code === 'ERR_NETWORK' ||
          error.message === 'Network Error' ||
          error.code === 'ECONNABORTED');
      const videoNetworkHint =
        inputMode === 'VIDEO' && isLikelyUploadOrServerCut
          ? 'No se pudo completar la subida del vídeo (red lenta o tiempo agotado). Prueba con Wi‑Fi, acerca el móvil a la router o usa un vídeo más corto.'
          : undefined;
      const msg =
        (errData.violations as Array<{ message?: string }>)?.[0]?.message
        ?? (errData.error as string)
        ?? (errData['hydra:description'] as string)
        ?? (errData.detail as string)
        ?? videoNetworkHint
        ?? axiosHint
        ?? anyErr?.message
        ?? 'Error en el análisis.';
      const axiosDebug = buildAxiosErrorReport(error);
      Sentry.captureException(error, {
        tags: {
          feature: 'predict',
          ...(axiosDebug.noResponseLikelyNetwork
            ? { httpResponse: 'none' }
            : {}),
        },
        extra: {
          predictRequestId,
          status,
          responseKeys: Object.keys(errData).slice(0, 12),
          inputMode,
          hasAudio: inputMode === 'AUDIO' && !!audioBase64,
          hasImage: inputMode === 'TEXT' && !!photoBase64,
          hasVideo: inputMode === 'VIDEO' && !!videoBase64,
          locationLength: (locationLabel || address).length,
          axios: axiosDebug,
        },
      });
      setToast(msg);
    } finally { setLoading(false); }
  };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    const verification = getVerificationStatus();
    if (!verification?.canCreateRequest) {
      if (!verification?.hasClientPhone) {
        setToast("Debes añadir y verificar tu número de teléfono en tu perfil antes de publicar una solicitud.");
      } else {
        setToast("Debes verificar tu número de teléfono en tu perfil antes de publicar una solicitud.");
      }
      persistDraftSnapshot();
      router.push('/profile');
      return;
    }
    if (!title || !address) {
      setToast('Faltan datos obligatorios.');
      return;
    }
    if (!aiRange || typeof aiRange.min !== 'number' || typeof aiRange.max !== 'number') {
      setToast('No hay estimación de precio para tu zona. Vuelve al paso anterior y analiza de nuevo.');
      return;
    }
    if (clarifyingQuestions.length > 0) {
      const hasMissingAnswer = clarifyingQuestions.some((_, idx) => {
        const answer = clarifyingAnswers[idx] ?? '';
        return answer.trim() === '';
      });
      if (hasMissingAnswer) {
        setToast('Responde todas las preguntas de la IA antes de publicar.');
        return;
      }
    }
    
    let finalCoords: { lat: number; lng: number };
    if (!coords && address) {
      try {
        const results = await geocodeByAddress(address);
        const { lat, lng } = await getLatLng(results[0]);
        finalCoords = { lat, lng };
      } catch (_e) {
        setToast('Dirección no válida.');
        return;
      }
    } else {
      finalCoords = coords!;
    }

    setLoading(true);
    setLoadingMessage('Subiendo archivos...');
    try {
      let photoUrl: string | null = null;
      let audioUrl: string | null = null;
      let videoUrl: string | null = null;

      if (inputMode === 'TEXT' && photoBase64) {
        photoUrl = await uploadRequestMediaWithTicket(photoBase64, 'photo');
      }
      if (inputMode === 'AUDIO' && audioBase64) {
        audioUrl = await uploadRequestMediaWithTicket(audioBase64, 'audio');
      }
      if (inputMode === 'VIDEO' && videoBase64) {
        videoUrl = await uploadRequestMediaWithTicket(videoBase64, 'video');
      }

      const extraPhotoUrls: string[] = [];
      const extraAudioUrls: string[] = [];
      const extraVideoUrls: string[] = [];
      for (const m of extraMedia) {
        if (m.type === 'photo') {
          const url = await uploadRequestMediaWithTicket(m.data, 'photo');
          extraPhotoUrls.push(url);
        } else if (m.type === 'audio') {
          const url = await uploadRequestMediaWithTicket(m.data, 'audio');
          extraAudioUrls.push(url);
        } else if (m.type === 'video') {
          const url = await uploadRequestMediaWithTicket(m.data, 'video');
          extraVideoUrls.push(url);
        }
      }

      const descriptionWithClarifications = (() => {
        if (clarifyingQuestions.length === 0) {
          return techDescription;
        }

        const lines = clarifyingQuestions.map((question, idx) => {
          const answer = (clarifyingAnswers[idx] ?? '').trim();
          return `- ${question}: ${answer}`;
        });

        return `${techDescription}\n\nAclaraciones del cliente:\n${lines.join('\n')}`;
      })();

      const payload: Record<string, unknown> = {
        title,
        description: descriptionWithClarifications,
        category,
        address,
        status: 'PENDING',
        locationPoint: { type: 'Point', coordinates: [finalCoords.lng, finalCoords.lat] },
        aiDiagnosis: aiDiagnosis ?? {
          safe: true,
          safety_reason: null,
          estimated_price_min: aiRange.min,
          estimated_price_max: aiRange.max,
          clarifying_questions: clarifyingQuestions,
          min: aiRange.min,
          max: aiRange.max,
        },
        estimatedPriceMin: aiRange.min,
        estimatedPriceMax: aiRange.max,
        desiredExecutionTime,
      };
      if (clientOriginalDescription.trim()) {
        payload.clientOriginalDescription = clientOriginalDescription.trim();
      }
      if (riskLevel) {
        // El backend persiste este campo como risk_level en base de datos
        (payload as any).riskLevel = riskLevel;
      }
      if (clarifyingQuestions.length > 0) {
        (payload.aiDiagnosis as Record<string, unknown>).clarifying_questions = clarifyingQuestions;
        (payload.aiDiagnosis as Record<string, unknown>).clarifying_answers = clarifyingAnswers.map((a) => a.trim());
      }
      if (photoUrl) payload.photoUrl = photoUrl;
      if (audioUrl) payload.audioUrl = audioUrl;
      if (videoUrl) payload.videoUrl = videoUrl;
      if (extraPhotoUrls.length) payload.extraPhotoUrls = extraPhotoUrls;
      if (extraAudioUrls.length) payload.extraAudioUrls = extraAudioUrls;
      if (extraVideoUrls.length) payload.extraVideoUrls = extraVideoUrls;

      await api.post('/requests', payload);
      try {
        sessionStorage.removeItem(NEW_REQUEST_DRAFT_KEY);
      } catch {
        /* ignorar */
      }
      setToast("¡Publicado correctamente!");
      // Navegamos al listado de solicitudes del cliente tras publicar
      setTimeout(() => router.push('/request-list'), 800); 
    } catch (error: unknown) {
        const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data ?? {};
        const msg = (data.violations as Array<{ message?: string }>)?.[0]?.message ?? (data['hydra:description'] as string) ?? (data.detail as string);
        setToast(msg || "Error al guardar.");
    } finally { setLoading(false); }
  };

  const verificationStatus = getVerificationStatus();
  const showPhoneVerificationGate = Boolean(
    verificationStatus && !verificationStatus.canCreateRequest,
  );

  const goToProfileForPhone = () => {
    persistDraftSnapshot();
    router.push('/profile');
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border new-request-header">
        <IonToolbar color="primary" style={{ '--padding-top': '10px' }}>
          <IonTitle className="ion-text-center">
            <div className="brand-container">
              <span className="brand-text-main">Qu</span>
              <span className="brand-text-secondary">i</span>
              <span className="brand-text-main">r</span>
              <span className="brand-text-secondary">a</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{'--background': '#f8fafc'}}>
        <>
        <div className="new-request-header-bg animate__animated animate__fadeIn">
            <h2>{step === 1 ? 'Nueva Solicitud' : 'Revisar Datos'}</h2>
            <p>{step === 1 ? 'Elige cómo quieres contárnoslo' : 'Confirma los detalles'}</p>
        </div>

        <div className="ion-padding-horizontal" style={{ marginTop: '5px' }}>
            {step === 1 && (
                <div className="animate__animated animate__fadeIn">
                    <NewRequestModeSelector value={inputMode} onChange={handleModeChange} />

                    {showPhoneVerificationGate && (
                      <div
                        className="new-request-phone-gate"
                        role="status"
                        aria-label="Verificación de teléfono requerida para publicar"
                      >
                        <p>
                          {verificationStatus?.hasClientPhone
                            ? 'Para publicar solicitudes necesitas verificar tu número de teléfono en Perfil.'
                            : 'Para publicar solicitudes añade y verifica tu número de teléfono en Perfil.'}
                        </p>
                        <IonButton
                          fill="outline"
                          size="small"
                          expand="block"
                          className="new-request-phone-gate__cta"
                          onClick={goToProfileForPhone}
                        >
                          Ir a Perfil
                        </IonButton>
                      </div>
                    )}
                    
                    {inputMode === 'AUDIO' && (
                        <NewRequestInputAudio
                            audioBase64={audioBase64}
                            isRecording={isRecording}
                            isPlayingAudio={isPlayingAudio}
                            audioDuration={audioDuration}
                            onStartRecording={startRecording}
                            onStopRecording={stopRecording}
                            onOpenOptions={() => setMediaPickerType('audio')}
                            onPlayPreview={playAudioPreview}
                            onDelete={deleteAudio}
                        />
                    )}

                    {inputMode === 'VIDEO' && (
                        <>
                        {(videoUploadNetworkHint === 'cellular' ||
                          videoUploadNetworkHint === 'slow_or_unreliable') && (
                          <div
                            className="new-request-video-network-hint"
                            role="status"
                          >
                            <p>
                              {videoUploadNetworkHint === 'cellular'
                                ? 'Estás usando datos móviles. Subir el vídeo puede tardar varios minutos y la red puede ser menos estable que con Wi‑Fi. Si puedes, conéctate a Wi‑Fi antes de analizar.'
                                : 'Tu conexión parece lenta o poco estable. El vídeo puede tardar mucho en subir o fallar; Wi‑Fi suele ir mejor.'}
                            </p>
                          </div>
                        )}
                        <NewRequestInputVideo
                            videoBase64={videoBase64}
                            onOpenOptions={() => setMediaPickerType('video')}
                            onFileSelect={handleVideoFile}
                            onDelete={deleteVideo}
                            inputRef={videoInputRef}
                        />
                        </>
                    )}

                    {inputMode === 'TEXT' && (
                        <NewRequestInputText
                            photoBase64={photoBase64}
                            userDescription={userDescription}
                            onOpenPhotoOptions={() => setMediaPickerType('photo')}
                            onDescriptionChange={setUserDescription}
                            onDeletePhoto={() => setPhotoBase64(null)}
                        />
                    )}

                    <NewRequestLocation
                        address={address}
                        onAddressSelect={handleAddressSelect}
                        googleApiKey={GOOGLE_API_KEY || ''}
                    />

                    <IonButton expand="block" className="quira-main-btn" onClick={handleAnalyze} style={{marginBottom: '30px'}}>
                        <IonIcon slot="start" icon={colorWandOutline} />
                        ANALIZAR Y COTIZAR
                    </IonButton>
                </div>
            )}

            {step === 2 && (
                <NewRequestStep2Form
                    title={title}
                    techDescription={techDescription}
                    clientOriginalDescription={clientOriginalDescription}
                    category={category}
                    onCategoryChange={setCategory}
                    aiRange={aiRange}
                    aiDiagnosis={aiDiagnosis}
                    riskLevel={riskLevel || undefined}
                    desiredExecutionTime={desiredExecutionTime}
                    photoBase64={photoBase64}
                    audioBase64={audioBase64}
                    videoBase64={videoBase64}
                    extraMedia={extraMedia}
                    maxExtraMedia={MAX_EXTRA_MEDIA}
                    onAddExtraMedia={handleAddExtraMedia}
                    onRemoveExtraMedia={handleRemoveExtraMedia}
                    onTitleChange={setTitle}
                    onTechDescriptionChange={setTechDescription}
                    onDesiredExecutionTimeChange={setDesiredExecutionTime}
                    clarifyingQuestions={clarifyingQuestions}
                    clarifyingAnswers={clarifyingAnswers}
                    onClarifyingAnswerChange={(index, value) => {
                      setClarifyingAnswers((prev) => {
                        const next = [...prev];
                        next[index] = value;
                        return next;
                      });
                    }}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
        </>

        <input
          id="step1-audio-file-input"
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={handleSelectAudioFile}
        />

        <IonActionSheet
          isOpen={mediaPickerType !== null}
          onDidDismiss={() => setMediaPickerType(null)}
          header={
            mediaPickerType === 'photo'
              ? 'Añadir foto'
              : mediaPickerType === 'video'
              ? 'Añadir vídeo'
              : 'Añadir audio'
          }
          buttons={[
            {
              text:
                mediaPickerType === 'photo'
                  ? 'Hacer foto'
                  : mediaPickerType === 'video'
                  ? 'Grabar vídeo'
                  : 'Grabar audio',
              handler: () => {
                if (mediaPickerType === 'photo') {
                  takePhoto();
                } else if (mediaPickerType === 'video') {
                  triggerVideoInput();
                } else if (mediaPickerType === 'audio') {
                  if (isRecording) {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                }
              },
            },
            {
              text: 'Elegir de la galería',
              handler: () => {
                if (mediaPickerType === 'photo') {
                  Camera.getPhoto({
                    quality: 80,
                    allowEditing: false,
                    resultType: CameraResultType.DataUrl,
                    source: CameraSource.Photos,
                  })
                    .then((image) => {
                      setPhotoBase64(image.dataUrl || null);
                    })
                    .catch(() => {});
                } else if (mediaPickerType === 'video') {
                  triggerVideoInput();
                } else if (mediaPickerType === 'audio') {
                  triggerMediaInput('audio');
                }
              },
            },
            {
              text: 'Cancelar',
              role: 'cancel',
            },
          ]}
        />

        <IonLoading isOpen={loading} message={loadingMessage} spinner="crescent" />
        <IonToast isOpen={!!toast} message={toast || ''} duration={TOAST_DURATION_MS} onDidDismiss={() => setToast(null)} position="top" color="dark" style={{'--border-radius': '12px'}} />
      </IonContent>
    </IonPage>
  );
};

export default NewRequest;