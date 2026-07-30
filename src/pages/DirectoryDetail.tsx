import React, { useState, useEffect } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonButtons, IonButton,
  IonSpinner, IonIcon, IonTitle
} from '@ionic/react';
import { hammerOutline, shieldCheckmarkOutline, chevronBackOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import api from '../api/axios';
import './DirectoryDetail.css';
import '../components/layout/LogoHeader.css';
import { DirectoryDetailHero } from '../components/directory/DirectoryDetailHero';
import { DirectoryDetailInfoCard } from '../components/directory/DirectoryDetailInfoCard';
import { DirectoryDetailBio } from '../components/directory/DirectoryDetailBio';
import { DirectoryDetailSkills } from '../components/directory/DirectoryDetailSkills';
import { DirectoryDetailReviews } from '../components/directory/DirectoryDetailReviews';
import { getCategoryLabel } from '../utils/categoryLabels';

import { env } from '../config/env';

const serverUrl = env.serverUrl;

const DirectoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [pro, setPro] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getTierInfo = (pro: any) => {
    const roles = pro.user?.roles || [];
    if (Array.isArray(roles)) {
        if (roles.includes('ROLE_PRO')) return { label: 'PRO', color: 'var(--ion-color-primary)', icon: shieldCheckmarkOutline };
        if (roles.includes('ROLE_SOLVER')) return { label: 'SOLVER', color: '#10b981', icon: hammerOutline };
    }
    return null;
  };

  useEffect(() => {
    const fetchProDetail = async () => {
      try {
        const response = await api.get(`/professional_profiles/${id}`);
        setPro(response.data);
      } catch (error) {
        console.error("Error fetching detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProDetail();
  }, [id]);

  if (loading) {
    return (
      <IonPage>
        <IonHeader className="ion-no-border">
            <IonToolbar color="primary">
                <IonButtons slot="start">
                    <IonButton onClick={() => history.goBack()} style={{color: 'white'}}>
                        <IonIcon icon={chevronBackOutline} />
                    </IonButton>
                </IonButtons>
            </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
            <IonSpinner name="crescent" color="primary" style={{marginTop: '50px'}}/>
        </IonContent>
      </IonPage>
    );
  }

  if (!pro) return <IonPage><IonContent>No encontrado</IonContent></IonPage>;

  const tier = getTierInfo(pro);

  // Normalizar reviews del backend (id, score, comment, createdAt) al formato de UI
  const rawReviews = Array.isArray(pro.reviews) ? pro.reviews : [];
  const reviews = rawReviews.map((r: any) => ({
    id: r.id,
    author: r.authorName || 'Usuario de Quira',
    rating: typeof r.score === 'number' ? r.score : 0,
    text: r.comment,
    comment: r.comment,
    date: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '',
  }));

  const reviewCount = pro.reviewCount ?? reviews.length ?? 0;
  const averageRating =
    typeof pro.rating === 'number'
      ? pro.rating
      : reviews.length
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
        : null;

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
        <DirectoryDetailHero
          fullName={pro.fullName}
          avatar={pro.avatar}
          serverUrl={serverUrl}
          tier={tier}
        />

        <div className="market-content-container" style={{ marginTop: '-45px' }}>
          <DirectoryDetailInfoCard
            fullName={pro.fullName}
            subtitle={getCategoryLabel(pro.skills?.[0] || pro.category?.name) || 'Profesional'}
            rating={averageRating != null ? averageRating.toFixed(1) : '—'}
            completedJobs={reviewCount}
            createdAt={pro.createdAt}
          />

          <div className="detail-body-sections animate__animated animate__fadeInUp" style={{ padding: '0 5px' }}>
            <DirectoryDetailBio
              text={pro.biography || pro.bio || 'Profesional verificado y comprometido con la excelencia en cada intervención.'}
            />
            <DirectoryDetailSkills skills={pro.skills || []} />
            <DirectoryDetailReviews reviews={reviews} />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DirectoryDetail;