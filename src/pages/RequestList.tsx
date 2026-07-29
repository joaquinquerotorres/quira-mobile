import React, { useState, useEffect } from 'react';
import {
  IonContent, IonPage,
  IonCard, IonCardContent, IonIcon, IonRefresher, IonRefresherContent,
  useIonViewWillEnter, IonSkeletonText, IonButton,
  IonLabel, IonSelect, IonSelectOption,
  IonAvatar, IonToast
} from '@ionic/react';
import { 
  locationOutline, calendarOutline, flashOutline, 
  arrowForwardOutline, star, checkmarkCircleOutline, filterOutline, 
  swapVerticalOutline, 
  searchOutline,
  compassOutline, listOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import api from '../api/axios';
import { ServiceRequest, RequestStatus } from '../types';
import './RequestList.css'; 
import { LogoHeader } from '../components/layout/LogoHeader';
import MainHeader from '../components/shared/MainHeader';
import { SearchText } from '../components/shared/SearchText';
import { FilterModal } from '../components/shared/FilterModal';
import { SegmentTab } from '../components/shared/SegmentTab';
import { ListingCard, FilterChipRow } from '../components/listing';

import { TOAST_DURATION_MS } from '../config/uiTiming';
import { CATEGORY_OPTIONS, getCategoryLabel } from '../utils/categoryLabels';
import { getDiscoveryCategories } from '../utils/categoryStyles';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { formatRequestPriceRangeEuros } from '../utils/requestPriceRange';
import { REQUESTS_INVALIDATED_EVENT } from '../utils/requestEvents';
import type { ListingStatusKey } from '../utils/listingStatus';

const TOP_PROS_ORDER_KEY = 'request-list-top-pros-order-v1';

const RequestList: React.FC = () => {
  const history = useHistory();
  
  // --- ESTADO DE VISTA (SEGMENTO) ---
  const [viewMode, setViewMode] = useState<'requests' | 'discovery'>('requests');

  // --- ESTADOS DE DATOS ---
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [topPros, setTopPros] = useState<Array<{ user?: { roles?: string[] }; id?: number; avatar?: string; fullName?: string; skills?: string[]; rating?: string | number; reviewCount?: number; category?: { name?: string } }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPros, setLoadingPros] = useState(true);

  // --- ESTADOS DE FILTROS ---
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL'); 
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortPrice, setSortPrice] = useState<string>(''); 
  const [showFilterModal, setShowFilterModal] = useState(false);

  // --- TOAST ---
  const [toast, setToast] = useState<string | null>(null);

  // Categorías (Discovery)
  const categories = getDiscoveryCategories();

  const getTierWeight = (pro: { user?: { roles?: string[] } }) => {
    const roles = pro.user?.roles || [];
    if (Array.isArray(roles)) {
        if (roles.includes('ROLE_PRO')) return 3;    // Prioridad Máxima
        if (roles.includes('ROLE_SOLVER')) return 2; // Prioridad Media
    }
    return 1; // Free
  };

  // --- CARGA DE DATOS ---
  const fetchTopPros = async () => {
      try {
          const response = await api.get('/professional_profiles?itemsPerPage=30');
          let pros = response.data['hydra:member'] || response.data['member'];
          
          if (pros) {
            // Orden aleatorio estable por sesión:
            // cambia al reiniciar app, no al entrar/salir de esta pantalla.
            const storedOrder = sessionStorage.getItem(TOP_PROS_ORDER_KEY);
            const orderById: Record<string, number> = storedOrder ? JSON.parse(storedOrder) : {};
            let updated = false;
            for (const pro of pros) {
                const id = String(pro.id ?? '');
                if (!id) continue;
                if (orderById[id] == null) {
                  orderById[id] = Math.random();
                  updated = true;
                }
            }
            if (updated) {
              sessionStorage.setItem(TOP_PROS_ORDER_KEY, JSON.stringify(orderById));
            }
            pros = [...pros].sort((a, b) => {
              const tierDiff = getTierWeight(b) - getTierWeight(a);
              if (tierDiff !== 0) return tierDiff;
              const aKey = orderById[String(a.id ?? '')] ?? 0;
              const bKey = orderById[String(b.id ?? '')] ?? 0;
              return aKey - bKey;
            });

            // Nos quedamos con los 5 mejores
            setTopPros(pros.slice(0, 5));
          }
      } catch (e) {
          console.error("Error top pros", e);
      } finally {
          setLoadingPros(false);
      }
  };

  const fetchRequests = async (event?: CustomEvent) => {
    if (!event) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('title', searchText);
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);
      if (sortPrice) {
          params.append('order[estimatedPriceMin]', sortPrice);
      } else {
          params.append('order[createdAt]', 'desc');
      }

      const response = await api.get<any>(`/requests?${params.toString()}`);
      const data = response.data;
      const memberList = data['hydra:member'] || data['member'];
      if (memberList) setRequests(memberList);
    } catch (error) {
      console.error("Error cargando requests:", error);
      setToast('Error al cargar. Arrastra para reintentar.');
    } finally {
      setLoading(false);
      event?.detail.complete();
    }
  };

  useIonViewWillEnter(() => { 
      fetchRequests();
      if (topPros.length === 0) fetchTopPros(); 
  });

  useEffect(() => { fetchRequests(); }, [filterStatus, filterCategory, sortPrice]);
  useEffect(() => {
    const onInvalidated = () => {
      fetchRequests();
    };
    window.addEventListener(REQUESTS_INVALIDATED_EVENT, onInvalidated);
    return () => window.removeEventListener(REQUESTS_INVALIDATED_EVENT, onInvalidated);
  }, [searchText, filterStatus, filterCategory, sortPrice]);

  // --- HANDLERS ---
  const resetModalFilters = () => { setFilterCategory(''); setSortPrice(''); };
  
  const goToDirectory = (category?: string) => {
    const url = category ? `/directory?category=${category}` : '/directory';
    history.push(url);
  };

  // --- HELPERS VISUALES ---
  const getStatusLabel = (status: RequestStatus) => {
    switch (status) { case 'COMPLETED': return 'FINALIZADO'; case 'ACCEPTED': return 'ASIGNADO'; case 'PENDING_APPROVAL': return 'EN REVISIÓN'; default: return 'PENDIENTE'; }
  };
  const getListingStatus = (status: RequestStatus): ListingStatusKey => {
      switch (status) {
        case 'COMPLETED': return 'completed';
        case 'ACCEPTED': return 'assigned';
        case 'PENDING_APPROVAL': return 'pending_approval';
        default: return 'pending';
      }
  };
  const STATUS_FILTER_CHIPS = [
    { value: 'ALL', label: 'Todas' },
    { value: 'PENDING', label: 'Pendientes' },
    { value: 'ACCEPTED', label: 'Asignadas' },
    { value: 'COMPLETED', label: 'Finalizadas' },
    { value: 'PENDING_APPROVAL', label: 'Validándose' },
  ];

  return (
    <IonPage>
      <LogoHeader />
      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <IonRefresher slot="fixed" onIonRefresh={fetchRequests}>
          <IonRefresherContent />
        </IonRefresher>

        <MainHeader 
            title={`Hola, ${JSON.parse(localStorage.getItem('user') || '{}').clientProfile.fullName?.split(' ')[0] || 'Cliente'}`}
            subtitle="Gestiona tus servicios o busca nuevos expertos."
        />
        <SegmentTab 
            value={viewMode}
            onValueChange={setViewMode}
            className="custom-segment"
            options={[
                { value: 'requests', label: 'Mis solicitudes', icon: listOutline },
                { value: 'discovery', label: 'Explorar', icon: compassOutline }
            ]}
        />

        <div className="request-list-container">
            
            {/* ================= VISTA 1: MIS SOLICITUDES ================= */}
            {viewMode === 'requests' && (
                <div className="animate__animated animate__fadeIn">
                    <SearchText 
                        value={searchText} 
                        onChange={setSearchText} 
                        onFilterClick={() => setShowFilterModal(true)} 
                        onSearch={fetchRequests}
                        placeholder="Buscar solicitud..." />

                    <FilterChipRow
                      options={STATUS_FILTER_CHIPS}
                      value={filterStatus}
                      onChange={setFilterStatus}
                    />

                    {loading && [1, 2, 3].map(i => (
                        <IonCard key={i} className="listing-card" style={{height: '140px'}}>
                            <IonCardContent>
                                <IonSkeletonText animated style={{ width: '35%', height: '12px' }} />
                                <IonSkeletonText animated style={{ width: '85%', height: '22px', marginTop: '12px' }} />
                                <IonSkeletonText animated style={{ width: '55%', height: '14px', marginTop: '12px' }} />
                            </IonCardContent>
                        </IonCard>
                    ))}

                    {!loading && requests.map((req) => {
                        const listingStatus = getListingStatus(req.status);
                        const preference = req.desiredExecutionTime?.trim();
                        const isUrgent = !preference || preference.toLowerCase() === 'lo antes posible';
                        return (
                            <ListingCard
                              key={req.id}
                              status={listingStatus}
                              category={req.category}
                              statusLabel={getStatusLabel(req.status)}
                              title={req.title}
                              price={{
                                variant: 'range',
                                value: formatRequestPriceRangeEuros(req),
                              }}
                              metaRows={[
                                { icon: locationOutline, text: req.address.split(',')[0] },
                                isUrgent
                                  ? { icon: flashOutline, text: 'Lo antes posible', tone: 'urgent' }
                                  : { icon: calendarOutline, text: preference!, tone: 'primary' },
                              ]}
                              onClick={() => history.push(`/request/${req.id}`)}
                              media={{
                                photoUrl: req.photoUrl,
                                videoUrl: req.videoUrl,
                                audioUrl: req.audioUrl,
                              }}
                              footer={{
                                personPrefix: req.assignedProfessional
                                  ? (req.status === 'COMPLETED' ? 'Finalizado por:' : 'Pro:')
                                  : undefined,
                                personName: req.assignedProfessional?.fullName,
                                rating: req.assignedProfessional?.rating,
                                mutedBackground: req.status === 'COMPLETED' && !!req.assignedProfessional,
                              }}
                            />
                        );
                    })}

                    {!loading && requests.length === 0 && (
                        <div className="ion-text-center ion-padding" style={{ marginTop: '20px' }}>
                            <div className="empty-icon-circle"><IonIcon icon={filterOutline} /></div>
                            <h2 style={{ color: '#1e293b', fontWeight: 800, marginTop: '20px' }}>Sin resultados</h2>
                            <p style={{ color: '#64748b' }}>No tienes solicitudes con estos filtros.</p>
                            <IonButton fill="outline" className="reset-btn" onClick={() => { setSearchText(''); setFilterStatus('ALL'); setFilterCategory(''); setSortPrice(''); }}>LIMPIAR FILTROS</IonButton>
                        </div>
                    )}
                </div>
            )}

            {/* ================= VISTA 2: EXPLORAR (DISCOVERY) ================= */}
            {viewMode === 'discovery' && (
                <div className="animate__animated animate__fadeIn">
                    <div className="discovery-search-wrapper" onClick={() => goToDirectory()}>
                        <div className="search-card-style">
                            <IonIcon icon={searchOutline} />
                            <span className="discovery-search-text">Encuentra electricistas, fontaneros...</span>
                        </div>
                    </div>

                    <div className="discovery-section-title">Categorías populares</div>
                    <div className="categories-grid">
                         {categories.map((cat) => (
                            <div key={cat.code} className="cat-card-item" onClick={() => goToDirectory(cat.code)}>
                                <div className="cat-icon-large" style={{background: cat.bg, color: cat.color}}>
                                    <IonIcon icon={cat.icon} />
                                </div>
                                <span className="cat-label-large">{cat.name}</span>
                            </div>
                        ))}
                        <div className="cat-card-item" onClick={() => goToDirectory()}>
                            <div className="cat-icon-large" style={{background: '#f1f5f9', color: '#64748b'}}>
                                <IonIcon icon={arrowForwardOutline} />
                            </div>
                            <span className="cat-label-large">Ver todo</span>
                        </div>
                    </div>

                    <div className="discovery-section-title" style={{marginTop:'30px'}}>
                        Profesionales top
                        <small onClick={() => goToDirectory()} style={{float:'right', color:'var(--ion-color-primary)', fontSize:'0.85rem'}}>Ver más</small>
                    </div>
                    <div className="pros-vertical-list">
                        {loadingPros ? (
                            [1,2,3].map(i => <div key={i} className="pro-card-skeleton"><IonSkeletonText animated /></div>)
                        ) : (
                            topPros.map((pro) => {
                                const tierWeight = getTierWeight(pro);
                                const isPro = tierWeight === 3;
                                const isSolver = tierWeight === 2;
                                const tierLabel = isPro ? 'PRO' : isSolver ? 'SOLVER' : 'FREE';
                                const tierBg = isPro ? 'var(--ion-color-primary)' : isSolver ? '#10b981' : '#94a3b8';

                                return (
                                    <div 
                                        key={pro.id} 
                                        className="pro-card-row" 
                                        onClick={() => history.push(`/directory/${pro.id}`)}
                                        style={{
                                            border: isPro ? '1px solid #4f46e5' : '1px solid #e2e8f0',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <IonAvatar className="pro-row-avatar">
                                                {pro.avatar ? <img src={resolveMediaUrl(pro.avatar)} alt="" /> : <span>{pro.fullName?.[0] ?? '?'}</span>}
                                            </IonAvatar>
                                            <span
                                                className="pro-row-tier-badge"
                                                style={{
                                                    position: 'absolute',
                                                    top: '-4px',
                                                    left: '-4px',
                                                    background: tierBg,
                                                    color: 'white',
                                                    fontSize: '0.55rem',
                                                    fontWeight: 800,
                                                    padding: '2px 5px',
                                                    borderRadius: '999px',
                                                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                                                }}
                                            >
                                                {tierLabel}
                                            </span>
                                        </div>
                                        <div className="pro-row-info">
                                            <div className="pro-row-name">
                                                {pro.fullName ?? 'Profesional'}
                                            </div>
                                            
                                            <div className="pro-row-cat" style={{color: '#64748b', fontSize: '0.85rem'}}>
                                                {pro.skills && Array.isArray(pro.skills) && pro.skills.length > 0
                                                  ? pro.skills.map((s) => getCategoryLabel(s)).join(', ')
                                                  : (getCategoryLabel(pro.category) || 'Profesional')}
                                            </div>

                                            <div className="pro-row-rating">
                                              {(() => {
                                                const numericRating =
                                                  typeof pro.rating === 'number'
                                                    ? pro.rating
                                                    : typeof pro.rating === 'string'
                                                      ? Number.parseFloat(pro.rating)
                                                      : NaN;
                                                const displayRating = Number.isFinite(numericRating)
                                                  ? numericRating.toFixed(1)
                                                  : '—';
                                                const reviewCount = pro.reviewCount ?? 0;

                                                return (
                                                  <>
                                                    <IonIcon icon={star} color="warning" /> {displayRating}{' '}
                                                    <span style={{color:'#94a3b8', fontSize:'0.75rem'}}>
                                                      ({reviewCount})
                                                    </span>
                                                  </>
                                                );
                                              })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="promo-banner">
                         <div className="promo-text">
                             <h3>Garantía Quira</h3>
                             <p>Tus trabajos asegurados y verificados.</p>
                         </div>
                         <IonIcon icon={checkmarkCircleOutline} />
                    </div>
                </div>
            )}
        </div>

        {/* ================= MODAL DE FILTROS ================= */}
        <FilterModal
            isOpen={showFilterModal}
            onDismiss={() => setShowFilterModal(false)}
            title="Filtros"
            resultsCount={requests.length}
            onApply={() => setShowFilterModal(false)}
            onClear={resetModalFilters}
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

export default RequestList;