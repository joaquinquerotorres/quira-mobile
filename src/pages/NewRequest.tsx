import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonButton, IonIcon, IonLoading, IonToast, useIonRouter, IonActionSheet,
} from '@ionic/react';
import { colorWandOutline, imagesOutline, micOutline, videocamOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { VoiceRecorder, RecordingData } from 'capacitor-voice-recorder';
import { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import api from '../api/axios';
import './NewRequest.css';
import '../components/layout/LogoHeader.css';
import { NewRequestModeSelector } from '../components/newrequest/NewRequestModeSelector';
import { NewRequestInputAudio } from '../components/newrequest/NewRequestInputAudio';
import { NewRequestInputVideo } from '../components/newrequest/NewRequestInputVideo';
import { NewRequestInputText } from '../components/newrequest/NewRequestInputText';
import { NewRequestLocation } from '../components/newrequest/NewRequestLocation';
import { NewRequestStep2Form } from '../components/newrequest/NewRequestStep2Form';

import { env } from '../config/env';
import { getVerificationStatus } from '../hooks/useUserVerification';
import { uploadRequestMediaWithTicket } from '../services/uploadService';

const GOOGLE_API_KEY = env.googleMapsKey;

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
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [aiRange, setAiRange] = useState<{min: number, max: number} | null>(null);
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH' | null>(null);
  const [desiredExecutionTime, setDesiredExecutionTime] = useState<string>('Lo antes posible');

  const [address, setAddress] = useState<string>('');
  const [locationLabel, setLocationLabel] = useState<string>('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // Media extra opcional en step 2 (máx 3 elementos)
  const [extraMedia, setExtraMedia] = useState<Array<{ type: 'photo' | 'video' | 'audio'; data: string }>>([]);
  const MAX_EXTRA_MEDIA = 3;

  useEffect(() => {
    VoiceRecorder.requestAudioRecordingPermission();
  }, []);

  // --- LIMPIEZA AL CAMBIAR MODO ---
  const handleModeChange = (mode: 'AUDIO' | 'VIDEO' | 'TEXT') => {
      setInputMode(mode);
      // Opcional: Limpiar los otros estados si quieres que sean exclusivos
      // setAudioBase64(null); setVideoBase64(null); setUserDescription(''); setPhotoBase64(null);
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
            const mimeType =
              (result.value as RecordingData['value'] & { mimeType?: string })?.mimeType ||
              'audio/webm';
            setAudioBase64(`data:${mimeType};base64,${result.value.recordDataBase64}`);
            setAudioDuration(result.value.msDuration / 1000);
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
    setAudioBase64(null);
    setAudioDuration(0);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsPlayingAudio(false);
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
      const label = extractLocationLabelFromComponents(comps);
      if (label) {
        setLocationLabel(label);
      } else {
        // Fallback: intenta quedarse con la parte de ciudad/pueblo antes de la primera coma
        const simple = value.label.split(',')[0]?.trim();
        setLocationLabel(simple || '');
      }
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

    setLoading(true);
    setLoadingMessage('Consultando a la IA...');
    try {
      const locationForAi = locationLabel || address;
      const response = await api.post('/predict', { 
          description: userDescription, 
          image: photoBase64,
          audio: audioBase64, 
          location: locationForAi 
      });
      
      const aiData = response.data;
      setTitle(aiData.title);
      setTechDescription(aiData.description);
      setCategory(aiData.category);
      if (aiData.summary_text) setUserDescription(aiData.summary_text);
      const rawRisk = (aiData.risk_level || aiData.riskLevel || '').toString().toUpperCase();
      if (rawRisk === 'LOW' || rawRisk === 'MEDIUM' || rawRisk === 'HIGH') {
        setRiskLevel(rawRisk as 'LOW' | 'MEDIUM' | 'HIGH');
      } else {
        setRiskLevel(null);
      }
      
      const minEuros = Math.round(aiData.estimated_price_min / 100);
      const maxEuros = Math.round(aiData.estimated_price_max / 100);
      setPrice(minEuros);
      setAiRange({ min: minEuros, max: maxEuros });
      
      if (aiData.urgency === 'SCHEDULED' && aiData.schedule_intent) {
        setToast(`📅 Fecha aproximada detectada: "${aiData.schedule_intent}". Podrás ajustar tu disponibilidad preferida en el siguiente paso.`);
      }
      setStep(2);
    } catch (error) { console.error(error); setToast("Error en el análisis."); } finally { setLoading(false); }
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
      router.push('/profile');
      return;
    }
    if (!title || !price || !address) { setToast("Faltan datos obligatorios."); return; }

    // Validación: precio no puede ser inferior al mínimo sugerido por la IA
    if (aiRange && typeof price === 'number' && price < aiRange.min) {
      setToast(`El precio no puede ser inferior a ${aiRange.min}€.`);
      return;
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

      if (photoBase64) photoUrl = await uploadRequestMediaWithTicket(photoBase64, 'photo');
      if (audioBase64) audioUrl = await uploadRequestMediaWithTicket(audioBase64, 'audio');
      if (videoBase64) videoUrl = await uploadRequestMediaWithTicket(videoBase64, 'video');

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

      const payload: Record<string, unknown> = {
        title,
        description: techDescription,
        priceAmount: Number(price),
        category,
        address,
        status: 'PENDING',
        locationPoint: { type: 'Point', coordinates: [finalCoords.lng, finalCoords.lat] },
        aiDiagnosis: aiRange,
        desiredExecutionTime,
      };
      if (riskLevel) {
        // El backend persiste este campo como risk_level en base de datos
        (payload as any).riskLevel = riskLevel;
      }
      if (photoUrl) payload.photoUrl = photoUrl;
      if (audioUrl) payload.audioUrl = audioUrl;
      if (videoUrl) payload.videoUrl = videoUrl;
      if (extraPhotoUrls.length) payload.extraPhotoUrls = extraPhotoUrls;
      if (extraAudioUrls.length) payload.extraAudioUrls = extraAudioUrls;
      if (extraVideoUrls.length) payload.extraVideoUrls = extraVideoUrls;

      await api.post('/requests', payload);
      setToast("¡Publicado correctamente!");
      // Navegamos al listado de solicitudes del cliente tras publicar
      setTimeout(() => router.push('/request-list'), 800); 
    } catch (error: unknown) {
        const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data ?? {};
        const msg = (data.violations as Array<{ message?: string }>)?.[0]?.message ?? (data['hydra:description'] as string) ?? (data.detail as string);
        setToast(msg || "Error al guardar.");
    } finally { setLoading(false); }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border new-request-header">
        <IonToolbar color="primary" style={{ '--padding-top': '10px' }}>
          <IonTitle className="ion-text-center">
            <div className="brand-container">
              <span className="brand-text-main">Qu</span>
              <div className="brand-dot-container">
                <span className="brand-text-main">i</span>
                <div className="brand-smart-dot"></div>
              </div>
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
                        <NewRequestInputVideo
                            videoBase64={videoBase64}
                            onOpenOptions={() => setMediaPickerType('video')}
                            onFileSelect={handleVideoFile}
                            onDelete={deleteVideo}
                            inputRef={videoInputRef}
                        />
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
                    price={price}
                    aiRange={aiRange}
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
                    onPriceChange={setPrice}
                    onDesiredExecutionTimeChange={setDesiredExecutionTime}
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
        <IonToast isOpen={!!toast} message={toast || ''} duration={2500} onDidDismiss={() => setToast(null)} position="top" color="dark" style={{'--border-radius': '12px'}} />
      </IonContent>
    </IonPage>
  );
};

export default NewRequest;