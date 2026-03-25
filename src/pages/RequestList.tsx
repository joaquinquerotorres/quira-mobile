import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage,
  IonCard, IonCardContent, IonIcon, IonRefresher, IonRefresherContent,
  useIonViewWillEnter, IonSkeletonText, IonButton,
  IonChip, IonLabel, IonSelect, IonSelectOption,
  IonAvatar, IonToast
} from '@ionic/react';
import { 
  locationOutline, calendarOutline, flashOutline, 
  arrowForwardOutline, star, checkmarkCircleOutline, filterOutline, 
  swapVerticalOutline, checkmarkDoneOutline, 
  playCircleOutline, micOutline, pauseCircleOutline, searchOutline,
  waterOutline, hammerOutline, leafOutline, brushOutline,
  compassOutline, listOutline,
  snowOutline,
  starOutline,
  handLeftOutline
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
import { RequestMediaThumb } from '../components/shared/RequestMediaThumb';

import { getCategoryLabel } from '../utils/categoryLabels';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { shuffleArray } from '../utils/shuffle';


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

  // --- AUDIO ---
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Categorías (Discovery)
  const categories = [
    { code: 'PLUMBING', name: 'Fontanería', icon: waterOutline, color: '#3b82f6' },
    { code: 'ELECTRICITY', name: 'Electricidad', icon: flashOutline, color: '#eab308' },
    { code: 'MASONRY', name: 'Reformas', icon: hammerOutline, color: '#ef4444' },
    { code: 'PAINTING', name: 'Pintura', icon: brushOutline, color: '#a855f7' },
    { code: 'GARDENING', name: 'Jardinería', icon: leafOutline, color: '#22c55e' },
    { code: 'CLEANING', name: 'Limpieza', icon: starOutline, color: '#22c55e' },
    { code: 'HVAC', name: 'Climatización', icon: snowOutline, color: '#64748b' },
    { code: 'DIY', name: 'Manitas', icon: handLeftOutline, color: '#63d8ce' },
  ];

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
            // Agrupar por tier (PRO=3, SOLVER=2, FREE=1) y barajar dentro de cada grupo
            const byWeight = new Map<number, any[]>();
            for (const pro of pros) {
                const w = getTierWeight(pro);
                if (!byWeight.has(w)) byWeight.set(w, []);
                byWeight.get(w)!.push(pro);
            }
            pros = [3, 2, 1].flatMap((w) => shuffleArray(byWeight.get(w) || []));

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
          params.append('order[priceAmount]', sortPrice);
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

  // --- HANDLERS ---
  const resetModalFilters = () => { setFilterCategory(''); setSortPrice(''); };
  
  const goToDirectory = (category?: string) => {
    const url = category ? `/directory?category=${category}` : '/directory';
    history.push(url);
  };

  // --- AUDIO LOGIC ---
  const toggleListAudio = (e: React.MouseEvent, reqId: number, audioUrl: string) => {
      e.stopPropagation(); e.preventDefault();
      if (playingAudioId === reqId) {
          audioRef.current?.pause(); setPlayingAudioId(null);
      } else {
          if (audioRef.current) audioRef.current.pause();
          const audio = new Audio(resolveMediaUrl(audioUrl));
          audio.onended = () => setPlayingAudioId(null);
          audioRef.current = audio;
          audio.play(); setPlayingAudioId(reqId);
      }
  };

  // --- HELPERS VISUALES ---
  const getStatusLabel = (status: RequestStatus) => {
    switch (status) { case 'COMPLETED': return 'FINALIZADO'; case 'ACCEPTED': return 'ASIGNADO'; case 'CANCELLED': return 'CANCELADA'; case 'PENDING_APPROVAL': return 'EN REVISIÓN'; default: return 'PENDIENTE'; }
  };
  const getStatusColorClass = (status: RequestStatus) => {
      switch (status) { case 'COMPLETED': return 'request-status-completed'; case 'ACCEPTED': return 'request-status-accepted'; case 'CANCELLED': return 'request-status-cancelled'; case 'PENDING_APPROVAL': return 'request-status-pending-approval'; default: return 'request-status-pending'; }
  };
  const renderScheduleInfo = (isoString?: string | null) => {
    const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', marginTop: '6px', fontSize: '0.75rem', fontWeight: 600 };
    if (!isoString) return (<div style={{...rowStyle, color: '#ea580c'}}><IonIcon icon={flashOutline} style={{marginRight: '4px', fontSize: '14px'}} /><span>Lo antes posible</span></div>);
    const date = new Date(isoString);
    return (<div style={{...rowStyle, color: '#4f46e5'}}><IonIcon icon={calendarOutline} style={{marginRight: '4px', fontSize: '14px'}} /><span>{date.toLocaleDateString('es-ES', {day: 'numeric', month: 'long'})}</span></div>);
  };

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

                    <div className="request-list-filter-chips-container">
                        <IonChip className={filterStatus === 'ALL' ? 'active-chip' : 'inactive-chip'} onClick={() => setFilterStatus('ALL')}><IonLabel>Todas</IonLabel></IonChip>
                        <IonChip className={filterStatus === 'PENDING' ? 'active-chip' : 'inactive-chip'} onClick={() => setFilterStatus('PENDING')}><IonLabel>Pendientes</IonLabel></IonChip>
                        <IonChip className={filterStatus === 'ACCEPTED' ? 'active-chip' : 'inactive-chip'} onClick={() => setFilterStatus('ACCEPTED')}><IonLabel>Asignadas</IonLabel></IonChip>
                        <IonChip className={filterStatus === 'COMPLETED' ? 'active-chip' : 'inactive-chip'} onClick={() => setFilterStatus('COMPLETED')}><IonLabel>Finalizadas</IonLabel></IonChip>
                        <IonChip className={filterStatus === 'CANCELLED' ? 'active-chip' : 'inactive-chip'} onClick={() => setFilterStatus('CANCELLED')}><IonLabel>Canceladas</IonLabel></IonChip>
                        <IonChip className={filterStatus === 'PENDING_APPROVAL' ? 'active-chip' : 'inactive-chip'} onClick={() => setFilterStatus('PENDING_APPROVAL')}><IonLabel>Validándose</IonLabel></IonChip>
                    </div>

                    {loading && [1, 2, 3].map(i => (
                        <IonCard key={i} className="request-list-card" style={{height: '160px'}}>
                            <IonCardContent>
                                <div style={{ display: 'flex' }}>
                                    <IonSkeletonText animated style={{ width: '100px', height: '100px', borderRadius: '16px', marginRight: '15px' }} />
                                    <div style={{ width: '100%' }}>
                                        <IonSkeletonText animated style={{ width: '40%', height: '12px' }} />
                                        <IonSkeletonText animated style={{ width: '80%', height: '22px', marginTop: '10px' }} />
                                    </div>
                                </div>
                            </IonCardContent>
                        </IonCard>
                    ))}

                    {!loading && requests.map((req) => {
                        const borderClass = req.status === 'COMPLETED' ? 'card-status-completed' : req.status === 'ACCEPTED' ? 'card-status-accepted' : req.status === 'CANCELLED' ? 'card-status-cancelled' : 'card-status-pending';
                        return (
                            <IonCard key={req.id} routerLink={`/request/${req.id}`} button className={`request-list-card ${borderClass}`}>
                                <div className="request-list-card-body">
                                    <div className="request-list-thumb-wrap">
                                        <RequestMediaThumb
                                          variant="requestList"
                                          requestId={req.id!}
                                          photoSrc={req.photoUrl ? resolveMediaUrl(req.photoUrl) : undefined}
                                          audioUrl={req.audioUrl}
                                          videoUrl={req.videoUrl}
                                          playingAudioId={playingAudioId}
                                          onToggleAudio={toggleListAudio}
                                        />
                                        <span className={`request-list-status-badge ${getStatusColorClass(req.status)}`}>{getStatusLabel(req.status)}</span>
                                    </div>
                                    <div className="request-list-card-content">
                                        <div className="request-list-card-top-row">
                                            <span className="request-list-card-category">{getCategoryLabel(req.category)}</span>
                                        </div>
                                        <h3 className="request-list-card-title">{req.title}</h3>
                                        <div className="request-list-info-row">
                                            <IonIcon icon={locationOutline} />
                                            <span>{req.address.split(',')[0]}</span>
                                        </div>
                                        {renderScheduleInfo(req.scheduledAt)}
                                    </div>
                                    <div className="request-list-card-right">
                                        <span className="request-list-card-price">{req.priceAmount}€</span>
                                        <div className="arrow-box"><IonIcon icon={arrowForwardOutline} /></div>
                                    </div>
                                </div>
                                {req.assignedProfessional && (
                                <div className="request-list-card-footer" style={{background: req.status === 'COMPLETED' ? '#f1f5f9' : '#ffffff'}}>
                                    <div className="request-list-footer-left">
                                        <div style={{display:'flex', alignItems: 'center'}}>
                                            <div className={`pro-icon-bg ${req.status === 'COMPLETED' ? 'gray' : 'blue'}`}><IonIcon icon={req.status === 'COMPLETED' ? checkmarkDoneOutline : checkmarkCircleOutline} /></div>
                                            <span className="request-list-footer-text">{req.status === 'COMPLETED' ? 'Finalizado por:' : 'Pro:'} {req.assignedProfessional.fullName}</span>
                                        </div>
                                    </div>
                                    {req.assignedProfessional.rating && <div className="rating-badge"><IonIcon icon={star} /> {req.assignedProfessional.rating}</div>}
                                </div>
                                )}
                            </IonCard>
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
                                <div className="cat-icon-large" style={{background: `${cat.color}15`, color: cat.color}}>
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
                                                  ? pro.skills.slice(0, 3).map((s) => getCategoryLabel(s)).join(', ')
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
                                        <IonIcon icon={arrowForwardOutline} color="medium" />
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

export default RequestList;