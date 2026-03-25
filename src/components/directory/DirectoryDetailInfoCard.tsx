import React from 'react';
import { IonIcon } from '@ionic/react';
import { star, checkmarkCircle } from 'ionicons/icons';

interface DirectoryDetailInfoCardProps {
  fullName: string;
  subtitle: string;
  rating: string | number;
  completedJobs: string | number;
}

export const DirectoryDetailInfoCard: React.FC<DirectoryDetailInfoCardProps> = ({
  fullName,
  subtitle,
  rating,
  completedJobs,
}) => (
  <div
    className="info-card-detail-white animate__animated animate__fadeInUp"
    style={{
      background: 'white',
      borderRadius: '28px',
      padding: '24px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
      textAlign: 'center',
    }}
  >
    <h1
      style={{
        margin: '0',
        fontSize: '1.6rem',
        fontWeight: 900,
        color: '#1e293b',
      }}
    >
      {fullName}
    </h1>
    <p
      style={{
        margin: '5px 0 20px 0',
        color: '#64748b',
        fontWeight: 600,
      }}
    >
      {subtitle}
    </p>

    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        padding: '15px 0',
        borderTop: '1px solid #f1f5f9',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <IonIcon icon={star} style={{ color: '#fbbf24', fontSize: '1.2rem' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{rating || '5.0'}</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
          VALORACIÓN
        </span>
      </div>
      <div style={{ width: '1px', background: '#f1f5f9' }} />
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <IonIcon icon={checkmarkCircle} style={{ color: '#4f46e5', fontSize: '1.2rem' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{completedJobs || '0'}</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
          TRABAJOS
        </span>
      </div>
    </div>
  </div>
);
