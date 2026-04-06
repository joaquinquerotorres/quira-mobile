import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonContent,
  IonLoading, IonToast, IonIcon, IonButton,
  useIonRouter, IonAvatar, IonTitle, IonLabel,
  IonInput, IonModal, IonTextarea, IonBadge, IonAlert,
  IonActionSheet,
} from '@ionic/react';
import { useParams } from 'react-router';
import { 
  locationOutline, checkmarkCircle, calendarOutline, chevronBackOutline,
  star, flashOutline, navigateOutline, closeOutline,
  lockClosedOutline, informationCircleOutline, checkmarkDoneOutline,
  callOutline,
  chatboxEllipsesOutline, chevronForwardOutline, helpCircleOutline,
  cameraOutline, videocamOutline, trashOutline, alertCircleOutline,
} from 'ionicons/icons';
import GooglePlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import api from '../api/axios';
import { Bid, ServiceRequest } from '../types';
import './RequestDetail.css'; 
import { RequestDetailMedia } from '../components/request/RequestDetailMedia';
import { RequestDetailMainSection } from '../components/request/RequestDetailMainSection';

import { env } from '../config/env';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { uploadRequestMediaWithTicket } from '../services/uploadService';
import { getApiErrorMessage } from '../utils/apiError';
import { notifyRequestsInvalidated } from '../utils/requestEvents';
import { streetLineFromGeocode } from '../utils/streetLineFromGeocode';

const serverUrl = env.serverUrl;
const GOOGLE_API_KEY = env.googleMapsKey; 

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useIonRouter();
  
  // --- ESTADOS PRINCIPALES ---
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // --- ESTADOS DIRECCIÓN Y MODALES ---
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);
  const [googleAddress, setGoogleAddress] = useState(''); 
  const [addressDetails, setAddressDetails] = useState('');
  const [newCoords, setNewCoords] = useState<{lat: number, lng: number} | null>(null);
  const [resetKey, setResetKey] = useState(0);

  // --- ESTADOS REVIEWS ---
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  // --- ESTADOS AUDIO ---
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- ESTADOS Q&A ---
  const [showQAModal, setShowQAModal] = useState(false); 
  const [replyText, setReplyText] = useState('');
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [answerMediaFiles, setAnswerMediaFiles] = useState<File[]>([]);
  const [answerPickerType, setAnswerPickerType] = useState<'photo' | 'video' | null>(null);
  const [qLoading, setQLoading] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [requestUnavailable, setRequestUnavailable] = useState(false);

  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('No se pudo leer el archivo'));
      };
      reader.onerror = () => reject(reader.error || new Error('Error leyendo archivo'));
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
    }
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      setRequestUnavailable(false);
      const response = await api.get(`/requests/${id}`);
      const data = response.data;
      setRequest(data);
      
      if (data.status === 'COMPLETED') {
        const userStr = localStorage.getItem('user');
        const userId = userStr ? JSON.parse(userStr).id : null;
        if (userId) {
          const reviewRes = await api.get(`/reviews`, {
            params: { request: `/api/requests/${id}`, author: `/api/users/${userId}` }
          });
          const reviews = reviewRes.data['hydra:member'] || reviewRes.data['member'] || [];
          if (reviews.length > 0) setHasReviewed(true);
          else setShowReviewModal(true);
        }
      }
    } catch (error) {
      console.error(error);
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setRequest(null);
        setRequestUnavailable(true);
        return;
      }
      setToast("Error cargando el detalle.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA Q&A ---
  const handleOpenQAModal = async () => {
    setShowQAModal(true);
    // Si el request no trae questions embebidas, las fetchamos
    if (request && (!request.questions || request.questions.length === 0)) {
      try {
        const qRes = await api.get(`/request_questions`, {
          params: { request: `/api/requests/${id}` },
        });
        const questions = qRes.data['hydra:member'] || qRes.data['member'] || [];
        setRequest((prev) => (prev ? { ...prev, questions } : prev));
      } catch {
        // Si falla, la modal ya está abierta; el usuario verá "Aún no tienes preguntas"
      }
    }
  };

  const handleAnswerQuestion = async (questionId: number) => {
    if (!replyText.trim()) {
      setToast('Por favor, escribe una respuesta antes de publicar.');
      return;
    }
    setQLoading(true);
    try {
      let answerMediaUrls: string[] = [];
      if (answerMediaFiles.length > 0) {
        const uploads = await Promise.all(
          answerMediaFiles.map(async (file) => {
            const dataUrl = await fileToDataUrl(file);
            const isVideo = file.type.startsWith('video/');
            const type = isVideo ? 'video' : 'photo';
            return uploadRequestMediaWithTicket(dataUrl, type as 'photo' | 'video');
          })
        );
        answerMediaUrls = uploads.filter(Boolean);
      }

      const payload: any = { answerText: replyText };
      if (answerMediaUrls.length > 0) {
        payload.answerMediaUrls = answerMediaUrls;
      }

      await api.patch(`/request_questions/${questionId}`, payload, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      });

      setReplyText('');
      setAnsweringId(null);
      setAnswerMediaFiles([]);
      setToast('Respuesta publicada.');
      fetchDetail();
    } catch (error: any) {
      const msg =
        error.response?.data?.violations?.[0]?.message || 'Error al enviar respuesta.';
      setToast(msg);
    } finally {
      setQLoading(false);
    }
  };

  const pushAnswerFiles = (files: File[]) => {
    if (!files.length) return;
    setAnswerMediaFiles((prev) => {
      const remaining = 3 - prev.length;
      if (remaining <= 0) return prev;
      const toAdd = files.slice(0, remaining);
      return [...prev, ...toAdd];
    });
  };

  const handleTakeAnswerPhoto = async () => {
    try {
      if (answerMediaFiles.length >= 3) return;
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      if (!image.dataUrl) return;
      const dataUrl = image.dataUrl;
      const arr = dataUrl.split(',');
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch && mimeMatch[1] ? mimeMatch[1] : 'image/jpeg';
      const bstr = atob(arr[1]);
      const len = bstr.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        u8[i] = bstr.charCodeAt(i);
      }
      const file = new File([u8], `answer-photo-${Date.now()}.jpg`, { type: mime });
      pushAnswerFiles([file]);
    } catch {
      // usuario canceló o error: no hacemos nada
    } finally {
      setAnswerPickerType(null);
    }
  };

  // --- ACCIONES GENERALES ---
  const toggleAudio = (url: string) => {
      if (!audioRef.current) {
          audioRef.current = new Audio(resolveMediaUrl(url));
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

  const handleCallProfessional = () => {
      const phone = request?.assignedProfessional?.phoneNumber;
      if (phone) {
          window.open(`tel:${phone}`, '_system');
      } else {
          setToast("El profesional no tiene un teléfono de contacto visible.");
      }
  };

  const handleCallVisitProfessional = (phone: string) => {
      if (phone) {
          window.open(`tel:${phone}`, '_system');
      } else {
          setToast("Este profesional no tiene un teléfono de contacto visible.");
      }
  };

  const handleAcceptVisit = async () => {
      const visit = request?.visitRequests?.[0];
      if (!visit?.id) return;
      setActionLoading(true);
      try {
          await api.post(`/visit-requests/${visit.id}/accept`);
          setToast('Has aceptado la visita de valoración.');
          fetchDetail();
      } catch (error: any) {
          const msg =
            error.response?.data?.violations?.[0]?.message ||
            error.response?.data?.message ||
            'Error al aceptar la visita de valoración.';
          setToast(msg);
      } finally {
          setActionLoading(false);
      }
  };

  const handleRejectVisit = async () => {
      const visit = request?.visitRequests?.[0];
      if (!visit?.id) return;
      setActionLoading(true);
      try {
          await api.post(`/visit-requests/${visit.id}/reject`);
          setToast('Has rechazado la visita de valoración.');
          fetchDetail();
      } catch (error: any) {
          const msg =
            error.response?.data?.violations?.[0]?.message ||
            error.response?.data?.message ||
            'Error al rechazar la visita de valoración.';
          setToast(msg);
      } finally {
          setActionLoading(false);
      }
  };

  const handleOpenAcceptModal = (bidId: number) => {
      setSelectedBidId(bidId);
      const current = request?.preciseAddress || request?.address || '';
      setGoogleAddress(current.split(',')[0]); 
      setAddressDetails(''); 
      setNewCoords(null);
      setResetKey(prev => prev + 1);
      setShowAddressModal(true);
  };

  const handleGoogleSelect = (option: any) => {
      if (!option) return;
      const fullAddress = option.label;

      geocodeByAddress(fullAddress)
        .then(results => {
          const result = results[0];
          const comps = (result as any).address_components;
          const get = (type: string) =>
            comps.find((c: any) => c.types?.includes(type))?.long_name as string | undefined;
          const province =
            get('administrative_area_level_2') ||
            get('administrative_area_level_1');
          const country = get('country');
          const isSpain = country === 'España' || country === 'Spain';
          const isCordoba =
            province === 'Córdoba' ||
            province === 'Cordoba';
          if (!(isSpain && isCordoba)) {
            setToast("Por ahora solo aceptamos direcciones en Córdoba (Andalucía).");
            setGoogleAddress('');
            setNewCoords(null);
            setResetKey(prev => prev + 1);
            return;
          }
          setGoogleAddress(streetLineFromGeocode(fullAddress, result as any));
          setTimeout(() => setResetKey(prev => prev + 1), 50);
          return getLatLng(result);
        })
        .then(coords => {
          if (!coords) return;
          const { lat, lng } = coords;
          setNewCoords({ lat, lng });
        })
        .catch(error => console.error('Error geocodificando:', error));
  };

  const confirmHireProfessional = async () => {
      if (!selectedBidId || !googleAddress.trim()) {
          setToast("Por favor, indica la dirección de la calle.");
          return;
      }
      const finalPreciseAddress = addressDetails.trim() 
          ? `${googleAddress} - ${addressDetails.trim()}`
          : googleAddress;

      setActionLoading(true);
      try {
          const bid = request?.bids.find(b => b.id === selectedBidId);
          const proIri = bid?.professional?.professionalProfile?.['@id'];

          const payload: any = {
              preciseAddress: finalPreciseAddress,
              status: 'ACCEPTED',
              assignedProfessional: proIri
          };

          if (newCoords) {
              payload.locationPoint = { type: 'Point', coordinates: [newCoords.lng, newCoords.lat] };
          }

          await api.patch(`/requests/${id}`, payload, { headers: { 'Content-Type': 'application/merge-patch+json' } });
          await api.patch(`/bids/${selectedBidId}/accept`, {}, { headers: { 'Content-Type': 'application/merge-patch+json' } });
          
          setToast("¡Profesional contratado!");
          setShowAddressModal(false);
          fetchDetail();
      } catch (error) {
          setToast("Error al procesar la contratación.");
      } finally {
          setActionLoading(false);
      }
  };

   const submitReview = async () => {
        if (!request?.assignedProfessional || !request.bids) return;
        try {
            const winningBid = request.bids.find(b => b.professional?.professionalProfile?.id === request.assignedProfessional?.id);
            const userTargetIri = winningBid?.professional?.['@id']; 

            if (!userTargetIri) { setToast("Error localizando al profesional"); return; }

            await api.post('/reviews', {
                score: rating,
                comment: reviewComment,
                request: `/api/requests/${id}`,
                target: userTargetIri 
            });

            setToast("¡Gracias por tu valoración!");
            setHasReviewed(true);
            setShowReviewModal(false);
        } catch (error) {
            setToast("Error al enviar la valoración.");
        }
    };

  const canCancelRequest = request?.status === 'PENDING' && !request?.assignedProfessional;

  const handleCancelRequest = async () => {
    if (!id || !canCancelRequest) return;
    setCancelling(true);
    try {
      await api.delete(`/requests/${id}/cancel`);
      setRequest(null);
      setToast('Solicitud cancelada.');
      setShowCancelAlert(false);
      notifyRequestsInvalidated();
      router.push('/request-list');
    } catch (error: unknown) {
      setToast(getApiErrorMessage(error) || 'Error al cancelar la solicitud.');
    } finally {
      setCancelling(false);
    }
  };

  const getAddressDisplay = () => {
      if (!request) return { text: '', icon: locationOutline, isReal: false, label: '' };
      const isAssigned = request.status === 'ACCEPTED' || request.status === 'COMPLETED';
      if (isAssigned) {
          return { text: request.preciseAddress || request.address, icon: navigateOutline, isReal: true, label: 'Dirección Exacta' };
      } else {
          const parts = request.address.split(',');
          const approx = parts.length > 1 ? parts.slice(1).join(',').trim() : "Zona de servicio";
          return { text: `Zona: ${approx}`, icon: lockClosedOutline, isReal: false, label: 'Ubicación Aproximada' };
      }
  };

  if (loading) return <IonLoading isOpen={true} />;
  if (requestUnavailable) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          Esta solicitud ya no está disponible.
        </IonContent>
      </IonPage>
    );
  }
  if (!request) return <IonPage><IonContent className="ion-padding">Error cargando solicitud</IonContent></IonPage>;

  const addressDisplay = getAddressDisplay();
  const questionsCount = request.questions?.length || 0;
  const pendingAnswers = request.questions?.filter((q: any) => !q.answerText).length || 0;

  return (
    <IonPage>
      <IonHeader className="ion-no-border request-detail-header">
        <IonToolbar color="primary" style={{ '--padding-top': '10px' }}>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()} style={{color: 'white'}}>
                <IonIcon icon={chevronBackOutline} style={{fontSize: '24px'}} />
            </IonButton>
          </IonButtons>
          <IonTitle className="ion-text-center">
            <div className="brand-container">
              <span className="brand-text-main">Qu</span>
              <span className="brand-text-secondary">i</span>
              <span className="brand-text-main">r</span>
              <span className="brand-text-secondary">a</span>
            </div>
          </IonTitle>
          <IonButtons slot="end" style={{width: '48px'}}></IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <div className="request-detail-bg"></div>
        <div className="detail-content-wrapper animate__animated animate__fadeIn">
            {/* MULTIMEDIA */}
            <RequestDetailMedia
              request={request}
              isPlayingAudio={isPlayingAudio}
              onToggleAudio={toggleAudio}
            />

            <RequestDetailMainSection
              request={request}
              addressDisplay={addressDisplay}
              serverUrl={serverUrl}
              questionsCount={questionsCount}
              pendingAnswers={pendingAnswers}
              hasReviewed={hasReviewed}
              canCancelRequest={canCancelRequest}
              onCancelRequest={() => setShowCancelAlert(true)}
              onCallProfessional={handleCallProfessional}
              onCallVisitProfessional={handleCallVisitProfessional}
              onAcceptVisit={handleAcceptVisit}
              onRejectVisit={handleRejectVisit}
              onOpenReviewModal={() => setShowReviewModal(true)}
              onOpenQAModal={handleOpenQAModal}
              onOpenAcceptModal={handleOpenAcceptModal}
              onViewProfessional={(id) => router.push(`/directory/${id}`)}
              visitRequest={request.visitRequests?.[0]}
            />

            {canCancelRequest && (
              <div className="cancel-request-card">
                <div className="cancel-request-icon">
                  <IonIcon icon={alertCircleOutline} />
                </div>
                <div className="cancel-request-content">
                  <h3>Cancelar solicitud</h3>
                  <p>
                    Si ya no necesitas este trabajo o te has equivocado al crear la solicitud,
                    puedes cancelarla. Las ofertas recibidas dejarán de ser válidas.
                  </p>
                  <IonButton
                    expand="block"
                    color="danger"
                    className="cancel-request-btn"
                    onClick={() => setShowCancelAlert(true)}
                  >
                    Cancelar solicitud
                  </IonButton>
                </div>
              </div>
            )}
        </div>

        {/* MODAL DIRECCIÓN */}
        <IonModal isOpen={showAddressModal} onDidDismiss={() => setShowAddressModal(false)} initialBreakpoint={0.85} breakpoints={[0, 0.85, 1]}>
             <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle style={{fontWeight: 900}}>Dirección Exacta</IonTitle>
                    <IonButtons slot="end"><IonButton onClick={() => setShowAddressModal(false)}><IonIcon icon={closeOutline} /></IonButton></IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="address-modal-content">
                    <p className="address-modal-intro">Antes de confirmar, necesitamos la ubicación exacta para el profesional.</p>
                    <IonLabel className="section-label">Calle y número</IonLabel>
                    <div className="input-wrapper address-modal-field address-modal-google">
                        <GooglePlacesAutocomplete
                            key={resetKey}
                            apiKey={GOOGLE_API_KEY}
                            selectProps={{
                                inputValue: googleAddress,
                                onInputChange: (v, m) => m.action === 'input-change' && setGoogleAddress(v),
                                onChange: handleGoogleSelect,
                                placeholder: 'Buscar calle...',
                                menuPortalTarget: typeof document !== 'undefined' ? document.body : undefined,
                                menuPosition: 'fixed',
                                styles: {
                                    container: (base: any) => ({ ...base, width: '100%' }),
                                    control: (base: any) => ({
                                        ...base,
                                        width: '100%',
                                        minHeight: 52,
                                        border: 'none',
                                        boxShadow: 'none',
                                        paddingLeft: 8,
                                        borderRadius: 16,
                                    }),
                                    menu: (base: any) => ({ ...base, zIndex: 200000 }),
                                    menuPortal: (base: any) => ({ ...base, zIndex: 200000 }),
                                },
                            }}
                        />
                    </div>
                    <IonLabel className="section-label">Detalles (Piso, Puerta)</IonLabel>
                    <div className="input-wrapper address-modal-field">
                        <IonInput
                            value={addressDetails}
                            onIonInput={e => setAddressDetails(e.detail.value!)}
                            placeholder="Ej. 3º B"
                        />
                    </div>
                    <IonButton expand="block" className="quira-main-btn" onClick={confirmHireProfessional} disabled={actionLoading} style={{ marginTop: '24px' }}>
                        {actionLoading ? 'Procesando...' : 'CONFIRMAR Y CONTRATAR'}
                    </IonButton>
                </div>
            </IonContent>
        </IonModal>

        {/* MODAL REVIEWS */}
        <IonModal isOpen={showReviewModal} onDidDismiss={() => setShowReviewModal(false)} initialBreakpoint={0.65} breakpoints={[0, 0.65, 0.9]}>
            <div className="ion-padding" style={{textAlign: 'center'}}>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}><IonButton fill="clear" onClick={() => setShowReviewModal(false)}><IonIcon icon={closeOutline} color="medium" /></IonButton></div>
                <h2 style={{fontWeight: 800, margin: '0 0 10px 0', fontSize: '1.6rem', color: '#1e293b'}}>¡Valora el servicio! 🎉</h2>
                <div style={{fontSize: '3rem', margin: '30px 0', display: 'flex', justifyContent: 'center', gap: '8px'}}>
                    {[1, 2, 3, 4, 5].map(num => (
                        <IonIcon key={num} icon={star} color={rating >= num ? 'warning' : 'light'} onClick={() => setRating(num)} style={{cursor: 'pointer'}} />
                    ))}
                </div>
                <div className="input-wrapper textarea-wrapper" style={{marginBottom: '20px', minHeight: '100px'}}>
                    <IonTextarea placeholder="Escribe un comentario..." value={reviewComment} onIonInput={e => setReviewComment(e.detail.value!)} rows={4} />
                </div>
                <IonButton expand="block" className="quira-main-btn" onClick={submitReview}>Enviar valoración</IonButton>
            </div>
        </IonModal>

        {/* --- MODAL Q&A (CLIENTE) --- */}
        <IonModal isOpen={showQAModal} onDidDismiss={() => setShowQAModal(false)} initialBreakpoint={0.9} breakpoints={[0, 0.9, 1]}>
             <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle style={{ fontWeight: 800 }}>Dudas de Profesionales</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setShowQAModal(false)} color="medium"><IonIcon icon={closeOutline} /></IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{'--background': '#f8fafc'}}>
                <div className="qa-modal-list">
                    {request?.questions && request.questions.length > 0 ? (
                        request.questions.map((q: any) => (
                            <div key={q.id} className="qa-bubble" style={{borderLeft: !q.answerText ? '3px solid #f87171' : '1px solid #f1f5f9'}}>
                                <div className="qa-q-text">
                                    <IonIcon icon={helpCircleOutline} color="medium"/> 
                                    <span>{q.questionText}</span>
                                </div>
                                
                                {q.answerText ? (
                                    <div className="qa-a-text">
                                        <strong>Tu respuesta:</strong> {q.answerText}
                                        {q.answerMediaUrls && q.answerMediaUrls.length > 0 && (
                                          <div className="qa-answer-media-list">
                                            {q.answerMediaUrls.slice(0, 3).map((url: string, idx: number) => {
                                              const lower = url.toLowerCase();
                                              const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
                                              return (
                                                <div key={idx} className="qa-answer-media-item">
                                                  {isVideo ? (
                                                    <video
                                                      src={resolveMediaUrl(url)}
                                                      controls
                                                      className="qa-answer-media-video"
                                                    />
                                                  ) : (
                                                    <img
                                                      src={resolveMediaUrl(url)}
                                                      alt="Adjunto respuesta"
                                                      className="qa-answer-media-img"
                                                    />
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                    </div>
                                ) : (
                                    /* INPUT PARA RESPONDER */
                                    <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0'}}>
                                        {answeringId === q.id ? (
                                            <>
                                                <IonTextarea 
                                                    value={replyText}
                                                    placeholder="Escribe tu respuesta pública..."
                                                    onIonInput={e => setReplyText(e.detail.value!)}
                                                    rows={3}
                                                    className="qa-input"
                                                    style={{ '--background': '#fff', borderRadius: '12px' } as React.CSSProperties}
                                                />
                                                <div className="qa-answer-media-uploader">
                                                  <div className="qa-answer-media-header">
                                                    <IonLabel className="section-label">Añadir imagen o vídeo (opcional)</IonLabel>
                                                    <span className="qa-answer-media-counter">
                                                      {answerMediaFiles.length}/3
                                                    </span>
                                                  </div>
                                                  <div className="qa-answer-media-buttons-row">
                                                    <button
                                                      type="button"
                                                      className="qa-answer-media-btn"
                                                      disabled={answerMediaFiles.length >= 3}
                                                      style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 4,
                                                      }}
                                                      onClick={() => {
                                                        if (answerMediaFiles.length >= 3) return;
                                                        setAnswerPickerType('photo');
                                                      }}
                                                    >
                                                      <IonIcon
                                                        icon={cameraOutline}
                                                        style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary)' }}
                                                      />
                                                      <span>Foto</span>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className="qa-answer-media-btn"
                                                      disabled={answerMediaFiles.length >= 3}
                                                      style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: 4,
                                                      }}
                                                      onClick={() => {
                                                        if (answerMediaFiles.length >= 3) return;
                                                        setAnswerPickerType('video');
                                                      }}
                                                    >
                                                      <IonIcon
                                                        icon={videocamOutline}
                                                        style={{ fontSize: '1.4rem', color: 'var(--ion-color-primary)' }}
                                                      />
                                                      <span>Vídeo</span>
                                                    </button>
                                                    <input
                                                      id="qa-answer-photo-gallery-input"
                                                      type="file"
                                                      accept="image/*"
                                                      style={{ display: 'none' }}
                                                      multiple
                                                      onChange={(e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (!files.length) return;
                                                        setAnswerMediaFiles((prev) => {
                                                          const remaining = 3 - prev.length;
                                                          if (remaining <= 0) return prev;
                                                          const toAdd = files.slice(0, remaining);
                                                          return [...prev, ...toAdd];
                                                        });
                                                        e.target.value = '';
                                                      }}
                                                    />
                                                    <input
                                                      id="qa-answer-photo-capture-input"
                                                      type="file"
                                                      accept="image/*"
                                                      capture="environment"
                                                      style={{ display: 'none' }}
                                                      multiple
                                                      onChange={(e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (!files.length) return;
                                                        setAnswerMediaFiles((prev) => {
                                                          const remaining = 3 - prev.length;
                                                          if (remaining <= 0) return prev;
                                                          const toAdd = files.slice(0, remaining);
                                                          return [...prev, ...toAdd];
                                                        });
                                                        e.target.value = '';
                                                      }}
                                                    />
                                                    <input
                                                      id="qa-answer-video-gallery-input"
                                                      type="file"
                                                      accept="video/*"
                                                      style={{ display: 'none' }}
                                                      multiple
                                                      onChange={(e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (!files.length) return;
                                                        setAnswerMediaFiles((prev) => {
                                                          const remaining = 3 - prev.length;
                                                          if (remaining <= 0) return prev;
                                                          const toAdd = files.slice(0, remaining);
                                                          return [...prev, ...toAdd];
                                                        });
                                                        e.target.value = '';
                                                      }}
                                                    />
                                                    <input
                                                      id="qa-answer-video-capture-input"
                                                      type="file"
                                                      accept="video/*"
                                                      capture="environment"
                                                      style={{ display: 'none' }}
                                                      onChange={(e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (!files.length) return;
                                                        setAnswerMediaFiles((prev) => {
                                                          const remaining = 3 - prev.length;
                                                          if (remaining <= 0) return prev;
                                                          const toAdd = files.slice(0, remaining);
                                                          return [...prev, ...toAdd];
                                                        });
                                                        e.target.value = '';
                                                      }}
                                                    />
                                                  </div>
                                                  {answerMediaFiles.length > 0 && (
                                                    <div className="qa-answer-media-preview-list">
                                                      {answerMediaFiles.map((file, idx) => {
                                                        const isVideo = file.type.startsWith('video/');
                                                        const objectUrl = URL.createObjectURL(file);
                                                        return (
                                                          <div key={idx} className="qa-answer-media-preview-item">
                                                            {isVideo ? (
                                                              <video
                                                                src={objectUrl}
                                                                className="qa-answer-media-video"
                                                                controls
                                                              />
                                                            ) : (
                                                              <img
                                                                src={objectUrl}
                                                                alt={file.name}
                                                                className="qa-answer-media-img"
                                                              />
                                                            )}
                                                            <button
                                                              type="button"
                                                              className="qa-answer-media-remove"
                                                              onClick={() =>
                                                                setAnswerMediaFiles((prev) =>
                                                                  prev.filter((_, i) => i !== idx),
                                                                )
                                                              }
                                                            >
                                                              <IonIcon icon={trashOutline} />
                                                            </button>
                                                          </div>
                                                        );
                                                      })}
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="qa-actions">
                                                    <IonButton className="qa-btn-publish" onClick={() => handleAnswerQuestion(q.id)} disabled={qLoading}>
                                                        Publicar
                                                    </IonButton>
                                                    <IonButton className="qa-btn-cancel" fill="outline" color="medium" onClick={() => setAnsweringId(null)}>
                                                        Cancelar
                                                    </IonButton>
                                                </div>
                                            </>
                                        ) : (
                                            <IonButton 
                                                className="qa-respond-btn"
                                                fill="solid"
                                                color="primary"
                                                onClick={() => { setAnsweringId(q.id); setReplyText(''); }}
                                            >
                                                Responder a esta duda
                                            </IonButton>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-modal">
                            <IonIcon icon={chatboxEllipsesOutline} style={{fontSize: '48px', opacity: 0.5}} />
                            <p>Aún no tienes preguntas.</p>
                        </div>
                    )}
                </div>
            </IonContent>
        </IonModal>

        <IonActionSheet
          isOpen={answerPickerType !== null}
          onDidDismiss={() => setAnswerPickerType(null)}
          header={
            answerPickerType === 'photo'
              ? 'Añadir foto'
              : answerPickerType === 'video'
              ? 'Añadir vídeo'
              : ''
          }
          buttons={[
            {
              text:
                answerPickerType === 'photo'
                  ? 'Hacer foto'
                  : 'Grabar vídeo',
              handler: () => {
                if (!answerPickerType) return;
                if (answerPickerType === 'photo') {
                  handleTakeAnswerPhoto();
                  return;
                }
                const input = document.getElementById('qa-answer-video-capture-input') as HTMLInputElement | null;
                if (input) input.click();
              },
            },
            {
              text: 'Elegir de la galería',
              handler: () => {
                if (!answerPickerType) return;
                const id =
                  answerPickerType === 'photo'
                    ? 'qa-answer-photo-gallery-input'
                    : 'qa-answer-video-gallery-input';
                const input = document.getElementById(id) as HTMLInputElement | null;
                if (input) input.click();
              },
            },
            {
              text: 'Cancelar',
              role: 'cancel',
            },
          ]}
        />

        <IonAlert
          isOpen={showCancelAlert}
          onDidDismiss={() => setShowCancelAlert(false)}
          header="Cancelar solicitud"
          message="¿Estás seguro? Se eliminará la solicitud y las ofertas recibidas dejarán de ser válidas."
          buttons={[
            { text: 'No, conservar', role: 'cancel', handler: () => setShowCancelAlert(false) },
            { text: 'Sí, cancelar', role: 'destructive', handler: handleCancelRequest },
          ]}
        />

        <IonToast isOpen={!!toast} message={toast || ''} duration={TOAST_DURATION_MS} onDidDismiss={() => setToast(null)} position="top" color="dark" style={{'--border-radius': '12px'}} />
      </IonContent>
    </IonPage>
  );
};

export default RequestDetail;