import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonButtons, IonContent,
  IonLoading, IonToast, IonBadge, IonIcon, IonButton, 
  useIonRouter, IonAvatar, IonTitle, IonModal, IonTextarea, IonSpinner,
  IonInput, IonLabel, IonAlert, IonSelect, IonSelectOption
} from '@ionic/react';
import { useParams } from 'react-router';
import { 
  locationOutline, checkmarkCircle, callOutline, 
  calendarOutline, star, navigateOutline, lockClosedOutline,
  closeOutline, checkmarkDoneOutline, chevronBackOutline,
  walletOutline, sendOutline, cashOutline,
  chatbubbleEllipsesOutline, timeOutline, helpCircleOutline, alertCircleOutline,
  chatboxEllipsesOutline, chevronForwardOutline, personOutline
} from 'ionicons/icons';
import api from '../api/axios';
import { ServiceRequest } from '../types'; 
import './ProRequestDetail.css'; 
import { ProRequestDetailMedia } from '../components/pro/ProRequestDetailMedia';
import { ProRequestDetailMainSection } from '../components/pro/ProRequestDetailMainSection';

import { env } from '../config/env';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import { getVerificationStatus } from '../hooks/useUserVerification';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { getEffectiveTier, type EffectiveTier } from '../utils/effectiveTier';
import {
  getMyBidsFromRequest,
  getMyActiveBid,
  getMyBidForProUi,
} from '../utils/bidDisplay';
import { getApiErrorMessage } from '../utils/apiError';
import { formatRequestPriceRangeEuros, suggestedBidPriceEuros } from '../utils/requestPriceRange';

const serverUrl = env.serverUrl;
const GOOGLE_API_KEY = env.googleMapsKey; 

const ProRequestDetail: React.FC = () => {
  const router = useIonRouter();
  const { id } = useParams<{ id: string }>();
  
  // --- ESTADOS DE DATOS ---
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [myProfileId, setMyProfileId] = useState<number | null>(null);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [userTier, setUserTier] = useState<EffectiveTier>('FREE'); 

  // --- ESTADOS DE FLUJO ---
  const [isFinishing, setIsFinishing] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);

  // --- ESTADOS PUJA ---
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidPrice, setBidPrice] = useState<number | undefined>(undefined);
  const [bidComment, setBidComment] = useState('');
  const [bidEstimatedExecutionTime, setBidEstimatedExecutionTime] = useState<string>('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [cancellingBid, setCancellingBid] = useState(false);
  const [showCancelBidAlert, setShowCancelBidAlert] = useState(false);

  // --- ESTADOS Q&A ---
  const [showQAModal, setShowQAModal] = useState(false); 
  const [newQuestion, setNewQuestion] = useState('');
  const [qLoading, setQLoading] = useState(false);

  // --- AUDIO ---
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [visitLoading, setVisitLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        setMyProfileId(user.professionalProfile?.id || null);
        setMyUserId(user.id || null);
        setUserTier(getEffectiveTier(user));
    }
  }, []);

  useEffect(() => {
      if (id) fetchDetail();
  }, [id, myUserId]);

  const fetchDetail = async () => {
    try {
      const response = await api.get(`/requests/${id}`);
      const data = response.data;
      setRequest(data);

      if (data.status === 'COMPLETED' && myUserId) {
        const reviewRes = await api.get('/reviews', {
            params: {
                request: `/api/requests/${id}`,
                author: `/api/users/${myUserId}`
            }
        });
        const reviews = reviewRes.data['hydra:member'] || reviewRes.data['member'] || [];
        if (reviews.length > 0) {
            setHasReviewed(true);
        }
      }
    } catch (error) {
      console.error(error);
      setToast("Error al cargar el trabajo.");
    } finally {
      setLoading(false);
    }
  };

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

  const extractId = (data: any): number | null => {
    if (!data) return null;
    if (typeof data === 'object' && data.id) return Number(data.id);
    if (typeof data === 'object' && data['@id']) {
        const parts = data['@id'].split('/');
        return parseInt(parts[parts.length - 1], 10);
    }
    if (typeof data === 'string') {
        const parts = data.split('/');
        return parseInt(parts[parts.length - 1], 10);
    }
    return null;
  };

  // --- LÓGICA DE Q&A ---
  const handleAskQuestion = async () => {
    if (!newQuestion.trim()) return;
    setQLoading(true);
    try {
        await api.post('/request_questions', {
            request: `/api/requests/${id}`,
            questionText: newQuestion
        });
        setNewQuestion('');
        setToast("Pregunta enviada. Espera a que el cliente responda.");
        fetchDetail(); 
    } catch (error: any) {
        const msg = error.response?.data?.violations?.[0]?.message || "Error al enviar la pregunta.";
        setToast(msg);
    } finally {
        setQLoading(false);
    }
  };

  // --- LÓGICA DE ESTADOS Y PERMISOS ---
  const assignedProId = extractId(request?.assignedProfessional);
  const targetId = extractId(request?.client?.user); 

  const isWinner = (request?.status === 'ACCEPTED' || request?.status === 'COMPLETED') && myProfileId !== null && assignedProId === myProfileId;
  const isCompleted = request?.status === 'COMPLETED';
  const isHighRisk = request?.riskLevel === 'HIGH';
  
  // REGLA: Si es High Risk (alta dificultad), SOLO los PRO pueden enviar propuestas.
  // Los Solver y Free pueden ver (si llegan aquí), pero no ofertar.
  const canSubmitBid = !isHighRisk || userTier === 'PRO';

  const myBids = getMyBidsFromRequest(request?.bids, myUserId, myProfileId);
  const myActiveBid = getMyActiveBid(myBids);
  const myBid = getMyBidForProUi(myBids);

  const openGPS = () => {
    if (!request) return;
    const addressToSearch = request.preciseAddress || request.address;
    const encodedAddress = encodeURIComponent(addressToSearch);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  const callClient = () => {
      if (request?.client?.phoneNumber) {
          window.open(`tel:${request.client.phoneNumber}`, '_system');
      } else {
          setToast("El cliente no tiene teléfono registrado.");
      }
  };

  // --- ACCIONES ---

  const handleFinishWork = async () => {
    setIsFinishing(true);
    try {
      await api.patch(`/requests/${id}`, { status: 'COMPLETED' }, {
        headers: { 'Content-Type': 'application/merge-patch+json' }
      });
      setToast("¡Trabajo completado con éxito!");
      setShowReviewModal(true);
      fetchDetail();
    } catch (error) {
      setToast("Error al finalizar el trabajo.");
    } finally {
      setIsFinishing(false);
    }
  };

  const submitReview = async () => {
    if (!request) return;
    if (!targetId) {
        setToast("Error: No se encuentra el usuario del cliente.");
        return;
    }

    try {
        await api.post('/reviews', {
            score: rating,
            comment: comment,
            request: `/api/requests/${id}`,
            target: `/api/users/${targetId}` 
        });
        setToast("¡Gracias por tu valoración!");
        setHasReviewed(true);
        setShowReviewModal(false);
        fetchDetail(); 
    } catch (error) {
        setToast("Error al enviar la valoración.");
    }
  };

  const submitBid = async () => {
      if (!bidPrice) {
          setToast("Debes indicar un precio.");
          return;
      }
      if (!bidEstimatedExecutionTime) {
          setToast("Debes indicar cuándo estimas poder realizar el trabajo.");
          return;
      }
      setSubmittingBid(true);
      try {
          const payload = {
              request: request?.['@id'] || `/api/requests/${id}`,
              priceQuote: Number(bidPrice),
              comment: bidComment,
              estimatedExecutionTime: bidEstimatedExecutionTime,
              status: 'PENDING'
          };
          await api.post('/bids', payload);
          setToast("¡Oferta enviada con éxito!");
          setShowBidModal(false);
          fetchDetail(); 
      } catch (error: unknown) {
          setToast(getApiErrorMessage(error) || 'Error al enviar la oferta.');
      } finally {
          setSubmittingBid(false);
      }
  };

  const handleCancelBid = async () => {
    if (!myActiveBid?.id || request?.status !== 'PENDING') return;
    setCancellingBid(true);
    setShowCancelBidAlert(false);
    try {
      await api.delete(`/bids/${myActiveBid.id}/withdraw`);
      // Recalcula el contador FREE en backend tras retirar la propuesta.
      void api.get('/professionals/me/can-bid').catch(() => undefined);
      setRequest((prev) =>
        prev
          ? { ...prev, bids: prev.bids.filter((bid) => bid.id !== myActiveBid.id) }
          : prev,
      );
      setToast('Propuesta retirada.');
      fetchDetail();
    } catch (error) {
      setToast('Error al retirar la propuesta.');
    } finally {
      setCancellingBid(false);
    }
  };

  const handleRequestVisit = async () => {
    if (!request) return;
    setVisitLoading(true);
    try {
      await api.post(`/requests/${id}/visit-request`);
      setToast('Has solicitado una visita de valoración. Espera a que el cliente responda.');
      fetchDetail();
    } catch (error: unknown) {
      setToast(getApiErrorMessage(error) || 'Error al solicitar la visita de valoración.');
    } finally {
      setVisitLoading(false);
    }
  };

  const openBidModal = () => {
      const verification = getVerificationStatus();
      if (!verification?.canBid) {
          if (!verification?.hasProPhone) {
              setToast('Debes añadir y verificar tu teléfono en tu perfil profesional antes de hacer una puja.');
          } else {
              setToast('Debes verificar tu teléfono profesional en tu perfil antes de hacer una puja.');
          }
          router.push('/profile');
          return;
      }
      setBidPrice(request ? suggestedBidPriceEuros(request) : undefined);
      setBidComment('');
      setBidEstimatedExecutionTime('');
      setShowBidModal(true);
  };

  if (loading) return <IonLoading isOpen={true} />;
  
  // PROTECCIÓN: Si es High Risk (alta dificultad) y es FREE, bloqueamos solo si NO tiene relación con el trabajo.
  // Si pujó o ganó el trabajo, puede ver todo (cliente, teléfono, ubicación) para poder ejecutarlo.
  const hasRelationshipWithRequest = isWinner || myBids.length > 0;
  if (request && isHighRisk && (userTier === 'FREE' || userTier === 'CLIENT') && !hasRelationshipWithRequest) {
      return (
          <IonPage>
              <IonHeader className="ion-no-border">
                  <IonToolbar color="primary">
                      <IonButtons slot="start">
                          <IonButton onClick={() => router.goBack()} color="light"><IonIcon icon={chevronBackOutline}/></IonButton>
                      </IonButtons>
                      <IonTitle>Restringido</IonTitle>
                  </IonToolbar>
              </IonHeader>
              <IonContent className="ion-padding ion-text-center" style={{'--background': '#f8fafc'}}>
                  <div style={{marginTop: '80px', padding: '20px'}}>
                      <div style={{background: '#f1f5f9', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto'}}>
                          <IonIcon icon={lockClosedOutline} style={{fontSize: '64px', color: '#94a3b8'}} />
                      </div>
                      <h2 style={{color: '#1e293b', fontWeight: 900, fontSize: '1.8rem'}}>Acceso Limitado</h2>
                      <p style={{color: '#64748b', fontSize: '1rem', lineHeight: '1.5'}}>
                          Esta oportunidad es de <strong>alta dificultad</strong> y solo está disponible para suscripciones Solver o Pro.
                      </p>
                      <IonButton routerLink="/become-pro" expand="block" color="primary" style={{marginTop: '30px', height: '52px', fontWeight: 800, '--border-radius': '16px'}}>
                          MEJORAR MI PLAN
                      </IonButton>
                  </div>
              </IonContent>
          </IonPage>
      );
  }

  if (!request) return <IonPage><IonContent className="ion-padding">No se encontró el trabajo.</IonContent></IonPage>;

  const questionsCount = request.questions?.length || 0;

  return (
    <IonPage>
      <IonHeader className="ion-no-border pro-detail-header">
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

          <IonButtons slot="end" style={{width: '48px'}}>
            {isWinner && (
                <IonButton onClick={openGPS} style={{color: 'white'}}>
                    <IonIcon icon={navigateOutline} style={{fontSize: '24px'}} />
                </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        
        <div className="pro-detail-bg-curve"></div>

        <div className="pro-content-wrapper animate__animated animate__fadeIn">
            
            {/* MULTIMEDIA */}
            <ProRequestDetailMedia
              request={request}
              serverUrl={serverUrl}
              isPlayingAudio={isPlayingAudio}
              onToggleAudio={toggleAudio}
            />

            <ProRequestDetailMainSection
              request={request}
              serverUrl={serverUrl}
              isWinner={isWinner}
              isCompleted={isCompleted}
              isHighRisk={isHighRisk}
              myBid={myBid}
              questionsCount={questionsCount}
              userTier={userTier}
              canSubmitBid={canSubmitBid}
              isFinishing={isFinishing}
              hasReviewed={hasReviewed}
              qLoading={qLoading}
              newQuestion={newQuestion}
              visitRequest={request.visitRequests?.[0]}
              isRequestingVisit={visitLoading}
              hasActiveBid={!!myActiveBid}
              canCancelBid={
                !!myActiveBid &&
                request?.status === 'PENDING' &&
                myActiveBid.status === 'PENDING'
              }
              onCancelBid={() => setShowCancelBidAlert(true)}
              cancellingBid={cancellingBid}
              onOpenGPS={openGPS}
              onOpenQAModal={() => setShowQAModal(true)}
              onCallClient={callClient}
              onHandleFinishWork={handleFinishWork}
              onOpenReviewModal={() => setShowReviewModal(true)}
              onOpenBidModal={openBidModal}
              onAskQuestion={handleAskQuestion}
              onChangeQuestion={(value) => setNewQuestion(value)}
              onRequestVisit={handleRequestVisit}
            />
        </div>

        {/* MODAL BID */}
        <IonModal isOpen={showBidModal} onDidDismiss={() => setShowBidModal(false)} initialBreakpoint={0.75} breakpoints={[0, 0.75, 1]} className="bid-modal-content">
             <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle style={{ fontWeight: 800 }}>Enviar Propuesta</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setShowBidModal(false)} color="medium"><IonIcon icon={closeOutline} /></IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <div className="animate__animated animate__fadeIn">
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', background: '#eef2ff', padding: '15px', borderRadius: '16px', border: '1px solid #e0e7ff' }}>
                        <div style={{ background: '#4f46e5', padding: '10px', borderRadius: '12px', marginRight: '15px', display: 'flex' }}>
                            <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: 'white' }} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Rango estimado</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4f46e5', lineHeight: 1.25 }}>{formatRequestPriceRangeEuros(request)}</div>
                        </div>
                    </div>

                    <IonLabel className="section-label">Tu Oferta Económica (€)</IonLabel>
                    <div className="input-wrapper">
                        <IonInput 
                            type="number" 
                            value={bidPrice} 
                            onIonInput={e => setBidPrice(parseInt(e.detail.value!, 10))} 
                        />
                    </div>

                    <IonLabel className="section-label" style={{marginTop:'15px'}}>Cuándo podrías realizar el trabajo</IonLabel>
                    <div className="input-wrapper">
                      <IonSelect
                        interface="action-sheet"
                        placeholder="Selecciona una opción"
                        value={bidEstimatedExecutionTime}
                        onIonChange={e => setBidEstimatedExecutionTime(e.detail.value as string)}
                      >
                        <IonSelectOption value="Hoy mismo">Hoy mismo</IonSelectOption>
                        <IonSelectOption value="Mañana">Mañana</IonSelectOption>
                        <IonSelectOption value="Esta semana">Esta semana</IonSelectOption>
                        <IonSelectOption value="La próxima semana">La próxima semana</IonSelectOption>
                        <IonSelectOption value="En dos semanas o más">En dos semanas o más</IonSelectOption>
                        <IonSelectOption value="A convenir al aceptar la oferta">A convenir al aceptar la oferta</IonSelectOption>
                      </IonSelect>
                    </div>

                    <IonLabel className="section-label" style={{marginTop:'15px'}}>Mensaje de presentación</IonLabel>
                    <div className="input-wrapper textarea-wrapper">
                        <IonTextarea 
                            rows={5} 
                            placeholder="Hola, soy experto en..."
                            value={bidComment}
                            onIonInput={e => setBidComment(e.detail.value!)}
                        />
                    </div>

                    <IonButton 
                        expand="block" 
                        color="secondary"
                        onClick={submitBid} 
                        disabled={submittingBid}
                        className="pro-main-btn"
                        style={{marginTop: '20px'}}
                    >
                        {submittingBid ? 'ENVIANDO...' : <><IonIcon slot="start" icon={sendOutline} /> ENVIAR OFERTA</>}
                    </IonButton>
                </div>
            </IonContent>
        </IonModal>

        {/* MODAL REVIEW */}
        <IonModal isOpen={showReviewModal} onDidDismiss={() => setShowReviewModal(false)} initialBreakpoint={0.65} breakpoints={[0, 0.65, 0.9]}>
            <div className="ion-padding" style={{textAlign: 'center'}}>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
                    <IonButton fill="clear" onClick={() => setShowReviewModal(false)}>
                        <IonIcon icon={closeOutline} color="medium" />
                    </IonButton>
                </div>
                <h2 style={{fontWeight: 900, marginTop: 0, color: '#1e293b'}}>Valoración del cliente</h2>
                <div style={{fontSize: '3rem', margin: '30px 0', display: 'flex', justifyContent: 'center', gap: '8px'}}>
                    {[1, 2, 3, 4, 5].map(num => (
                        <IonIcon 
                            key={num} icon={star} color={rating >= num ? 'warning' : 'light'} 
                            onClick={() => setRating(num)}
                            style={{cursor: 'pointer', filter: rating >= num ? 'drop-shadow(0 2px 4px rgba(251, 191, 36, 0.4))' : 'none'}}
                        />
                    ))}
                </div>
                <div className="input-wrapper textarea-wrapper" style={{marginBottom: '20px'}}>
                    <IonTextarea placeholder="Comentario..." value={comment} onIonInput={e => setComment(e.detail.value!)} rows={4} />
                </div>
                <IonButton expand="block" className="pro-main-btn" onClick={submitReview}>ENVIAR VALORACIÓN</IonButton>
            </div>
        </IonModal>

        {/* MODAL Q&A */}
        <IonModal isOpen={showQAModal} onDidDismiss={() => setShowQAModal(false)} initialBreakpoint={0.9} breakpoints={[0, 0.9, 1]}>
             <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle style={{ fontWeight: 800 }}>Dudas del Trabajo</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setShowQAModal(false)} color="medium"><IonIcon icon={closeOutline} /></IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{'--background': '#f8fafc'}}>
                
                <div className="qa-modal-list">
                    {request?.questions && request.questions.length > 0 ? (
                        request.questions.map((q: any) => (
                            <div key={q.id} className="qa-bubble">
                                <div className="qa-q-text">
                                    <IonIcon icon={helpCircleOutline} color="medium"/> 
                                    <span>{q.questionText}</span>
                                </div>
                                {q.answerText ? (
                                    <div className="qa-a-text">
                                        <strong>Respuesta:</strong> {q.answerText}
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
                                    <div style={{fontSize: '0.8rem', color: '#94a3b8', marginLeft: '26px', fontStyle: 'italic'}}>
                                        Esperando respuesta del cliente...
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state-modal">
                            <IonIcon icon={chatboxEllipsesOutline} style={{fontSize: '48px', opacity: 0.5}} />
                            <p>No hay preguntas todavía.<br/>¡Sé el primero en resolver tus dudas!</p>
                        </div>
                    )}
                </div>

                {request.status === 'PENDING' && (
                    <div className="ask-form-sticky">
                        <IonLabel className="section-label">Escribe tu pregunta</IonLabel>
                        <div className="input-wrapper textarea-wrapper" style={{background: 'white'}}>
                            <IonTextarea 
                                value={newQuestion}
                                placeholder="Ej: ¿Hay ascensor? ¿Es para pintar techos también?"
                                onIonInput={e => setNewQuestion(e.detail.value!)}
                                rows={3}
                            />
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#ef4444', marginTop: '5px', marginBottom: '15px', justifyContent:'center'}}>
                            <IonIcon icon={alertCircleOutline} /> No incluyas teléfonos o emails.
                        </div>
                        
                        <IonButton 
                            expand="block" 
                            className="pro-main-btn" 
                            onClick={handleAskQuestion}
                            disabled={qLoading || !newQuestion.trim()}
                        >
                            {qLoading ? 'ENVIANDO...' : <><IonIcon slot="start" icon={sendOutline} /> PREGUNTAR AL CLIENTE</>}
                        </IonButton>
                    </div>
                )}

            </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showCancelBidAlert}
          onDidDismiss={() => setShowCancelBidAlert(false)}
          header="Retirar propuesta"
          message="¿Estás seguro? Se retirará tu propuesta y el cliente ya no la verá."
          buttons={[
            { text: 'No, mantener', role: 'cancel', handler: () => setShowCancelBidAlert(false) },
            { text: 'Sí, retirar', role: 'destructive', handler: handleCancelBid },
          ]}
        />

        <IonToast isOpen={!!toast} message={toast!} duration={TOAST_DURATION_MS} onDidDismiss={() => setToast(null)} position="top" color="dark" style={{'--border-radius': '12px'}} />
      </IonContent>
    </IonPage>
  );
};

export default ProRequestDetail;