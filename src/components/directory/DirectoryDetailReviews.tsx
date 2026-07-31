import React from 'react';
import { IonIcon } from '@ionic/react';
import { chatboxEllipsesOutline, star } from 'ionicons/icons';

interface Review {
  id: number | string;
  author: string;
  rating: number;
  text?: string;
  comment?: string;
  date: string;
}

interface DirectoryDetailReviewsProps {
  reviews: Review[];
}

export const DirectoryDetailReviews: React.FC<DirectoryDetailReviewsProps> = ({
  reviews,
}) => (
  <div className="section-block directory-detail-card" style={{ marginTop: '20px', paddingBottom: '40px' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '15px',
      }}
    >
      <div
        style={{
          background: '#fffbeb',
          padding: '6px',
          borderRadius: '8px',
        }}
      >
        <IonIcon icon={chatboxEllipsesOutline} style={{ color: '#d97706' }} />
      </div>
      <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: 800 }}>
        Opiniones{' '}
        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          ({reviews.length})
        </span>
      </h3>
    </div>

    {reviews.map((review) => {
      const comment = (review.text || review.comment || '').trim();
      return (
      <div
        key={review.id}
        style={{
          background: 'white',
          padding: '16px',
          borderRadius: '20px',
          marginBottom: '12px',
          border: '1px solid #f1f5f9',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: 800, color: '#1e293b' }}>{review.author}</span>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
            {review.date}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '2px',
            marginBottom: '8px',
          }}
        >
          {[...Array(5)].map((_, i) => (
            <IonIcon
              key={i}
              icon={star}
              style={{
                fontSize: '0.8rem',
                color: i < review.rating ? '#fbbf24' : '#e2e8f0',
              }}
            />
          ))}
        </div>
        {comment ? (
          <p
            style={{
              margin: '0',
              color: '#475569',
              fontSize: '0.9rem',
              fontStyle: 'italic',
            }}
          >
            &quot;{comment}&quot;
          </p>
        ) : null}
      </div>
      );
    })}
  </div>
);
