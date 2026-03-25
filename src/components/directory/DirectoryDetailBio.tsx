import React from 'react';
import { IonIcon } from '@ionic/react';
import { personOutline } from 'ionicons/icons';

interface DirectoryDetailBioProps {
  text: string;
}

export const DirectoryDetailBio: React.FC<DirectoryDetailBioProps> = ({ text }) => (
  <div className="section-block directory-detail-card" style={{ marginTop: '20px' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          background: '#eef2ff',
          padding: '6px',
          borderRadius: '8px',
        }}
      >
        <IonIcon icon={personOutline} style={{ color: '#4f46e5' }} />
      </div>
      <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: 800 }}>
        Sobre el profesional
      </h3>
    </div>
    <p
      style={{
        color: '#475569',
        lineHeight: '1.6',
        fontSize: '0.95rem',
        margin: '0',
      }}
    >
      {text}
    </p>
  </div>
);
