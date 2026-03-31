import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IonContent, IonPage,
  IonLabel, IonIcon, IonRefresher, IonRefresherContent, 
  useIonViewWillEnter, useIonRouter, IonButton,
  IonModal, IonSelect, IonSelectOption
} from '@ionic/react';
import { 
  briefcaseOutline, 
  alertCircleOutline, swapVerticalOutline,
  waterOutline, hammerOutline, flashOutline, brushOutline, leafOutline, listOutline, 
  checkmarkCircleOutline,
  starOutline,
  snowOutline,
  handLeftOutline,
} from 'ionicons/icons';
import api from '../api/axios';
import { Bid, ServiceRequest } from '../types';
import './MyWork.css'; 
import MainHeader from '../components/shared/MainHeader';
import { LogoHeader } from '../components/layout/LogoHeader';
import { SearchText } from '../components/shared/SearchText';
import { FilterModal } from '../components/shared/FilterModal';
import { SegmentTab } from '../components/shared/SegmentTab';
import { MyWorkBidCard, MyWorkJobCard } from '../components/mywork/MyWorkCards';

import { env } from '../config/env';
import { getCategoryLabel } from '../utils/categoryLabels';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { dedupeBidsByRequestForMyWork } from '../utils/bidDisplay';

const serverUrl = env.serverUrl;

const MyWork: React.FC = () => {
  const router = useIonRouter();
  
  // --- ESTADOS DE DATOS ---
  const [segment, setSegment] = useState<'bids' | 'jobs'>('bids');
  const [bids, setBids] = useState<Bid[]>([]);
  const [jobs, setJobs] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DE FILTROS ---
  const [searchText, setSearchText] = useState(''); 
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [sortPrice, setSortPrice] = useState<string>(''); 
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // --- AUDIO PLAYER ---
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Carga inicial: precargamos ambos segmentos para que los contadores sean correctos
  useIonViewWillEnter(() => {
    fetchData('bids');
    fetchData('jobs');
  });

  // Cuando cambian filtros, recargamos ambos segmentos para mantener los contadores al día
  useEffect(() => {
    fetchData('bids');
    fetchData('jobs');
  }, [searchText, filterCategory, sortPrice]);

  // Cuando cambia el segmento activo, recargamos ese segmento concreto por si acaso
  useEffect(() => {
    fetchData(segment);
  }, [segment]);

  const getIdFromIri = (resource: any): number => {
    if (!resource) return 0;
    if (typeof resource === 'number') return resource;
    if (resource.id) return Number(resource.id);
    let idStr = '';
    if (resource['@id']) {
        const parts = resource['@id'].split('/');
        idStr = parts[parts.length - 1];
    } else if (typeof resource === 'string') {
        const parts = resource.split('/');
        idStr = parts[parts.length - 1];
    }
    const id = parseInt(idStr, 10);
    return isNaN(id) ? 0 : id;
  };

  const resetFilters = () => {
      setFilterCategory('');
      setSortPrice('');
  };

  const displayBids = useMemo(() => dedupeBidsByRequestForMyWork(bids), [bids]);

  // --- HELPER VISUAL PARA CATEGORÍAS ---
  const getCategoryStyle = (catCode: string) => {
      const normalized = (catCode || '').toUpperCase();
      switch (normalized) {
          case 'PLUMBING': return { label: 'Fontanería', icon: waterOutline, color: '#3b82f6', bg: '#dbeafe' };
          case 'ELECTRICITY': return { label: 'Electricidad', icon: flashOutline, color: '#eab308', bg: '#fef9c3' };
          case 'MASONRY': return { label: 'Reformas', icon: hammerOutline, color: '#ef4444', bg: '#fee2e2' };
          case 'PAINTING': return { label: 'Pintura', icon: brushOutline, color: '#a855f7', bg: '#f3e8ff' };
          case 'GARDENING': return { label: 'Jardinería', icon: leafOutline, color: '#22c55e', bg: '#dcfce7' };
          case 'CLEANING': return { label: 'Limpieza', icon: starOutline, color: '#06b6d4', bg: '#cffafe' };
          case 'HVAC': return { label: 'Climatización', icon: snowOutline, color: '#64748b', bg: '#f1f5f9' };
          case 'DIY': return { label: 'Manitas', icon: handLeftOutline, color: '#63d8ce', bg: '#f1f5f9' };
          default: return { label: getCategoryLabel(catCode), icon: handLeftOutline, color: '#63d8ce', bg: '#f1f5f9' };
      }
  };

  // --- LÓGICA DE FETCH (CON FILTROS AL BACKEND) ---
  const fetchData = async (targetSegment = segment) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (targetSegment === 'bids') {
        // --- BIDS (MIS PROPUESTAS) ---
        params.append('my_bids', 'true');
        
        // Filtros para Bids
        if (searchText) params.append('request.title', searchText); // Busca en el título de la request
        if (filterCategory) params.append('request.category', filterCategory);
        if (sortPrice) params.append('order[priceQuote]', sortPrice); // Ordena por precio de TU propuesta
        else params.append('order[createdAt]', 'desc');
        
        const response = await api.get(`/bids?${params.toString()}`); 
        const data = response.data['hydra:member'] || response.data['member'] || [];
        setBids(data);

      } else {

        params.append('my_jobs', 'true');
        
        // Filtros para Requests
        if (searchText) params.append('title', searchText);
        if (filterCategory) params.append('category', filterCategory);
        if (sortPrice) params.append('order[estimatedPriceMin]', sortPrice); 
        else params.append('order[createdAt]', 'desc');

        const response = await api.get(`/requests?${params.toString()}`);
        const data = response.data['hydra:member'] || response.data['member'] || [];
        setJobs(data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleListAudio = (e: React.MouseEvent, reqId: number, audioUrl: string) => {
      e.stopPropagation(); e.preventDefault();
      if (playingAudioId === reqId) {
          audioRef.current?.pause(); setPlayingAudioId(null);
      } else {
          if (audioRef.current) audioRef.current.pause();
          const audio = new Audio(resolveMediaUrl(audioUrl));
          audio.onended = () => setPlayingAudioId(null);
          audioRef.current = audio;
          audio.play().catch(err => console.error("Error audio:", err));
          setPlayingAudioId(reqId);
      }
  };

  // --- RENDER DE TARJETA DE PROPUESTA (BID) ---
  const renderBid = (bid: Bid) => {
    if (!bid?.request || typeof bid.request === 'string') return null;
    const req = bid.request as ServiceRequest;
    const requestId = getIdFromIri(req);
    
    const assignedIri = typeof req.assignedProfessional === 'object' ? req.assignedProfessional?.['@id'] : req.assignedProfessional;
    const myIri = bid.professional?.professionalProfile?.['@id'];
    const isWon = req.status === 'ACCEPTED' && assignedIri === myIri;
    const isClosed = req.status === 'COMPLETED' || (req.status === 'ACCEPTED' && !isWon);
    const isCancelled = req.status === 'CANCELLED';
    const isBidRejected = bid.status === 'REJECTED';

    // Clases CSS aisladas (mw-)
    let borderClass = 'mw-card-pending';
    let statusLabel = 'PENDIENTE';
    let badgeClass = 'mw-status-pending';

    if (isWon) { borderClass = 'mw-card-won'; statusLabel = 'GANADA'; badgeClass = 'mw-status-won'; }
    else if (isBidRejected) { borderClass = 'mw-card-closed'; statusLabel = 'RETIRADA'; badgeClass = 'mw-status-rejected'; }
    else if (isCancelled) { borderClass = 'mw-card-closed'; statusLabel = 'CANCELADA'; badgeClass = 'mw-status-cancelled'; }
    else if (isClosed) { borderClass = 'mw-card-closed'; statusLabel = 'CERRADA'; badgeClass = 'mw-status-closed'; }

    const catStyle = getCategoryStyle(req.category);

    return (
      <MyWorkBidCard
        bid={bid}
        request={req}
        requestId={requestId}
        borderClass={borderClass}
        statusLabel={statusLabel}
        badgeClass={badgeClass}
        catStyle={catStyle}
        serverUrl={serverUrl}
        playingAudioId={playingAudioId}
        onToggleAudio={toggleListAudio}
        onClick={() => router.push(`/pro/request/${requestId}`)}
      />
    );
  };

  // --- RENDER DE TARJETA DE TRABAJO (JOB) ---
  const renderJob = (job: ServiceRequest) => {
    const isCompleted = job.status === 'COMPLETED';
    const borderClass = isCompleted ? 'mw-card-closed' : 'mw-card-won'; 
    const statusLabel = isCompleted ? 'FINALIZADO' : 'ASIGNADO';
    const badgeClass = isCompleted ? 'mw-status-closed' : 'mw-status-won';
    const dateToShow = job.createdAt;
    const jobId = getIdFromIri(job);

    const catStyle = getCategoryStyle(job.category);

    return (
      <MyWorkJobCard
        job={job}
        jobId={jobId}
        borderClass={borderClass}
        statusLabel={statusLabel}
        badgeClass={badgeClass}
        catStyle={catStyle}
        serverUrl={serverUrl}
        dateToShow={dateToShow}
        playingAudioId={playingAudioId}
        onToggleAudio={toggleListAudio}
        onClick={() => router.push(`/pro/request/${jobId}`)}
      />
    );
  };

  return (
    <IonPage>
      <LogoHeader />
      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        <IonRefresher
          slot="fixed"
          onIonRefresh={(e) =>
            Promise.all([fetchData('bids'), fetchData('jobs')]).then(() =>
              e.detail.complete()
            )
          }
        >
            <IonRefresherContent />
        </IonRefresher>
        <MainHeader 
            title="Mi Trabajo" 
            subtitle="Gestiona tus propuestas y trabajos en curso."
        />
        <SegmentTab
            value={segment}
            onValueChange={setSegment}
            className="custom-segment"
            options={[
                { value: 'bids', label: `Propuestas (${displayBids.length})`, icon: listOutline },
                { value: 'jobs', label: `Asignados (${jobs.length})`, icon: checkmarkCircleOutline }
            ]}
            />

        <div className="mywork-content-container">
            <SearchText
                value={searchText} 
                onChange={setSearchText} 
                onFilterClick={() => setShowFilterModal(true)} 
                onSearch={fetchData}
                placeholder={segment === 'bids' ? "Buscar en mis propuestas..." : "Buscar en mis trabajos..."} />

            {loading ? (
                [1,2,3,4].map(i => <div key={i} className="skeleton-item-estilo2" />)
            ) : (
                segment === 'bids' ? (
                    displayBids.length > 0 ? displayBids.map(renderBid) : (
                        <div className="empty-state-estilo2">
                            <IonIcon icon={briefcaseOutline} />
                            <p>{searchText ? 'No hay resultados' : 'No has enviado propuestas aún'}</p>
                        </div>
                    )
                ) : (
                    jobs.length > 0 ? jobs.map(renderJob) : (
                        <div className="empty-state-estilo2">
                            <IonIcon icon={alertCircleOutline} />
                            <p>{searchText ? 'No hay resultados' : 'No tienes trabajos activos'}</p>
                        </div>
                    )
                )
            )}
        </div>

        {/* ================= MODAL DE FILTROS ================= */}
        <FilterModal
            isOpen={showFilterModal}
            onDismiss={() => setShowFilterModal(false)}
            title="Filtros de Mi Trabajo"
            resultsCount={segment === 'bids' ? displayBids.length : jobs.length}
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
      </IonContent>
    </IonPage>
  );
};

export default MyWork;