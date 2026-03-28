import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonCard, IonCardContent, IonRefresher, IonRefresherContent,
  useIonViewWillEnter, IonSkeletonText, IonModal, IonButton,
  IonIcon, IonButtons, IonInput, IonTextarea, IonLabel,
  IonToast, useIonRouter, IonSelect, IonSelectOption,
  IonAlert
} from '@ionic/react';
import { 
  hammerOutline, 
  cashOutline, sendOutline, closeOutline, calendarOutline, flashOutline, 
  checkmarkCircleOutline, star, lockClosedOutline, arrowForwardOutline,
  swapVerticalOutline
} from 'ionicons/icons';
import api from '../api/axios';
import { Bid, ServiceRequest } from '../types';
import './Market.css'; 
import MainHeader from '../components/shared/MainHeader';
import { LogoHeader } from '../components/layout/LogoHeader';
import { SearchText } from '../components/shared/SearchText';
import { FilterModal } from '../components/shared/FilterModal';
import { MarketOpportunityCard } from '../components/market/MarketOpportunityCard';

import { env } from '../config/env';
import { getVerificationStatus } from '../hooks/useUserVerification';
import { getEffectiveTier, type EffectiveTier } from '../utils/effectiveTier';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { getApiErrorMessage } from '../utils/apiError';

const serverUrl = env.serverUrl;

// LÍMITE DE PROPUESTAS PARA USUARIOS FREE
const FREE_BID_LIMIT = 3;

function bidProfessionalUserId(bid: { professional: { id?: number } | string }): number {
  return typeof bid.professional === 'object'
    ? bid.professional.id ?? 0
    : parseInt(String(bid.professional).split('/').pop() || '0', 10);
}

/** Pujas que cuentan para el límite FREE y para "ya has enviado propuesta": no retiradas (REJECTED). */
function isUserActiveBid(bid: Bid, userId: number): boolean {
  if (bid.status === 'REJECTED') return false;
  return bidProfessionalUserId(bid) === userId;
}

const Market: React.FC = () => {
  const router = useIonRouter();
  
  // --- ESTADOS DE DATOS ---
  const [opportunities, setOpportunities] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // --- GESTIÓN DE ROLES / NIVELES ---
  const [userTier, setUserTier] = useState<EffectiveTier>('FREE');
  const [myBidsCount, setMyBidsCount] = useState(0); 

  // --- LÓGICA DE PROPUESTAS (ANTES PUJAS) ---
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [bidPrice, setBidPrice] = useState<number | undefined>(undefined);
  const [bidComment, setBidComment] = useState('');
  const [bidEstimatedExecutionTime, setBidEstimatedExecutionTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAlertLimit, setShowAlertLimit] = useState(false);

  // GET can-bid cuando el tier efectivo es FREE/CLIENT (incluye ex-PRO/SOLVER sin paidThroughAt vigente; el API aplica el límite al plan efectivo).
  const [canBidThisMonth, setCanBidThisMonth] = useState<boolean | null>(null);
  const [showCanBidLimitAlert, setShowCanBidLimitAlert] = useState(false);

  // --- FILTROS ---
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortPrice, setSortPrice] = useState<string>(''); 
  const [showFilterModal, setShowFilterModal] = useState(false);

  // --- AUDIO PREVIEW ---
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
        setUserTier(getEffectiveTier(user));
    }
  }, []);

  const fetchOpportunities = async (event?: CustomEvent) => {
    if (!event) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('is_market', 'true');
      params.append('status', 'PENDING');

      if (searchText) params.append('title', searchText);
      if (filterCategory) params.append('category', filterCategory);
      
      if (sortPrice) {
          params.append('order[priceAmount]', sortPrice);
      } else {
          params.append('order[createdAt]', 'desc');
      }

      const response = await api.get<any>(`/requests?${params.toString()}`);
      const data = response.data;
      const list = data['hydra:member'] || data['member'];
      if (list) {
          setOpportunities(list);
          // Contar propuestas del usuario en la lista actual (para FREE)
          const userStr = localStorage.getItem('user');
          const userId = userStr ? JSON.parse(userStr).id : null;
          if (userId) {
            const count = list.filter((req: ServiceRequest) =>
              req.bids?.some((bid: Bid) => isUserActiveBid(bid, userId)),
            ).length;
            setMyBidsCount(count);
          }
      }

    } catch (error) {
      console.error(error);
      setToast('Error al cargar oportunidades. Arrastra para reintentar.');
    } finally {
      setLoading(false);
      event?.detail.complete();
    }
  };

  useIonViewWillEnter(() => { fetchOpportunities(); });

  useEffect(() => {
      fetchOpportunities();
  }, [searchText, filterCategory, sortPrice]);

  const handleSearch = (e: CustomEvent) => {
      setSearchText(e.detail.value!);
  };

  const resetFilters = () => {
      setFilterCategory('');
      setSortPrice('');
  };

  const toggleListAudio = (e: React.MouseEvent, reqId: number, audioUrl: string) => {
      e.stopPropagation();
      e.preventDefault();

      if (playingAudioId === reqId) {
          audioRef.current?.pause();
          setPlayingAudioId(null);
      } else {
          if (audioRef.current) audioRef.current.pause();
          const audio = new Audio(resolveMediaUrl(audioUrl));
          audio.onended = () => setPlayingAudioId(null);
          audioRef.current = audio;
          audio.play();
          setPlayingAudioId(reqId);
      }
  };

  const hasUserBid = (req: ServiceRequest) => {
    if (!currentUserId || !req.bids) return false;
    return req.bids.some((bid: Bid) => isUserActiveBid(bid, currentUserId));
  };

  const getAddressInfo = (req: ServiceRequest) => {
    const parts = req.address.split(',');
    const approx = parts.length >= 2 
        ? `${parts[0].trim()}, ${parts[1].trim()}` 
        : req.address;

    return {
      text: `Zona: ${approx}`,
      icon: lockClosedOutline,
    };
  };

  // --- LÓGICA DE NEGOCIO (SEGURIDAD Y VISIBILIDAD) ---

  const isHighRisk = (req: ServiceRequest) => req.riskLevel === 'HIGH';

  // 1. Visibilidad (Niebla vs Claro)
  // FREE/CLIENT: no ven HIGH salvo que ya tengan puja (p. ej. ex PRO sin pagar debe seguir la oferta).
  // Solver sigue viendo HIGH sin borrar (FOMO), alineado con ProRequestDetail + relación previa.
  const canViewRequestDetails = (req: ServiceRequest) => {
    if (!isHighRisk(req)) return true;
    if (userTier === 'FREE' || userTier === 'CLIENT') {
      if (hasUserBid(req)) return true;
      return false;
    }
    return true;
  };

  // 2. Acción (Pujar vs Candado)
  // Solo ROLE_PRO puja en HIGH. Solver y Free ven el botón bloqueado.
  const canBidOnRequest = (req: ServiceRequest) => {
    if (isHighRisk(req) && userTier !== 'PRO') {
      return false;
    }
    return true;
  };

  const openBidModal = async (e: React.MouseEvent, req: ServiceRequest) => {
    e.stopPropagation();

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

    if (!canBidOnRequest(req)) {
      setToast('Necesitas ser PRO para enviar propuestas en trabajos de Alto Riesgo.');
      return;
    }

    if (userTier === 'FREE' || userTier === 'CLIENT') {
      try {
        const res = await api.get<{ canBidThisMonth: boolean }>('/professionals/me/can-bid');
        const { canBidThisMonth: canBid } = res.data;
        setCanBidThisMonth(canBid);
        if (canBid === false) {
          setShowCanBidLimitAlert(true);
          return;
        }
      } catch {
        setToast('No se pudo verificar tu límite de propuestas. Inténtalo de nuevo.');
        return;
      }
    }

    setSelectedRequest(req);
    setBidPrice(req.priceAmount);
    setBidComment('');
    setBidEstimatedExecutionTime('');
    setShowModal(true);
  };

  const handleSubmitBid = async () => {
    if (!selectedRequest || !bidPrice) {
        setToast("Debes indicar un precio.");
        return;
    }
    if (!bidEstimatedExecutionTime) {
        setToast("Debes indicar cuándo estimas poder realizar el trabajo.");
        return;
    }
    setSubmitting(true);
    try {
        const payload = {
            request: selectedRequest['@id'] || `/api/requests/${selectedRequest.id}`,
            priceQuote: Number(bidPrice),
            comment: bidComment,
            estimatedExecutionTime: bidEstimatedExecutionTime,
            status: 'PENDING'
        };
        await api.post('/bids', payload);
        
        setMyBidsCount(prev => prev + 1);

        setToast("¡Propuesta enviada con éxito!");
        setShowModal(false);
        fetchOpportunities(); 
    } catch (error: unknown) {
        setToast(getApiErrorMessage(error) || 'Error al enviar la propuesta.');
    } finally {
        setSubmitting(false);
    }
  };

  const renderScheduleInfo = (isoString?: string | null) => {
      if (!isoString) {
          return (
              <div className="info-row" style={{color: '#ea580c', fontWeight: 700}}>
                  <IonIcon icon={flashOutline} style={{marginRight: '6px'}} />
                  <span>Urgente: Lo antes posible</span>
              </div>
          );
      }
      const date = new Date(isoString);
      return (
          <div className="info-row" style={{color: 'var(--ion-color-primary)', fontWeight: 700}}>
              <IonIcon icon={calendarOutline} style={{marginRight: '6px'}} />
              <span>{date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
          </div>
      );
  };

  return (
    <IonPage>
     <LogoHeader />
      
      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <IonRefresher slot="fixed" onIonRefresh={fetchOpportunities}>
          <IonRefresherContent />
        </IonRefresher>

        <MainHeader 
            title="Mercado" 
            subtitle="Encuentra nuevas oportunidades de trabajo."
            extraInfo={(userTier === 'FREE' || userTier === 'CLIENT') && canBidThisMonth !== false ? `Propuestas gratuitas: ${Math.max(0, FREE_BID_LIMIT - myBidsCount)} restantes` : undefined}
        />

        {/* CONTENEDOR PRINCIPAL CON BUSCADOR FLOTANTE */}
        <div className="market-content-container">
            <SearchText
                value={searchText} 
                onChange={setSearchText} 
                onFilterClick={() => setShowFilterModal(true)} 
                onSearch={fetchOpportunities}
                placeholder="Buscar trabajos..."/>


            {/* LISTA DE OPORTUNIDADES */}
            {loading ? (
             <div style={{ padding: '0 8px' }}>
               {[1, 2].map(i => (
                 <IonCard key={i} className="mkt-card">
                   <IonCardContent><IonSkeletonText animated style={{ width: '100%', height: '120px', borderRadius: '16px' }} /></IonCardContent>
                 </IonCard>
               ))}
             </div>
            ) : opportunities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 30px', color: '#64748b' }}>
                  <IonIcon icon={hammerOutline} style={{ fontSize: '48px', opacity: 0.2, marginBottom: '15px' }} />
                  <p style={{ fontWeight: 600 }}>No se encontraron oportunidades.</p>
                  <IonButton fill="clear" onClick={() => {setSearchText(''); resetFilters();}}>
                      Limpiar todo
                  </IonButton>
              </div>
            ) : (
              opportunities.map((req) => {
                const isBidden = hasUserBid(req);
                const addressInfo = getAddressInfo(req);
                const isHigh = isHighRisk(req);
                const isBlurry = !canViewRequestDetails(req);
                const isLocked = !canBidOnRequest(req);

                return (
                  <MarketOpportunityCard
                    key={req.id}
                    request={req}
                    isBidden={isBidden}
                    isHigh={isHigh}
                    isBlurry={isBlurry}
                    isLocked={isLocked}
                    addressInfo={addressInfo}
                    playingAudioId={playingAudioId}
                    onToggleAudio={toggleListAudio}
                    onCardClick={() => router.push(`/pro/request/${req.id}`)}
                    onBidClick={(e) => {
                      if (isLocked) {
                        e.stopPropagation();
                        setToast('Este trabajo requiere cuenta PRO.');
                      } else {
                        openBidModal(e, req);
                      }
                    }}
                    serverUrl={serverUrl}
                    renderScheduleInfo={renderScheduleInfo}
                  />
                );
              })
          )}
        </div>

        {/* ALERTA LÍMITE */}
        <IonAlert
            isOpen={showAlertLimit}
            onDidDismiss={() => setShowAlertLimit(false)}
            header="Límite alcanzado"
            message={`Has usado tus ${FREE_BID_LIMIT} propuestas gratuitas de este mes. Pásate a Solver o Pro para enviar propuestas sin límites.`}
            buttons={['Entendido']}
        />

        {/* ALERTA LÍMITE CAN-BID (Pro Free) */}
        <IonAlert
            isOpen={showCanBidLimitAlert}
            onDidDismiss={() => setShowCanBidLimitAlert(false)}
            header="Límite de propuestas alcanzado"
            message="No puedes enviar más propuestas este mes. Vuelve el próximo mes o mejora tu plan para seguir pujando."
            buttons={['Entendido']}
        />

        {/* MODAL PROPUESTA*/}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} initialBreakpoint={0.85} breakpoints={[0, 0.85, 1]} className="bid-modal-content">
             <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle style={{ fontWeight: 800 }}>Me Interesa</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setShowModal(false)} color="medium"><IonIcon icon={closeOutline} /></IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                {selectedRequest && (
                    <div className="animate__animated animate__fadeIn">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', background: '#eef2ff', padding: '15px', borderRadius: '16px', border: '1px solid #e0e7ff' }}>
                            <div style={{ background: '#4f46e5', padding: '10px', borderRadius: '12px', marginRight: '15px', display: 'flex' }}>
                                <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: 'white' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Presupuesto del cliente</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#4f46e5' }}>{selectedRequest.priceAmount}€</div>
                            </div>
                        </div>

                        <div className="bid-input-group bid-price-input-group">
                            <IonLabel>Precio de la propuesta (€)</IonLabel>
                            <IonInput 
                                type="number" 
                                inputMode="numeric"
                                value={bidPrice} 
                                onIonInput={e => setBidPrice(parseInt(e.detail.value!, 10))} 
                            />
                        </div>

                        <div className="bid-input-group">
                            <IonLabel>Cuándo podrías realizar el trabajo</IonLabel>
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

                        <div className="bid-input-group textarea-group">
                            <IonLabel>Detalle de la propuesta</IonLabel>
                            <IonTextarea 
                                rows={5} 
                                placeholder="Cuéntale al cliente por qué eres el profesional ideal..."
                                value={bidComment}
                                onIonInput={e => setBidComment(e.detail.value!)}
                            />
                        </div>

                        <IonButton 
                            expand="block" 
                            color="secondary"
                            onClick={handleSubmitBid} 
                            disabled={submitting}
                            style={{ marginTop: '20px', height: '56px', fontWeight: 800, '--border-radius': '16px' }}
                        >
                            <IonIcon slot="start" icon={sendOutline} />
                            {submitting ? 'ENVIANDO...' : 'ENVIAR PROPUESTA'}
                        </IonButton>
                    </div>
                )}
            </IonContent>
        </IonModal>

        {/* ================= MODAL DE FILTROS ================= */}
        <FilterModal
            isOpen={showFilterModal}
            onDismiss={() => setShowFilterModal(false)}
            title="Filtros de Mercado"
            resultsCount={opportunities.length}
            onApply={() => setShowFilterModal(false)}
            onClear={resetFilters}
            >
            <IonLabel className="section-label" style={{marginTop:'10px'}}>Categoría</IonLabel>
            <div className="filter-input-wrapper">
                <IonSelect 
                    value={filterCategory} 
                    placeholder="Todas las categorías" 
                    onIonChange={e => setFilterCategory(e.detail.value)} 
                    interface="action-sheet" 
                    cancelText="Cancelar"
                    style={{width: '100%'}}
                    className="custom-select-input"
                >
                    <IonSelectOption value="">Todas</IonSelectOption>
                    <IonSelectOption value="DIY">Manitas</IonSelectOption>
                    <IonSelectOption value="PLUMBING">Fontanería</IonSelectOption>
                    <IonSelectOption value="ELECTRICITY">Electricidad</IonSelectOption>
                    <IonSelectOption value="MASONRY">Albañilería</IonSelectOption>
                    <IonSelectOption value="HVAC">Climatización</IonSelectOption>
                    <IonSelectOption value="CLEANING">Limpieza</IonSelectOption>
                    <IonSelectOption value="PAINTING">Pintura</IonSelectOption>
                    <IonSelectOption value="GARDENING">Jardinería</IonSelectOption>
                </IonSelect>
            </div>

            <IonLabel className="section-label" style={{marginTop:'20px'}}>Ordenar por Presupuesto</IonLabel>
            <div style={{display: 'flex', gap: '10px'}}>
                    <IonButton 
                    fill={sortPrice === 'asc' ? 'solid' : 'outline'} 
                    expand="block" 
                    color={sortPrice === 'asc' ? 'primary' : 'medium'}
                    className="market-sort-btn"
                    onClick={() => setSortPrice(sortPrice === 'asc' ? '' : 'asc')}
                    >
                    <IonIcon slot="start" icon={swapVerticalOutline} /> Menor a Mayor
                    </IonButton>
                    <IonButton 
                    fill={sortPrice === 'desc' ? 'solid' : 'outline'} 
                    expand="block" 
                    color={sortPrice === 'desc' ? 'primary' : 'medium'}
                    className="market-sort-btn"
                    onClick={() => setSortPrice(sortPrice === 'desc' ? '' : 'desc')}
                    >
                    Mayor a Menor
                    </IonButton>
            </div>
        </FilterModal>

        <IonToast isOpen={!!toast} message={toast || ''} duration={2500} onDidDismiss={() => setToast(null)} position="top" color="dark" style={{ '--border-radius': '12px' }} />
      </IonContent>
    </IonPage>
  );
};

export default Market;