import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonSpinner, IonIcon, IonButton
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import api from '../api/axios';
import './RequestList.css';
import { DirectoryProCard } from '../components/directory/DirectoryProCard';
import { DirectorySearchBar } from '../components/directory/DirectorySearchBar';
import { DirectoryCategoryChip } from '../components/directory/DirectoryCategoryChip';
import { DirectoryEmptyState } from '../components/directory/DirectoryEmptyState';

import { env } from '../config/env';
import { shuffleArray } from '../utils/shuffle';

const serverUrl = env.serverUrl;

const Directory: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  
  const categoryFilter = params.get('category') || '';

  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const getTierWeight = (pro: any) => {
    const roles = pro.user?.roles || [];
    if (Array.isArray(roles)) {
        if (roles.includes('ROLE_PRO')) return 3;
        if (roles.includes('ROLE_SOLVER')) return 2;
    }
    return 1;
  };

  const categoryNames: Record<string, string> = {
      'PLUMBING': 'Fontanería',
      'ELECTRICITY': 'Electricidad',
      'MASONRY': 'Reformas',
      'PAINTING': 'Pintura',
      'GARDENING': 'Jardinería',
      'CLEANING': 'Limpieza',
      'HVAC': 'Climatización',
      'DIY': 'Manitas',
  };

  const fetchPros = async () => {
    setLoading(true);
    try {
      let url = `/professional_profiles?itemsPerPage=50`;
      if (searchText) url += `&fullName=${searchText}`;
      
      const response = await api.get(url);
      let data = response.data['hydra:member'] || response.data['member'];

      if (data) {
        if (categoryFilter) {
            const filterUpper = categoryFilter.toUpperCase();
            data = data.filter((pro: any) => {
                if (pro.skills && Array.isArray(pro.skills)) {
                    return pro.skills.includes(filterUpper);
                }
                const pCat = pro.category;
                if (pCat) {
                    const pCatString = (typeof pCat === 'object') ? (pCat.code || pCat.id || pCat.name || '') : pCat;
                    return pCatString.toUpperCase().includes(filterUpper);
                }
                return false;
            });
        }

        // Agrupar por tier (PRO=3, SOLVER=2, FREE=1) y barajar dentro de cada grupo
        const byWeight = new Map<number, any[]>();
        for (const pro of data) {
            const w = getTierWeight(pro);
            if (!byWeight.has(w)) byWeight.set(w, []);
            byWeight.get(w)!.push(pro);
        }
        data = [3, 2, 1].flatMap((w) => shuffleArray(byWeight.get(w) || []));

        setPros(data);
      }
    } catch (e) {
      console.error("Error cargando directorio:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPros();
  }, [searchText, categoryFilter]); 

  const pageTitle = categoryFilter && categoryNames[categoryFilter] 
    ? `Expertos en ${categoryNames[categoryFilter]}` 
    : 'Directorio Pro';

  return (
    <IonPage>
      {/* HEADER ESTILO 2 */}
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary" style={{ '--padding-top': '10px' }}>
          <IonButtons slot="start">
            <IonButton onClick={() => history.goBack()} style={{ color: 'white' }}>
              <IonIcon icon={chevronBackOutline} style={{ fontSize: '24px' }} />
            </IonButton>
          </IonButtons>
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
          <IonButtons slot="end" style={{ width: '48px' }} />
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
        {/* HERO ESTILO 2 */}
        <div className="market-hero-bg animate__animated animate__fadeIn">
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white', margin: '0 0 8px 0' }}>
            {categoryFilter ? categoryNames[categoryFilter] : 'Directorio'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>
             {loading ? 'Buscando...' : `Tenemos ${pros.length} profesionales listos`}
          </p>
        </div>

        <div className="market-content-container" style={{ marginTop: '-40px' }}>
          <DirectorySearchBar
            value={searchText}
            onChange={setSearchText}
          />

          {categoryFilter && (
            <DirectoryCategoryChip
              categoryLabel={categoryNames[categoryFilter] || categoryFilter}
              onClear={() => history.push('/directory')}
            />
          )}

          {loading ? (
            <div className="ion-text-center" style={{ marginTop: '40px' }}>
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : pros.length === 0 ? (
            <DirectoryEmptyState onViewAll={() => history.push('/directory')} />
          ) : (
            <div className="pros-vertical-list animate__animated animate__fadeInUp">
              {pros.map((pro) => (
                <DirectoryProCard
                  key={pro.id}
                  pro={pro}
                  serverUrl={serverUrl}
                  isPro={getTierWeight(pro) === 3}
                  isSolver={getTierWeight(pro) === 2}
                  onClick={() => history.push(`/directory/${pro.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Directory;