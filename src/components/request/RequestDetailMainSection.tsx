import React from 'react';
import {
  IonIcon,
  IonButton,
} from '@ionic/react';
import {
  calendarOutline,
  cashOutline,
  informationCircleOutline,
  checkmarkDoneOutline,
  callOutline,
  star,
} from 'ionicons/icons';
import { Bid, ServiceRequest, VisitRequest, ProfessionalProfile } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { openRequestMediaFromSources } from '../shared/RequestMediaModal';
import { bidPriceLabel } from '../../utils/bidPriceLabel';
import { dedupePendingBidsByProProfile } from '../../utils/bidDisplay';
import {
  formatRequestPriceRangeEuros,
  getRequestPriceRangeEuros,
} from '../../utils/requestPriceRange';
import { getClientDetailStatus } from '../../utils/detailStatus';
import {
  DetailHeroHeader,
  InfoBox,
  PRICE_RANGE_DISCLAIMER,
  PersonCard,
  JobDetailsSection,
  QuestionsRow,
} from '../detail';

type TierLabel = 'PRO' | 'SOLVER' | 'FREE';

function getRolesFromObj(obj: { roles?: string[]; user?: { roles?: string[] } } | undefined): string[] {
  const roles = obj?.roles ?? obj?.user?.roles ?? [];
  return Array.isArray(roles) ? roles : [];
}

function getTierFromRoles(roles: string[]): TierLabel {
  if (roles.includes('ROLE_PRO')) return 'PRO';
  if (roles.includes('ROLE_SOLVER')) return 'SOLVER';
  return 'FREE';
}

function getBidTier(bid: Bid): TierLabel {
  return getTierFromRoles(getRolesFromObj(bid.professional as any));
}

function getResourceId(resource: { id?: number; '@id'?: string } | string | undefined): number {
  if (!resource) return 0;
  if (typeof resource === 'string') {
    return parseInt(resource.split('/').pop() || '0', 10);
  }
  if (typeof resource.id === 'number') return resource.id;
  if (resource['@id']) return parseInt(String(resource['@id']).split('/').pop() || '0', 10);
  return 0;
}

const TIER_STYLES: Record<TierLabel, { bg: string; color: string }> = {
  PRO: { bg: 'var(--ion-color-primary)', color: 'white' },
  SOLVER: { bg: '#10b981', color: 'white' },
  FREE: { bg: '#94a3b8', color: 'white' },
};

/** Ordena pujas: PRO > SOLVER > FREE, luego por precio (asc) y rating (desc). */
function sortBidsForClient(bids: Bid[]): Bid[] {
  const tierWeight = (bid: Bid): number => {
    const roles = getRolesFromObj(bid.professional as any);
    const tier = getTierFromRoles(roles);
    if (tier === 'PRO') return 3;
    if (tier === 'SOLVER') return 2;
    return 1;
  };
  const rating = (bid: Bid): number =>
    bid.professional?.professionalProfile?.rating ?? 0;

  return [...bids].sort((a, b) => {
    const ta = tierWeight(a);
    const tb = tierWeight(b);
    if (tb !== ta) return tb - ta; // PRO primero
    if (a.priceQuote !== b.priceQuote) return a.priceQuote - b.priceQuote; // precio asc
    return rating(b) - rating(a); // rating desc
  });
}

interface AddressDisplay {
  text: string;
  icon: string;
  label: string;
}

interface RequestDetailMainSectionProps {
  request: ServiceRequest;
  addressDisplay: AddressDisplay;
  serverUrl: string;
  questionsCount: number;
  pendingAnswers: number;
  hasReviewed: boolean;
  canCancelRequest?: boolean;
  onCancelRequest?: () => void;
  onCallProfessional: () => void;
  onCallVisitProfessional?: (phone: string) => void;
  onAcceptVisit?: () => void;
  onRejectVisit?: () => void;
  onOpenReviewModal: () => void;
  onOpenQAModal: () => void;
  onOpenAcceptModal: (bidId: number) => void;
  onViewProfessional?: (professionalId: number) => void;
  visitRequest?: VisitRequest;
}

export const RequestDetailMainSection: React.FC<RequestDetailMainSectionProps> = ({
  request,
  addressDisplay,
  serverUrl,
  questionsCount,
  pendingAnswers,
  hasReviewed,
  canCancelRequest,
  onCancelRequest,
  onCallProfessional,
  onCallVisitProfessional,
  onAcceptVisit,
  onRejectVisit,
  onOpenReviewModal,
  onOpenQAModal,
  onOpenAcceptModal,
  onViewProfessional,
  visitRequest,
}) => {
  const hasExtraMedia =
    (request.extraPhotoUrls?.length ?? 0) +
      (request.extraVideoUrls?.length ?? 0) +
      (request.extraAudioUrls?.length ?? 0) >
    0;
  const detailStatus = getClientDetailStatus(request.status);

  return (
    <>
      {/* INFO PRINCIPAL */}
      <div style={{ marginTop: '20px', padding: '0 5px' }}>
        <DetailHeroHeader
          status={detailStatus.key}
          statusLabel={detailStatus.label}
          title={request.title}
        />

        {/* PRO ASIGNADO */}
        {(request.status === 'ACCEPTED' || request.status === 'COMPLETED') &&
          request.assignedProfessional && (() => {
            const ap = request.assignedProfessional as {
              user?: { roles?: string[] };
              roles?: string[];
              rating?: number | string;
              reviewCount?: number;
              avatar?: string;
              fullName?: string;
            };
            const tier = getTierFromRoles(getRolesFromObj(ap));
            const tierStyle = TIER_STYLES[tier];
            return (
              <PersonCard
                className="animate__animated animate__fadeInUp"
                sectionLabel={
                  request.status === 'COMPLETED'
                    ? 'Servicio finalizado'
                    : 'Profesional asignado'
                }
                name={ap.fullName || 'Profesional'}
                avatarUrl={ap.avatar}
                rating={ap.rating}
                reviewCount={ap.reviewCount}
                planBadge={
                  <span
                    className="detail-person-card-plan-badge"
                    style={{ background: tierStyle.bg, color: tierStyle.color }}
                  >
                    {tier}
                  </span>
                }
                highlight={request.status === 'ACCEPTED'}
                action={
                  request.status !== 'COMPLETED' ? (
                    <IonButton
                      expand="block"
                      className="quira-main-btn"
                      onClick={onCallProfessional}
                    >
                      <IonIcon slot="start" icon={callOutline} /> CONTACTAR
                    </IonButton>
                  ) : !hasReviewed ? (
                    <IonButton
                      expand="block"
                      color="secondary"
                      className="quira-main-btn"
                      onClick={onOpenReviewModal}
                    >
                      <IonIcon slot="start" icon={star} /> VALORAR TRABAJO
                    </IonButton>
                  ) : (
                    <div className="reviewed-badge">
                      <IonIcon icon={checkmarkDoneOutline} /> ¡Valoración enviada!
                    </div>
                  )
                }
              />
            );
          })()}

        <div className="request-detail-main-sections">
        {/* LISTADO DE OFERTAS */}
        {(request.status === 'PENDING' || request.status === 'ACCEPTED') && (
          <div className="request-detail-offers-block">
            {(() => {
              const visibleBids = dedupePendingBidsByProProfile(request.bids);
              const visibleBidsCount = visibleBids.length;
              const assignedProfessionalId = getResourceId(request.assignedProfessional as any);
              const requestAlreadyAssigned = request.status === 'ACCEPTED';
              return (
                <>
                  <div className="section-header-large">
                    OFERTAS <span className="counter-badge">{visibleBidsCount}</span>
                  </div>

                  {visibleBidsCount === 0 ? (
                    <div className="empty-bids-state">
                      <IonIcon icon={informationCircleOutline} />
                      <p>Buscando los mejores profesionales para ti...</p>
                    </div>
                  ) : (
                    sortBidsForClient(visibleBids).map((bid: Bid) => {
                      const proProfile = bid.professional?.professionalProfile as ProfessionalProfile | undefined;
                      const proId = proProfile?.id ?? (proProfile?.['@id'] ? parseInt(String(proProfile['@id']).split('/').pop() || '0', 10) : 0);
                      const isAssignedBid = requestAlreadyAssigned && proId === assignedProfessionalId;
                      const handleViewPro = () => proId && onViewProfessional?.(proId);
                      const tier = getBidTier(bid);
                      const tierStyle = TIER_STYLES[tier];
                      const isRangeBid = bid.pricingType === 'RANGE';
                      const rangeMin = Number(bid.priceQuoteMin ?? bid.priceQuote ?? 0);
                      const rangeMax = Number(bid.priceQuoteMax ?? bid.priceQuote ?? rangeMin);
                      const priceNode =
                        isRangeBid && Number.isFinite(rangeMin) && Number.isFinite(rangeMax) ? (
                          <div className="bid-price bid-price-range">
                            <span className="bid-price-range-value">{rangeMin}€</span>
                            <span className="bid-price-range-separator">-</span>
                            <span className="bid-price-range-value">{rangeMax}€</span>
                          </div>
                        ) : (
                          <div className="bid-price bid-price-fixed-pill">{bidPriceLabel(bid)}</div>
                        );
                      return (
                        <PersonCard
                          key={bid.id}
                          className="bid-card animate__animated animate__fadeInUp"
                          name={proProfile?.fullName || 'Profesional'}
                          avatarUrl={proProfile?.avatar}
                          rating={proProfile?.rating}
                          reviewCount={proProfile?.reviewCount}
                          onPersonClick={onViewProfessional && proId ? handleViewPro : undefined}
                          planBadge={
                            <span
                              className="detail-person-card-plan-badge"
                              style={{ background: tierStyle.bg, color: tierStyle.color }}
                            >
                              {tier}
                            </span>
                          }
                          price={priceNode}
                          comment={bid.comment}
                          availability={bid.estimatedExecutionTime}
                          action={
                            !requestAlreadyAssigned ? (
                              <IonButton
                                expand="block"
                                className="accept-bid-btn"
                                onClick={() => onOpenAcceptModal(bid.id)}
                              >
                                ACEPTAR PRESUPUESTO
                              </IonButton>
                            ) : undefined
                          }
                        >
                          {requestAlreadyAssigned && isAssignedBid && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: '9px 12px',
                                borderRadius: 10,
                                background: '#ecfdf5',
                                color: '#065f46',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                border: '1px solid #bbf7d0',
                                textAlign: 'center',
                              }}
                            >
                              Oferta aceptada
                            </div>
                          )}
                          {requestAlreadyAssigned && !isAssignedBid && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: '9px 12px',
                                borderRadius: 10,
                                background: '#f8fafc',
                                color: '#475569',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                              }}
                            >
                              Oferta no seleccionada
                            </div>
                          )}
                        </PersonCard>
                      );
                    })
                  )}
                </>
              );
            })()}
          </div>
        )}

        {getRequestPriceRangeEuros(request) && (
          <InfoBox
            tone="peach"
            icon={cashOutline}
            label="Rango estimado"
            value={formatRequestPriceRangeEuros(request)}
            subtext={PRICE_RANGE_DISCLAIMER}
            emphasizeValue
          />
        )}

        <InfoBox
          tone="lavender"
          icon={calendarOutline}
          label="Disponibilidad preferida"
          value={request.desiredExecutionTime || 'Lo antes posible'}
        />

        <InfoBox
          tone="neutral"
          icon={addressDisplay.icon}
          label={addressDisplay.label}
          value={addressDisplay.text}
        />

        {(request.clientOriginalDescription?.trim() || request.description) && (
          <JobDetailsSection
            title="Descripción del problema"
            category={request.category}
            description={request.description}
            clientOriginalDescription={request.clientOriginalDescription}
            originalLabel="Tu texto original"
          >
            {hasExtraMedia && (
              <div className="detail-extra-media-inside">
                <div
                  className="detail-extra-media-title-inside"
                  style={{
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 800,
                    color: '#64748b',
                    marginTop: '10px',
                    marginBottom: '6px',
                  }}
                >
                  Adjuntos adicionales
                </div>
                <div className="detail-extra-media-list-inside">
                  {(request.extraPhotoUrls || []).map((url) => (
                    <div key={`inside-photo-${url}`} className="detail-extra-media-item-inside">
                      <img
                        src={resolveMediaUrl(url)}
                        alt="Foto adicional"
                        className="detail-extra-media-img-inside detail-media-openable"
                        onClick={() =>
                          openRequestMediaFromSources(request, {
                            url,
                            kind: 'photo',
                          })
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openRequestMediaFromSources(request, {
                              url,
                              kind: 'photo',
                            });
                          }
                        }}
                      />
                    </div>
                  ))}
                  {(request.extraVideoUrls || []).map((url) => (
                    <div key={`inside-video-${url}`} className="detail-extra-media-item-inside">
                      <video
                        src={resolveMediaUrl(url)}
                        className="detail-extra-media-video-inside detail-media-openable"
                        muted
                        playsInline
                        preload="metadata"
                        onClick={() =>
                          openRequestMediaFromSources(request, {
                            url,
                            kind: 'video',
                          })
                        }
                        aria-label="Ver vídeo en galería"
                      />
                    </div>
                  ))}
                  {(request.extraAudioUrls || []).map((url) => (
                    <div key={`inside-audio-${url}`} className="detail-extra-media-item-inside">
                      <audio
                        src={resolveMediaUrl(url)}
                        controls
                        className="detail-extra-media-audio-inside"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {visitRequest && (
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '10px',
                  borderTop: '1px dashed #e2e8f0',
                }}
              >
                {visitRequest.status === 'PENDING' && (
                  <div
                    style={{
                      background: '#eff6ff',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                      color: '#1e293b',
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      {(visitRequest.professional?.fullName || 'El profesional')}{' '}
                      ha solicitado una visita para valorar el trabajo.
                    </div>
                    <div style={{ marginBottom: 8, color: '#64748b' }}>
                      Puedes aceptar la visita para que el profesional pueda ver el problema en persona antes de darte
                      un presupuesto final.
                    </div>
                    {onAcceptVisit && onRejectVisit && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <IonButton
                          size="small"
                          className="quira-main-btn"
                          style={{ flex: 1, minWidth: 0, marginTop: 3 }}
                          onClick={onAcceptVisit}
                        >
                          Aceptar visita
                        </IonButton>
                        <IonButton
                          size="small"
                          fill="outline"
                          color="medium"
                          style={{ flex: 1, minWidth: 0 }}
                          onClick={onRejectVisit}
                        >
                          Rechazar
                        </IonButton>
                      </div>
                    )}
                  </div>
                )}

                {visitRequest.status === 'ACCEPTED' && (
                  <div
                    style={{
                      background: '#ecfdf5',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                      color: '#065f46',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>
                      Has aceptado la visita de valoración de{' '}
                      {visitRequest.professional?.fullName || 'este profesional'}.
                    </div>
                    <div>
                      El profesional puede llamarte para coordinar la visita. Si lo necesitas, también puedes llamarle
                      tú.
                    </div>
                    {onCallVisitProfessional && visitRequest.professionalPhone && (
                      <IonButton
                        size="small"
                        fill="clear"
                        color="success"
                        onClick={() => onCallVisitProfessional(visitRequest.professionalPhone!)}
                        style={{
                          alignSelf: 'flex-start',
                          paddingLeft: 0,
                          '--padding-top': '4px',
                          '--padding-bottom': '4px',
                          height: '30px',
                        }}
                      >
                        <IonIcon slot="start" icon={callOutline} />
                        LLAMAR AL PROFESIONAL
                      </IonButton>
                    )}
                  </div>
                )}

                {visitRequest.status === 'REJECTED' && (
                  <div
                    style={{
                      background: '#fef2f2',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      fontSize: '0.85rem',
                      color: '#b91c1c',
                    }}
                  >
                    Has rechazado la visita de valoración solicitada por{' '}
                    {visitRequest.professional?.fullName || 'este profesional'}.
                  </div>
                )}
              </div>
            )}
          </JobDetailsSection>
        )}
        </div>
      </div>

      <QuestionsRow
        questionsCount={questionsCount}
        emptySubtitle="Nadie ha preguntado aún"
        countFormat="count"
        pendingAnswers={pendingAnswers}
        onClick={onOpenQAModal}
      />

    </>
  );
};

