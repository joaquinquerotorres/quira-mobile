import React, { useState, useEffect } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonFooter,
  IonCard, IonCardContent, IonRefresher, IonRefresherContent,
  useIonViewWillEnter, IonSkeletonText, IonModal, IonButton,
  IonIcon, IonButtons, IonTextarea, IonLabel,
  IonToast, useIonRouter, IonSelect, IonSelectOption,
  IonAlert
} from '@ionic/react';
import { 
  hammerOutline, 
  cashOutline, sendOutline, closeOutline, 
  checkmarkCircleOutline, star, lockClosedOutline,
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

import { TOAST_DURATION_MS } from '../config/uiTiming';
import { getVerificationStatus } from '../hooks/useUserVerification';
import { getEffectiveTier, type EffectiveTier } from '../utils/effectiveTier';
import { getApiErrorMessage } from '../utils/apiError';
import { CATEGORY_OPTIONS } from '../utils/categoryLabels';
import { formatRequestPriceRangeEuros, suggestedBidPriceEuros } from '../utils/requestPriceRange';
import { REQUESTS_INVALIDATED_EVENT } from '../utils/requestEvents';
import { refreshCurrentUserInStorage } from '../utils/refreshCurrentUser';
import {
  defaultBidPricingType,
  getAllowedBidPricingTypes,
  bidCommentLabel,
  bidCommentPlaceholder,
  isBidCommentRequired,
  type BidPricingType,
} from '../utils/bidPricing';
import { BidPricingFields } from '../components/pro/BidPricingFields';
import { ExecutionTimeFields } from '../components/shared/ExecutionTimeFields';
import {
  PRO_EXECUTION_TIME_OPTIONS,
  isExecutionTimeComplete,
} from '../utils/executionTime';

// LÍMITE DE PROPUESTAS PARA USUARIOS FREE
const FREE_BID_LIMIT = 3;
interface CanBidResponse {
  canBidThisMonth: boolean;
  remainingBidsThisMonth?: number;
}

function bidProfessionalUserId(bid: { professional: { id?: number } | string }): number {
  return typeof bid.professional === 'object'
    ? bid.professional.id ?? 0
    : parseInt(String(bid.professional).split('/').pop() || '0', 10);
}

function isUserActiveBid(bid: Bid, userId: number): boolean {
  return bid.status === 'PENDING' && bidProfessionalUserId(bid) === userId;
}

const Market: React.FC = () => {
  const router = useIonRouter();
  
  // --- ESTADOS DE DATOS ---
  const [opportunities, setOpportunities] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // --- GESTIÓN DE ROLES / NIVELES ---
  const [userTier, setUserTier] = useState<EffectiveTier>('FREE');

  // --- LÓGICA DE PROPUESTAS (ANTES PUJAS) ---
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [bidPricingType, setBidPricingType] = useState<BidPricingType>('FIXED');
  const [bidPrice, setBidPrice] = useState<number | undefined>(undefined);
  const [bidPriceMin, setBidPriceMin] = useState<number | undefined>(undefined);
  const [bidPriceMax, setBidPriceMax] = useState<number | undefined>(undefined);
  const [bidComment, setBidComment] = useState('');
  const [bidEstimatedExecutionTime, setBidEstimatedExecutionTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showAlertLimit, setShowAlertLimit] = useState(false);

  // GET can-bid cuando el tier efectivo es FREE/CLIENT (incluye ex-PRO/SOLVER sin paidThroughAt vigente; el API aplica el límite al plan efectivo).
  const [canBidThisMonth, setCanBidThisMonth] = useState<boolean | null>(null);
  const [remainingBidsThisMonth, setRemainingBidsThisMonth] = useState<number | null>(null);
  const [showCanBidLimitAlert, setShowCanBidLimitAlert] = useState(false);

  // --- FILTROS ---
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortPrice, setSortPrice] = useState<string>(''); 
  const [showFilterModal, setShowFilterModal] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
        setUserTier(getEffectiveTier(user));
    }
  }, []);

  const isFreeOrClient = userTier === 'FREE' || userTier === 'CLIENT';

  const refreshCanBidStatus = async (tierOverride?: EffectiveTier): Promise<CanBidResponse | null> => {
    const tier = tierOverride ?? userTier;
    if (!(tier === 'FREE' || tier === 'CLIENT')) {
      setCanBidThisMonth(null);
      setRemainingBidsThisMonth(null);
      return null;
    }
    try {
      const res = await api.get<CanBidResponse>('/professionals/me/can-bid');
      const canBid = !!res.data?.canBidThisMonth;
      setCanBidThisMonth(canBid);
      setRemainingBidsThisMonth(
        typeof res.data?.remainingBidsThisMonth === 'number'
          ? Math.max(0, res.data.remainingBidsThisMonth)
          : null,
      );
      return res.data;
    } catch {
      setCanBidThisMonth(null);
      setRemainingBidsThisMonth(null);
      return null;
    }
  };

  const fetchOpportunities = async (event?: CustomEvent) => {
    if (!event) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('is_market', 'true');
      params.append('status', 'PENDING');

      if (searchText) params.append('title', searchText);
      if (filterCategory) params.append('category', filterCategory);
      
      if (sortPrice) {
          params.append('order[estimatedPriceMin]', sortPrice);
      } else {
          params.append('order[createdAt]', 'desc');
      }

      const response = await api.get<any>(`/requests?${params.toString()}`);
      const data = response.data;
      const list = data['hydra:member'] || data['member'];
      if (list) {
          setOpportunities(list);
      }

    } catch (error) {
      console.error(error);
      setToast('Error al cargar oportunidades. Arrastra para reintentar.');
    } finally {
      setLoading(false);
      event?.detail.complete();
    }
  };

  useIonViewWillEnter(() => {
    void (async () => {
      // Asegura que si `paidThroughAt` caducó en backend (ex PRO → FREE),
      // el cálculo de blur para HIGH usa el tier efectivo correcto.
      await refreshCurrentUserInStorage();

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const freshUser = JSON.parse(userStr);
        setCurrentUserId(freshUser.id);
        const nextTier = getEffectiveTier(freshUser);
        setUserTier(nextTier);
        void refreshCanBidStatus(nextTier);
      } else {
        void refreshCanBidStatus();
      }

      fetchOpportunities();
    })();
  });

  useEffect(() => {
      fetchOpportunities();
  }, [searchText, filterCategory, sortPrice]);

  useEffect(() => {
    void refreshCanBidStatus();
  }, [userTier]);
  useEffect(() => {
    const onInvalidated = () => {
      fetchOpportunities();
      void refreshCanBidStatus();
    };
    window.addEventListener(REQUESTS_INVALIDATED_EVENT, onInvalidated);
    return () => window.removeEventListener(REQUESTS_INVALIDATED_EVENT, onInvalidated);
  }, [searchText, filterCategory, sortPrice, userTier]);

  const handleSearch = (e: CustomEvent) => {
      setSearchText(e.detail.value!);
  };

  const resetFilters = () => {
      setFilterCategory('');
      setSortPrice('');
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

    if (isFreeOrClient) {
      const canBidResponse = await refreshCanBidStatus();
      if (!canBidResponse) {
        setToast('No se pudo verificar tu límite de propuestas. Inténtalo de nuevo.');
        return;
      }
      if (!canBidResponse.canBidThisMonth) {
        setShowCanBidLimitAlert(true);
        return;
      }
    }

    setSelectedRequest(req);
    const suggested = suggestedBidPriceEuros(req);
    const defaultType = defaultBidPricingType(req);
    setBidPricingType(defaultType);
    setBidPrice(suggested);
    setBidPriceMin(suggested);
    setBidPriceMax(suggested);
    setBidComment('');
    setBidEstimatedExecutionTime('');
    setShowModal(true);
  };

  const handleSubmitBid = async () => {
    if (!selectedRequest) return;

    if (bidPricingType === 'FIXED') {
      if (!bidPrice || bidPrice <= 0) {
        setToast('Debes indicar un precio fijo.');
        return;
      }
    } else {
      if (!bidPriceMin || !bidPriceMax || bidPriceMin <= 0 || bidPriceMax <= 0) {
        setToast('Debes indicar un rango válido (mínimo y máximo).');
        return;
      }
      if (bidPriceMax < bidPriceMin) {
        setToast('El máximo debe ser mayor o igual que el mínimo.');
        return;
      }
    }
    if (isBidCommentRequired(bidPricingType) && !bidComment.trim()) {
      setToast('En un rango de precio debes explicar por qué puede variar.');
      return;
    }
    if (!isExecutionTimeComplete(bidEstimatedExecutionTime)) {
      setToast(
        bidEstimatedExecutionTime === 'Fecha concreta' ||
          bidEstimatedExecutionTime.startsWith('Fecha concreta')
          ? 'Si eliges fecha concreta, debes seleccionar el día.'
          : 'Debes indicar cuándo estimas poder realizar el trabajo.',
      );
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        request: selectedRequest['@id'] || `/api/requests/${selectedRequest.id}`,
        pricingType: bidPricingType,
        comment: bidComment,
        estimatedExecutionTime: bidEstimatedExecutionTime,
        status: 'PENDING',
      };
      if (bidPricingType === 'FIXED') {
        payload.priceQuote = Number(bidPrice);
      } else {
        payload.priceQuoteMin = Number(bidPriceMin);
        payload.priceQuoteMax = Number(bidPriceMax);
        payload.priceQuote = Number(bidPriceMin);
      }
      await api.post('/bids', payload);

      setToast('¡Propuesta enviada con éxito!');
      setShowModal(false);
      void refreshCanBidStatus();
      fetchOpportunities();
    } catch (error: unknown) {
      setToast(getApiErrorMessage(error) || 'Error al enviar la propuesta.');
    } finally {
      setSubmitting(false);
    }
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
            extraInfo={
              isFreeOrClient
                ? `Propuestas gratuitas: ${Math.max(0, remainingBidsThisMonth ?? 0)} restantes`
                : undefined
            }
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
                    onCardClick={() => router.push(`/pro/request/${req.id}`)}
                    onBidClick={(e) => {
                      if (isLocked) {
                        e.stopPropagation();
                        setToast('Este trabajo requiere cuenta PRO.');
                      } else {
                        openBidModal(e, req);
                      }
                    }}
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
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)} className="bid-modal-content">
             <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle style={{ fontWeight: 800 }}>Me Interesa</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => setShowModal(false)} color="medium"><IonIcon icon={closeOutline} /></IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding bid-modal-scroll">
                {selectedRequest && (
                    <div className="animate__animated animate__fadeIn">
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', background: '#eef2ff', padding: '15px', borderRadius: '16px', border: '1px solid #e0e7ff' }}>
                            <div style={{ background: '#4f46e5', padding: '10px', borderRadius: '12px', marginRight: '15px', display: 'flex' }}>
                                <IonIcon icon={cashOutline} style={{ fontSize: '24px', color: 'white' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Rango estimado</div>
                                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#4f46e5', lineHeight: 1.25 }}>{formatRequestPriceRangeEuros(selectedRequest)}</div>
                            </div>
                        </div>

                        <BidPricingFields
                          allowedTypes={getAllowedBidPricingTypes(selectedRequest)}
                          pricingType={bidPricingType}
                          onPricingTypeChange={setBidPricingType}
                          bidPrice={bidPrice}
                          onBidPriceChange={setBidPrice}
                          bidPriceMin={bidPriceMin}
                          onBidPriceMinChange={setBidPriceMin}
                          bidPriceMax={bidPriceMax}
                          onBidPriceMaxChange={setBidPriceMax}
                        />

                        <ExecutionTimeFields
                          label="Cuándo podrías realizar el trabajo"
                          options={PRO_EXECUTION_TIME_OPTIONS}
                          value={bidEstimatedExecutionTime}
                          onChange={setBidEstimatedExecutionTime}
                          className="bid-input-group"
                          selectWrapClassName=""
                        />

                        <div className="bid-input-group textarea-group">
                            <IonLabel>{bidCommentLabel(bidPricingType)}</IonLabel>
                            <IonTextarea 
                                rows={4} 
                                placeholder={bidCommentPlaceholder(bidPricingType)}
                                value={bidComment}
                                onIonInput={e => setBidComment(e.detail.value!)}
                            />
                        </div>
                    </div>
                )}
            </IonContent>
            <IonFooter className="ion-no-border bid-modal-footer">
              <IonToolbar>
                <IonButton
                  expand="block"
                  color="secondary"
                  onClick={handleSubmitBid}
                  disabled={submitting || !selectedRequest}
                  style={{ height: '52px', fontWeight: 800, '--border-radius': '14px', margin: '0 8px 8px' }}
                >
                  <IonIcon slot="start" icon={sendOutline} />
                  {submitting ? 'ENVIANDO...' : 'ENVIAR PROPUESTA'}
                </IonButton>
              </IonToolbar>
            </IonFooter>
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
                    {CATEGORY_OPTIONS.map((opt) => (
                      <IonSelectOption key={opt.value} value={opt.value}>
                        {opt.label}
                      </IonSelectOption>
                    ))}
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

        <IonToast isOpen={!!toast} message={toast || ''} duration={TOAST_DURATION_MS} onDidDismiss={() => setToast(null)} position="top" color="dark" style={{ '--border-radius': '12px' }} />
      </IonContent>
    </IonPage>
  );
};

export default Market;