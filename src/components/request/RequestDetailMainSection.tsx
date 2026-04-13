import React from 'react';
import {
  IonIcon,
  IonAvatar,
  IonButton,
  IonBadge,
} from '@ionic/react';
import {
  calendarOutline,
  cashOutline,
  flashOutline,
  informationCircleOutline,
  checkmarkCircle,
  checkmarkDoneOutline,
  callOutline,
  star,
  chatboxEllipsesOutline,
  chevronForwardOutline,
  timeOutline,
} from 'ionicons/icons';
import { Bid, ServiceRequest, Category, VisitRequest, ProfessionalProfile } from '../../types';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { bidPriceLabel } from '../../utils/bidPriceLabel';
import { dedupePendingBidsByProProfile } from '../../utils/bidDisplay';
import {
  formatRequestPriceRangeEuros,
  getRequestPriceRangeEuros,
} from '../../utils/requestPriceRange';

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

const CATEGORY_LABELS: Record<Category, string> = {
  DIY: 'Manitas',
  PLUMBING: 'Fontanería',
  ELECTRICITY: 'Electricidad',
  MASONRY: 'Albañilería',
  HVAC: 'Climatización',
  CLEANING: 'Limpieza',
  PAINTING: 'Pintura',
};

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

  return (
    <>
      {/* INFO PRINCIPAL */}
      <div style={{ marginTop: '20px', padding: '0 5px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            marginBottom: '10px',
          }}
        >
          <span
            className={`status-badge-detail ${
              request.status === 'COMPLETED'
                ? 'completed'
                : request.status === 'ACCEPTED'
                ? 'accepted'
                : request.status === 'PENDING_APPROVAL'
                ? 'pending-approval'
                : 'pending'
            }`}
          >
            {request.status === 'COMPLETED'
              ? 'Finalizado'
              : request.status === 'ACCEPTED'
              ? 'Asignado'
              : request.status === 'PENDING_APPROVAL'
              ? 'En revisión'
              : 'Pendiente'}
          </span>
        </div>

        <h1 className="detail-title">{request.title}</h1>

        {/* PRO ASIGNADO */}
        {(request.status === 'ACCEPTED' || request.status === 'COMPLETED') &&
          request.assignedProfessional && (
            <div className="pro-card-assigned animate__animated animate__fadeInUp">
              <div className="pro-header">
                <div
                  className="pro-card-label"
                  style={{ marginBottom: 10 }}
                >
                  {request.status === 'COMPLETED'
                    ? 'Servicio finalizado'
                    : 'Profesional asignado'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <IonAvatar className="bid-avatar">
                      {request.assignedProfessional.avatar ? (
                        <img
                          src={resolveMediaUrl(request.assignedProfessional.avatar)}
                          alt="avatar"
                        />
                      ) : (
                        <span>
                          {request.assignedProfessional.fullName
                            ? request.assignedProfessional.fullName.charAt(0)
                            : '?'}
                        </span>
                      )}
                    </IonAvatar>
                    {(() => {
                      const ap = request.assignedProfessional as { user?: { roles?: string[] } };
                      const roles = getRolesFromObj(ap);
                      const tier = getTierFromRoles(roles);
                      const tierStyle = TIER_STYLES[tier];
                      return (
                        <span
                          className="bid-tier-badge"
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
                      );
                    })()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="bid-pro-name"
                      style={{
                        fontWeight: 800,
                        color: '#1e293b',
                        fontSize: '0.95rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {request.assignedProfessional.fullName}
                    </div>
                    {(() => {
                      const apAny = request.assignedProfessional as any;
                      const hasRatingData = apAny?.rating != null || apAny?.reviewCount != null;
                      if (!hasRatingData) return null;
                      const numeric =
                        typeof apAny.rating === 'number'
                          ? apAny.rating
                          : typeof apAny.rating === 'string'
                            ? Number.parseFloat(apAny.rating)
                            : NaN;
                      const display = Number.isFinite(numeric) ? numeric.toFixed(1) : '—';
                      const count = apAny.reviewCount ?? 0;
                      return (
                        <div
                          className="bid-rating"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.8rem',
                            color: '#64748b',
                            marginTop: 4,
                          }}
                        >
                          <IonIcon icon={star} style={{ color: '#fbbf24', fontSize: '0.9rem' }} />
                          <span style={{ fontWeight: 600 }}>{display}</span>
                          <span style={{ color: '#94a3b8' }}>({count})</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <div className="pro-body">
                {request.status !== 'COMPLETED' ? (
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
                )}
              </div>
            </div>
          )}

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
                      const hasRating = proProfile?.rating != null || proProfile?.reviewCount != null;
                      const numericRating =
                        typeof proProfile?.rating === 'number'
                          ? proProfile.rating
                          : typeof proProfile?.rating === 'string'
                            ? Number.parseFloat(proProfile.rating)
                            : NaN;
                      const displayRating = Number.isFinite(numericRating)
                        ? numericRating.toFixed(1)
                        : '—';
                      const handleViewPro = () => proId && onViewProfessional?.(proId);
                      const tier = getBidTier(bid);
                      const tierStyle = TIER_STYLES[tier];
                      return (
                        <div
                          key={bid.id}
                          className="bid-card animate__animated animate__fadeInUp"
                        >
                          <div className="bid-card-header">
                            <div
                              className={`bid-pro-info${onViewProfessional && proId ? ' bid-pro-info--clickable' : ''}`}
                              role={onViewProfessional && proId ? 'button' : undefined}
                              tabIndex={onViewProfessional && proId ? 0 : undefined}
                              onClick={handleViewPro}
                              onKeyDown={e => (e.key === 'Enter' && handleViewPro())}
                            >
                              <div style={{ position: 'relative' }}>
                                <IonAvatar className="bid-avatar">
                                  {proProfile?.avatar ? (
                                    <img
                                      src={resolveMediaUrl(proProfile.avatar)}
                                      alt="avatar"
                                    />
                                  ) : (
                                    <span>
                                      {proProfile?.fullName
                                        ? proProfile.fullName.charAt(0)
                                        : '?'}
                                    </span>
                                  )}
                                </IonAvatar>
                                <span
                                  className="bid-tier-badge"
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
                              <div>
                                <div className="bid-pro-name">
                                  <span>{proProfile?.fullName || 'Profesional'}</span>
                                </div>
                                {hasRating && (
                                  <div
                                    className="bid-rating"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      fontSize: '0.8rem',
                                      color: '#64748b',
                                      marginTop: 6,
                                    }}
                                  >
                                    <IonIcon icon={star} style={{ color: '#fbbf24', fontSize: '0.85rem' }} />
                                    <span style={{ fontWeight: 600 }}>{displayRating}</span>
                                    {proProfile?.reviewCount != null && (
                                      <span style={{ color: '#94a3b8' }}>({proProfile.reviewCount})</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '72px' }}>
                              <div className="bid-price">{bidPriceLabel(bid)}</div>
                            </div>
                          </div>
                          {bid.comment && (
                            <div className="bid-comment">"{bid.comment}"</div>
                          )}
                          {bid.estimatedExecutionTime && (
                            <div
                              style={{
                                marginBottom: 10,
                                fontSize: '0.8rem',
                                color: '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                              }}
                            >
                              <IonIcon icon={timeOutline} style={{ fontSize: '0.85rem' }} />
                              <span>
                                Disponibilidad: <strong>{bid.estimatedExecutionTime}</strong>
                              </span>
                            </div>
                          )}
                          {!requestAlreadyAssigned && (
                            <IonButton
                              expand="block"
                              className="accept-bid-btn"
                              onClick={() => onOpenAcceptModal(bid.id)}
                            >
                              ACEPTAR PRESUPUESTO
                            </IonButton>
                          )}

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
                        </div>
                      );
                    })
                  )}
                </>
              );
            })()}
          </div>
        )}

        {getRequestPriceRangeEuros(request) && (
          <div className="info-card-detail orange-border">
            <div className="icon-box-detail orange">
              <IonIcon icon={cashOutline} />
            </div>
            <div>
              <div className="info-label-detail">Rango estimado</div>
              <div className="info-text-detail info-text-detail-price-range">
                {formatRequestPriceRangeEuros(request)}
              </div>
            </div>
          </div>
        )}

        <div className="info-card-detail blue-border">
          <div className="icon-box-detail blue">
            <IonIcon icon={calendarOutline} />
          </div>
          <div>
            <div className="info-label-detail">Disponibilidad preferida</div>
            <div className="info-text-detail">
              {request.desiredExecutionTime || 'Lo antes posible'}
            </div>
          </div>
        </div>

        <div className="info-card-detail">
          <div className="icon-box-detail blue">
            <IonIcon icon={addressDisplay.icon} />
          </div>
          <div>
            <div className="info-label-detail">{addressDisplay.label}</div>
            <div className="info-text-detail">{addressDisplay.text}</div>
          </div>
        </div>

        {(request.clientOriginalDescription?.trim() || request.description) && (
          <div className="description-box">
            <div className="section-header">Descripción del problema</div>
            {request.clientOriginalDescription?.trim() ? (
              <>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#64748b',
                    marginBottom: '8px',
                  }}
                >
                  Tu texto original
                </div>
                <p style={{ marginBottom: '18px' }}>{request.clientOriginalDescription.trim()}</p>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: '#64748b',
                    marginBottom: '8px',
                  }}
                >
                  Valoración técnica (IA)
                </div>
              </>
            ) : null}
            {CATEGORY_LABELS[request.category] && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 10px',
                  borderRadius: '999px',
                  background: '#eef2ff',
                  color: '#4f46e5',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  marginBottom: '6px',
                }}
              >
                {CATEGORY_LABELS[request.category]}
              </div>
            )}
            {request.description ? <p>{request.description}</p> : null}

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
                        className="detail-extra-media-img-inside"
                      />
                    </div>
                  ))}
                  {(request.extraVideoUrls || []).map((url) => (
                    <div key={`inside-video-${url}`} className="detail-extra-media-item-inside">
                      <video
                        src={resolveMediaUrl(url)}
                        controls
                        className="detail-extra-media-video-inside"
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
          </div>
        )}
        </div>
      </div>

      {/* Q&A ENTRY CARD */}
      <div className="qa-entry-card" onClick={onOpenQAModal}>
        <div className="qa-icon-badge">
          <IonIcon icon={chatboxEllipsesOutline} />
        </div>
        <div className="qa-content-text">
          <div className="qa-title">Preguntas y dudas</div>
          <div
            className="qa-subtitle"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <span>
              {questionsCount === 0
                ? 'Nadie ha preguntado aún'
                : `${questionsCount} pregunta${
                    questionsCount > 1 ? 's' : ''
                  }`}
            </span>
            {pendingAnswers > 0 && (
              <IonBadge
                color="danger"
                style={{ fontSize: '0.7rem' }}
              >
                Requiere atención
              </IonBadge>
            )}
          </div>
        </div>
        <IonIcon icon={chevronForwardOutline} color="medium" />
      </div>

    </>
  );
};

