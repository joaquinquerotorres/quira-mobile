import React from 'react';
import { IonIcon, IonChip, IonLabel, IonNote } from '@ionic/react';
import { ribbonOutline } from 'ionicons/icons';

const SKILL_LABELS: Record<string, string> = {
  MASONRY: 'Albañilería',
  PLUMBING: 'Fontanería',
  ELECTRICITY: 'Electricidad',
  HVAC: 'Climatización',
  DIY: 'Manitas / Bricolaje',
  CLEANING: 'Limpieza',
  PAINTING: 'Pintura',
  GARDENING: 'Jardinería',
};

interface DirectoryDetailSkillsProps {
  skills: string[];
}

export const DirectoryDetailSkills: React.FC<DirectoryDetailSkillsProps> = ({
  skills,
}) => (
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
          background: '#ecfdf5',
          padding: '6px',
          borderRadius: '8px',
        }}
      >
        <IonIcon icon={ribbonOutline} style={{ color: '#10b981' }} />
      </div>
      <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: 800 }}>
        Especialidades
      </h3>
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {skills && skills.length > 0 ? (
        skills.map((skill: string, index: number) => (
          <IonChip
            key={index}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              fontWeight: 700,
              margin: '0',
            }}
          >
            <IonLabel>{SKILL_LABELS[skill] || skill}</IonLabel>
          </IonChip>
        ))
      ) : (
        <IonNote>Especialista general</IonNote>
      )}
    </div>
  </div>
);
