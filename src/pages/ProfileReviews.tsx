import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  useIonRouter,
} from '@ionic/react';
import { chevronBackOutline, star } from 'ionicons/icons';
import { SegmentTab } from '../components/shared/SegmentTab';
import { getEffectiveActiveMode } from '../utils/activeMode';
import {
  averageRating,
  fetchProProfileEmbeddedReviews,
  fetchReviewsByAuthor,
  fetchReviewsByTarget,
  filterReceivedByMode,
  type ProfileReviewItem,
} from '../utils/reviewsApi';
import './Profile.css';
import './ProfileReviews.css';

type Tab = 'received' | 'given';

function StarsRow({ rating }: { rating: number }) {
  return (
    <div className="profile-reviews-stars" aria-label={`${rating} de 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <IonIcon
          key={i}
          icon={star}
          className={i < rating ? 'profile-reviews-star--on' : 'profile-reviews-star--off'}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  mode,
}: {
  review: ProfileReviewItem;
  mode: Tab;
}) {
  const name = mode === 'received' ? review.authorName : review.targetName;
  return (
    <article className="profile-reviews-card">
      <div className="profile-reviews-card-top">
        <span className="profile-reviews-card-name">{name}</span>
        {review.dateLabel ? (
          <span className="profile-reviews-card-date">{review.dateLabel}</span>
        ) : null}
      </div>
      <StarsRow rating={review.rating} />
      {review.requestTitle ? (
        <p className="profile-reviews-card-job">{review.requestTitle}</p>
      ) : null}
      {review.comment ? (
        <p className="profile-reviews-card-comment">&ldquo;{review.comment}&rdquo;</p>
      ) : (
        <p className="profile-reviews-card-comment profile-reviews-card-comment--empty">
          Sin comentario
        </p>
      )}
    </article>
  );
}

const ProfileReviews: React.FC = () => {
  const router = useIonRouter();
  const [tab, setTab] = useState<Tab>('received');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [received, setReceived] = useState<ProfileReviewItem[]>([]);
  const [given, setGiven] = useState<ProfileReviewItem[]>([]);
  const [profileAverage, setProfileAverage] = useState<number | null>(null);
  const [profileCount, setProfileCount] = useState(0);

  const activeMode = getEffectiveActiveMode();

  const load = useCallback(async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userStr) as {
      id: number;
      clientProfile?: { rating?: number | null; reviewCount?: number };
      professionalProfile?: {
        id?: number;
        rating?: number | null;
        reviewCount?: number;
      };
    };

    const mode = getEffectiveActiveMode();
    if (mode === 'pro' && user.professionalProfile) {
      setProfileAverage(
        typeof user.professionalProfile.rating === 'number'
          ? user.professionalProfile.rating
          : null
      );
      setProfileCount(user.professionalProfile.reviewCount ?? 0);
    } else if (user.clientProfile) {
      setProfileAverage(
        typeof user.clientProfile.rating === 'number' ? user.clientProfile.rating : null
      );
      setProfileCount(user.clientProfile.reviewCount ?? 0);
    } else {
      setProfileAverage(null);
      setProfileCount(0);
    }

    setLoading(true);
    setError(null);

    try {
      const givenPromise = fetchReviewsByAuthor(user.id).catch((err) => {
        console.error(err);
        return null as ProfileReviewItem[] | null;
      });

      let receivedItems: ProfileReviewItem[] = [];
      let receivedError: string | null = null;
      try {
        receivedItems = await fetchReviewsByTarget(user.id);
      } catch {
        // Backend may not expose target filter yet — pro fallback via profile embed.
        if (mode === 'pro' && user.professionalProfile?.id != null) {
          try {
            receivedItems = await fetchProProfileEmbeddedReviews(
              user.professionalProfile.id
            );
          } catch (embedErr) {
            console.error(embedErr);
            receivedError =
              'No se pudieron cargar las valoraciones recibidas.';
          }
        } else {
          receivedError =
            'Aún no se pueden cargar las valoraciones recibidas. Falta soporte de filtro target en el API.';
        }
      }

      const givenItems = await givenPromise;
      setReceived(filterReceivedByMode(receivedItems, mode));
      if (givenItems === null) {
        setGiven([]);
        setError(receivedError ?? 'No se pudieron cargar las valoraciones hechas.');
      } else {
        setGiven(givenItems);
        setError(receivedError);
      }
    } catch (e) {
      console.error(e);
      setError('No se pudieron cargar las valoraciones.');
      setReceived([]);
      setGiven([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const list = tab === 'received' ? received : given;
  const computedAverage = useMemo(() => averageRating(received), [received]);
  const displayAverage = profileAverage ?? computedAverage;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()}>
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Valoraciones</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="profile-reviews-content">
        <SegmentTab
          value={tab}
          onValueChange={(v: string) => setTab(v as Tab)}
          options={[
            { value: 'received', label: 'Recibidas' },
            { value: 'given', label: 'Hechas' },
          ]}
        />

        {loading ? (
          <div className="profile-reviews-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          <>
            {tab === 'received' && (
              <div className="profile-reviews-avg" data-testid="reviews-average">
                <div className="profile-reviews-avg-score">
                  {displayAverage != null ? displayAverage.toFixed(1) : '—'}
                </div>
                <div className="profile-reviews-avg-meta">
                  <StarsRow rating={Math.round(displayAverage ?? 0)} />
                  <span>
                    {received.length > 0
                      ? `${received.length} valoración${received.length === 1 ? '' : 'es'}`
                      : profileCount > 0
                        ? `${profileCount} valoración${profileCount === 1 ? '' : 'es'}`
                        : 'Sin valoraciones aún'}
                  </span>
                  <span className="profile-reviews-avg-hint">
                    {activeMode === 'pro'
                      ? 'Media como profesional'
                      : 'Media como cliente'}
                  </span>
                </div>
              </div>
            )}

            {error ? <p className="profile-reviews-error">{error}</p> : null}

            {!error && list.length === 0 ? (
              <p className="profile-reviews-empty">
                {tab === 'received'
                  ? 'Todavía no has recibido valoraciones.'
                  : 'Todavía no has escrito valoraciones.'}
              </p>
            ) : (
              <div className="profile-reviews-list">
                {list.map((review) => (
                  <ReviewCard key={review.id} review={review} mode={tab} />
                ))}
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ProfileReviews;
