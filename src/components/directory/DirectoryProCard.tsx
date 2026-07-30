import React from 'react';
import { IonAvatar, IonIcon } from '@ionic/react';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { getCategoryLabel } from '../../utils/categoryLabels';
import { formatQuiraMemberSince } from '../../utils/formatQuiraMemberSince';
import { star } from 'ionicons/icons';

interface DirectoryProCardProps {
  pro: {
    id: number;
    fullName: string;
    avatar?: string;
    rating?: string | number;
    reviewCount?: number;
    skills?: string[];
    category?: { name?: string };
    user?: { roles?: string[] };
    reviews?: Array<{ score?: number }>;
    createdAt?: string;
  };
  serverUrl: string;
  isPro: boolean;
  isSolver: boolean;
  onClick: () => void;
}

export const DirectoryProCard: React.FC<DirectoryProCardProps> = ({
  pro,
  serverUrl,
  isPro,
  isSolver,
  onClick,
}) => {
  const numericRating =
    typeof pro.rating === 'number'
      ? pro.rating
      : typeof pro.rating === 'string'
        ? Number.parseFloat(pro.rating)
        : NaN;

  const displayRating = Number.isFinite(numericRating)
    ? numericRating.toFixed(1)
    : '—';

  const tier = isPro ? 'PRO' : isSolver ? 'SOLVER' : 'FREE';
  const tierStyles: Record<string, { bg: string; color: string }> = {
    PRO: { bg: 'var(--ion-color-primary)', color: 'white' },
    SOLVER: { bg: '#10b981', color: 'white' },
    FREE: { bg: '#94a3b8', color: 'white' },
  };
  const tierStyle = tierStyles[tier];
  const memberSince = formatQuiraMemberSince(pro.createdAt);

  return (
  <div
    className="pro-card-row"
    onClick={onClick}
    style={{
      marginBottom: '12px',
      background: 'white',
      padding: '16px',
      borderRadius: '24px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)',
      border: isPro ? '1px solid var(--ion-color-primary)' : '1px solid #f1f5f9',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    }}
  >
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <IonAvatar
        className="directory-pro-avatar"
        style={{
          width: '56px',
          height: '56px',
          minWidth: '56px',
          minHeight: '56px',
          border: '2px solid #f1f5f9',
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        {pro.avatar ? (
          <img src={resolveMediaUrl(pro.avatar)} style={{ objectFit: 'cover', width: '100%', height: '100%' }} alt="" />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#eef2ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
              color: 'var(--ion-color-primary)',
            }}
          >
            {pro.fullName?.[0] || '?'}
          </div>
        )}
      </IonAvatar>
      <span
        className="directory-tier-badge"
        style={{
          position: 'absolute',
          top: '-4px',
          left: '-4px',
          background: tierStyle.bg,
          color: tierStyle.color,
          fontSize: '0.55rem',
          fontWeight: 800,
          padding: '2px 5px',
          borderRadius: '999px',
          boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
        }}
      >
        {tier}
      </span>
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontWeight: 800,
            color: '#1e293b',
            fontSize: '1rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {pro.fullName}
        </span>
      </div>

      <div
        style={{
          color: '#64748b',
          fontSize: '0.8rem',
          margin: '2px 0 6px 0',
          fontWeight: 500,
        }}
      >
        {pro.skills && Array.isArray(pro.skills) && pro.skills.length > 0
          ? pro.skills
              .map((s) => getCategoryLabel(s))
              .join(' • ')
          : getCategoryLabel(pro.category) || 'Especialista'}
      </div>

      {memberSince && (
        <div
          style={{
            color: '#94a3b8',
            fontSize: '0.72rem',
            fontWeight: 500,
            margin: '-2px 0 6px 0',
          }}
        >
          {memberSince}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <IonIcon icon={star} style={{ color: '#fbbf24', fontSize: '0.9rem' }} />
        <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.85rem' }}>
          {displayRating}
        </span>
        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
          ({pro.reviewCount ?? 0})
        </span>
      </div>
    </div>
  </div>
  );
};
