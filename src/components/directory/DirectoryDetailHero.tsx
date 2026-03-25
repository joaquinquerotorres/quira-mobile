import React from 'react';
import { IonAvatar, IonIcon } from '@ionic/react';
import { resolveMediaUrl } from '../../utils/mediaUrl';

interface TierInfo {
  label: string;
  color: string;
  icon: React.ComponentProps<typeof IonIcon>['icon'];
}

interface DirectoryDetailHeroProps {
  fullName: string;
  avatar?: string;
  serverUrl: string;
  tier: TierInfo | null;
}

export const DirectoryDetailHero: React.FC<DirectoryDetailHeroProps> = ({
  fullName,
  avatar,
  serverUrl,
  tier,
}) => (
  <div
    className="market-hero-bg animate__animated animate__fadeIn"
    style={{
      height: '220px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    <div className="detail-avatar-wrapper">
      <IonAvatar
        className="detail-avatar"
        style={{
          width: '100px',
          height: '100px',
          border: '4px solid white',
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
        }}
      >
        {avatar ? (
          <img src={resolveMediaUrl(avatar)} style={{ objectFit: 'cover' }} alt="" />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--ion-color-primary)',
            }}
          >
            {fullName?.[0] || '?'}
          </div>
        )}
      </IonAvatar>

      {tier && (
        <div
          className="detail-tier-badge"
          style={{
            background: tier.color,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            border: '3px solid white',
          }}
        >
          <IonIcon icon={tier.icon} /> {tier.label}
        </div>
      )}
    </div>
  </div>
);
