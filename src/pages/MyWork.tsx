import React, { useState, useEffect, useMemo } from 'react';
import {
  IonContent, IonPage,
  IonLabel, IonIcon, IonRefresher, IonRefresherContent, 
  useIonViewWillEnter, useIonRouter, IonButton,
  IonModal, IonSelect, IonSelectOption
} from '@ionic/react';
import {
  briefcaseOutline, 
  alertCircleOutline, swapVerticalOutline,
  listOutline, 
  checkmarkCircleOutline,
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

import { dedupeBidsByRequestForMyWork } from '../utils/bidDisplay';
import { REQUESTS_INVALIDATED_EVENT } from '../utils/requestEvents';

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
  useEffect(() => {
    const onInvalidated = () => {
      fetchData('bids');
      fetchData('jobs');
    };
    window.addEventListener(REQUESTS_INVALIDATED_EVENT, onInvalidated);
    return () => window.removeEventListener(REQUESTS_INVALIDATED_EVENT, onInvalidated);
  }, [searchText, filterCategory, sortPrice, segment]);

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

  // --- RENDER DE TARJETA DE PROPUESTA (BID) ---
  const renderBid = (bid: Bid) => {
    if (!bid?.request || typeof bid.request === 'string') return null;
    const req = bid.request as ServiceRequest;
    const requestId = getIdFromIri(req);
    
    const assignedIri = typeof req.assignedProfessional === 'object' ? req.assignedProfessional?.['@id'] : req.assignedProfessional;
    const myIri = bid.professional?.professionalProfile?.['@id'];
    const isWon = req.status === 'ACCEPTED' && assignedIri === myIri;
    const isClosed = req.status === 'COMPLETED' || (req.status === 'ACCEPTED' && !isWon);

    // Clases / tokens de estado compartidos
    let status: 'pending' | 'assigned' | 'completed' = 'pending';
    let statusLabel = 'PENDIENTE';

    if (isWon) { status = 'assigned'; statusLabel = 'GANADA'; }
    else if (isClosed) { status = 'completed'; statusLabel = 'CERRADA'; }

    return (
      <MyWorkBidCard
        bid={bid}
        request={req}
        status={status}
        statusLabel={statusLabel}
        onClick={() => router.push(`/pro/request/${requestId}`)}
      />
    );
  };

  // --- RENDER DE TARJETA DE TRABAJO (JOB) ---
  const renderJob = (job: ServiceRequest) => {
    const isCompleted = job.status === 'COMPLETED';
    const status = isCompleted ? 'completed' as const : 'assigned' as const;
    const statusLabel = isCompleted ? 'FINALIZADO' : 'ASIGNADO';
    const dateToShow = job.createdAt;
    const jobId = getIdFromIri(job);

    return (
      <MyWorkJobCard
        job={job}
        status={status}
        statusLabel={statusLabel}
        dateToShow={dateToShow}
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