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
import { getCategoryLabel } from '../utils/categoryLabels';
import { LIST_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../utils/fetchFreshness';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const serverUrl = env.serverUrl;
const DIRECTORY_ORDER_KEY = 'directory-pro-order-v1';

const Directory: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  
  const categoryFilter = params.get('category') || '';

  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS);

  const getTierWeight = (pro: any) => {
    const roles = pro.user?.roles || [];
    if (Array.isArray(roles)) {
        if (roles.includes('ROLE_PRO')) return 3;
        if (roles.includes('ROLE_SOLVER')) return 2;
    }
    return 1;
  };

  const fetchPros = async (nameQuery: string) => {
    setLoading(true);
    try {
      let url = `/professional_profiles?itemsPerPage=${LIST_PAGE_SIZE}`;
      if (nameQuery) url += `&fullName=${encodeURIComponent(nameQuery)}`;
      
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

        // Orden aleatorio estable por sesión:
        // se calcula una vez por id y se reutiliza hasta cerrar/reabrir la app.
        const storedOrder = sessionStorage.getItem(DIRECTORY_ORDER_KEY);
        const orderById: Record<string, number> = storedOrder ? JSON.parse(storedOrder) : {};
        let updated = false;
        for (const pro of data) {
          const id = String(pro.id ?? '');
          if (!id) continue;
          if (orderById[id] == null) {
            orderById[id] = Math.random();
            updated = true;
          }
        }
        if (updated) {
          sessionStorage.setItem(DIRECTORY_ORDER_KEY, JSON.stringify(orderById));
        }
        data = [...data].sort((a, b) => {
          const tierDiff = getTierWeight(b) - getTierWeight(a);
          if (tierDiff !== 0) return tierDiff;
          const aKey = orderById[String(a.id ?? '')] ?? 0;
          const bKey = orderById[String(b.id ?? '')] ?? 0;
          return aKey - bKey;
        });

        setPros(data);
      }
    } catch (e) {
      console.error("Error cargando directorio:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPros(debouncedSearch);
  }, [debouncedSearch, categoryFilter]);

  const pageTitle = categoryFilter
    ? `Expertos en ${getCategoryLabel(categoryFilter)}`
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
              <span className="brand-text-secondary">i</span>
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
            {categoryFilter ? getCategoryLabel(categoryFilter) : 'Directorio'}
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
              categoryLabel={getCategoryLabel(categoryFilter)}
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