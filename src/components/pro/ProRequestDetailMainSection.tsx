import React from 'react';
import { IonBadge, IonButton, IonIcon, IonAvatar } from '@ionic/react';
import {
  calendarOutline,
  cashOutline,
  navigateOutline,
  lockClosedOutline,
  callOutline,
  checkmarkCircle,
  walletOutline,
  chatbubbleEllipsesOutline,
  timeOutline,
  star,
  chatboxEllipsesOutline,
  chevronForwardOutline,
  alertCircleOutline,
  helpCircleOutline,
} from 'ionicons/icons';
import { ServiceRequest, Category, VisitRequest } from '../../types';
import { env } from '../../config/env';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import type { EffectiveTier } from '../../utils/effectiveTier';
import {
  formatRequestPriceRangeEuros,
  getRequestPriceRangeEuros,
} from '../../utils/requestPriceRange';

interface ProRequestDetailMainSectionProps {
  request: ServiceRequest;
  serverUrl: string;
  isWinner: boolean;
  isCompleted: boolean;
  isHighRisk: boolean;
  myBid: any;
  questionsCount: number;
  userTier: EffectiveTier;
  canSubmitBid: boolean;
  /** Hay una propuesta PENDING; si no, puede volver a enviar aunque existan retiradas anteriores. */
  hasActiveBid: boolean;
  isFinishing: boolean;
  hasReviewed: boolean;
  qLoading: boolean;
  newQuestion: string;
  onOpenGPS: () => void;
  onOpenQAModal: () => void;
  onCallClient: () => void;
  onHandleFinishWork: () => void;
  onOpenReviewModal: () => void;
  onOpenBidModal: () => void;
  onAskQuestion: () => void;
  onChangeQuestion: (value: string) => void;
  canCancelBid?: boolean;
  onCancelBid?: () => void;
  cancellingBid?: boolean;
  visitRequest?: VisitRequest;
  onRequestVisit?: () => void;
  isRequestingVisit?: boolean;
}

export const ProRequestDetailMainSection: React.FC<
  ProRequestDetailMainSectionProps
> = ({
  request,
  serverUrl,
  isWinner,
  isCompleted,
  isHighRisk,
  myBid,
  questionsCount,
  userTier,
  canSubmitBid,
  hasActiveBid,
  isFinishing,
  hasReviewed,
  qLoading,
  newQuestion,
  onOpenGPS,
  onOpenQAModal,
  onCallClient,
  onHandleFinishWork,
  onOpenReviewModal,
  onOpenBidModal,
  onAskQuestion,
  onChangeQuestion,
  canCancelBid,
  onCancelBid,
  cancellingBid,
  visitRequest,
  onRequestVisit,
  isRequestingVisit,
}) => {
  const CATEGORY_LABELS: Record<Category, string> = {
    DIY: 'Manitas',
    PLUMBING: 'Fontanería',
    ELECTRICITY: 'Electricidad',
    MASONRY: 'Albañilería',
    HVAC: 'Climatización',
    CLEANING: 'Limpieza',
    PAINTING: 'Pintura',
  };

  return (
    <div style={{ marginTop: '20px', padding: '0 5px' }}>
      <div
        style={{
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <IonBadge
          className={`pro-status-pill ${
            request.status === 'CANCELLED'
              ? 'cancelled'
              : myBid?.status === 'REJECTED'
              ? 'rejected'
              : isCompleted
              ? 'completed'
              : isWinner
              ? 'winner'
              : myBid
              ? 'bid'
              : 'pending'
          }`}
        >
          {request.status === 'CANCELLED'
            ? 'Cancelada'
            : myBid?.status === 'REJECTED'
            ? 'Propuesta Retirada'
            : isCompleted
            ? 'Finalizado'
            : isWinner
            ? 'Trabajo Ganado'
            : myBid
            ? 'Propuesta Enviada'
            : 'Disponible'}
        </IonBadge>
        {isHighRisk && (
          <IonBadge
            color="danger"
            style={{ fontSize: '0.65rem', fontWeight: 800 }}
          >
            ALTA DIFICULTAD
          </IonBadge>
        )}
      </div>

      <h1 className="pro-detail-title">{request.title}</h1>

      {/* INFORMACIÓN DEL CLIENTE */}
      {request.client && (
        <div
          className="pro-client-card animate__animated animate__fadeIn"
          style={{
            marginBottom: '16px',
            padding: '18px',
            background: 'white',
            borderRadius: '20px',
            border: isWinner || visitRequest?.status === 'ACCEPTED' ? '1px solid #dcfce7' : '1px solid #e2e8f0',
            boxShadow: isWinner || visitRequest?.status === 'ACCEPTED' ? '0 4px 16px rgba(16, 185, 129, 0.08)' : '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '12px',
            }}
          >
            Cliente
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <IonAvatar
              style={{
                width: '52px',
                height: '52px',
                minWidth: '52px',
                minHeight: '52px',
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {request.client.avatar ? (
                <img
                  src={resolveMediaUrl(request.client.avatar)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#64748b' }}>
                  {request.client.fullName?.charAt(0) || '?'}
                </span>
              )}
            </IonAvatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>
                {request.client.fullName}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '4px',
                }}
              >
                <IonIcon icon={star} style={{ fontSize: '0.8rem', color: '#fbbf24' }} />
                <span style={{ fontWeight: 600 }}>
                  {typeof request.client.rating === 'number' && Number.isFinite(request.client.rating)
                    ? request.client.rating.toFixed(1)
                    : '—'}
                </span>
                <span style={{ color: '#94a3b8' }}>({request.client.reviewCount ?? 0})</span>
              </div>
            </div>
          </div>
          {(isWinner || (visitRequest?.status === 'ACCEPTED' && request.client.phoneNumber)) && (
            <IonButton
              expand="block"
              color="success"
              onClick={onCallClient}
              style={{ marginTop: '14px', fontWeight: 800, '--border-radius': '12px' }}
            >
              <IonIcon slot="start" icon={callOutline} /> LLAMAR AL CLIENTE
            </IonButton>
          )}
        </div>
      )}

      {getRequestPriceRangeEuros(request) && (
        <div className="pro-detail-range-card animate__animated animate__fadeIn">
          <div className="pro-detail-range-icon">
            <IonIcon icon={cashOutline} />
          </div>
          <div className="pro-detail-range-copy">
            <div className="pro-detail-range-label">Rango estimado</div>
            <div className="pro-detail-range-value">{formatRequestPriceRangeEuros(request)}</div>
            <div className="pro-detail-range-hint">Orientativo para la zona; no incluye desplazamiento ni materiales.</div>
          </div>
        </div>
      )}

      {/* UBICACIÓN */}
      <div className={`pro-info-card ${isWinner ? 'highlight-border' : ''}`}>
        <div className="pro-icon-box">
          <IonIcon
            icon={isWinner || isCompleted ? navigateOutline : lockClosedOutline}
            color={isWinner ? 'primary' : 'medium'}
          />
        </div>
        <div>
          <div className="pro-label">Ubicación</div>
          <div className="pro-value">
            {isWinner || isCompleted
              ? request.preciseAddress || request.address
              : `Zona: ${request.address
                  .split(',')
                  .slice(0, 2)
                  .join(', ')}`}
          </div>
        </div>
      </div>

      {/* MAPA (GANADOR) */}
      {isWinner && (
        <div className="map-container-wrapper animate__animated animate__fadeIn">
          <iframe
            width="100%"
            height="180"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.google.com/maps/embed/v1/place?key=${env.googleMapsKey}&q=${encodeURIComponent(
              request.preciseAddress || request.address,
            )}`}
          ></iframe>
        </div>
      )}

      {/* DETALLES DEL TRABAJO */}
      <div className="pro-section-header">DETALLES DEL TRABAJO</div>
      <div className="description-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px',
            color: '#4f46e5',
            fontWeight: 700,
            fontSize: '0.9rem',
          }}
        >
          <IonIcon icon={calendarOutline} />
          {request.desiredExecutionTime || 'Lo antes posible'}
        </div>

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
              Texto del cliente
            </div>
            <p style={{ marginBottom: '16px' }}>{request.clientOriginalDescription.trim()}</p>
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

        {((request.extraPhotoUrls?.length ?? 0) +
          (request.extraVideoUrls?.length ?? 0) +
          (request.extraAudioUrls?.length ?? 0) >
          0) && (
          <div className="pro-detail-extra-media-inside">
            <div
              className="pro-detail-extra-media-title-inside"
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
            <div className="pro-detail-extra-media-list-inside">
              {(request.extraPhotoUrls || []).map((url) => (
                <div key={`inside-photo-${url}`} className="pro-detail-extra-media-item-inside">
                  <img
                    src={resolveMediaUrl(url)}
                    alt="Foto adicional"
                    className="pro-detail-extra-media-img-inside"
                  />
                </div>
              ))}
              {(request.extraVideoUrls || []).map((url) => (
                <div key={`inside-video-${url}`} className="pro-detail-extra-media-item-inside">
                  <video
                    src={resolveMediaUrl(url)}
                    controls
                    className="pro-detail-extra-media-video-inside"
                  />
                </div>
              ))}
              {(request.extraAudioUrls || []).map((url) => (
                <div key={`inside-audio-${url}`} className="pro-detail-extra-media-item-inside">
                  <audio
                    src={resolveMediaUrl(url)}
                    controls
                    className="pro-detail-extra-media-audio-inside"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      {/* VISITA DE VALORACIÓN: solo HIGH + PENDING; userTier PRO implica suscripción vigente (paidThroughAt futuro), alineado con API */}
      {userTier === 'PRO' && isHighRisk && request.status === 'PENDING' && (
          <div
            style={{
              marginTop: '14px',
              paddingTop: '10px',
              borderTop: '1px dashed #e2e8f0',
            }}
          >
            {!visitRequest && !isRequestingVisit && (
              <div
                style={{
                  background: '#eff6ff',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '0.85rem',
                  color: '#1e293b',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '999px',
                    background: '#e0ebff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon icon={helpCircleOutline} color="primary" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>¿Te faltan datos para presupuestar?</div>
                  <div style={{ color: '#64748b', marginBottom: 8 }}>
                    Si necesitas ver el problema en persona, puedes pedir una visita de valoración antes de enviar un presupuesto cerrado.
                  </div>
                  {onRequestVisit && (
                    <IonButton
                      size="small"
                      className="pro-main-btn"
                      style={{ marginTop: 4 }}
                      onClick={onRequestVisit}
                    >
                      SOLICITAR VISITA PARA VALORAR
                    </IonButton>
                  )}
                </div>
              </div>
            )}

            {!visitRequest && isRequestingVisit && (
              <div
                style={{
                  background: '#eff6ff',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '0.85rem',
                  color: '#1e293b',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Enviando solicitud de visita…</div>
                <div style={{ color: '#64748b' }}>
                  Estamos registrando tu petición. En unos segundos verás el estado actualizado.
                </div>
              </div>
            )}

            {visitRequest && visitRequest.status === 'PENDING' && (
              <div
                style={{
                  background: '#eff6ff',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '0.85rem',
                  color: '#1e293b',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Visita de valoración solicitada</div>
                <div style={{ color: '#64748b' }}>
                  El cliente aún no ha respondido a tu solicitud. Cuando la acepte, verás sus datos de contacto completos.
                </div>
              </div>
            )}

            {visitRequest && visitRequest.status === 'ACCEPTED' && (
              <>
                <div
                  style={{
                    background: '#ecfdf5',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '0.85rem',
                    color: '#065f46',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Visita de valoración aceptada</div>
                  <div>
                    El cliente ha aceptado tu visita. Ya puedes ponerte en contacto con él y usar la dirección exacta mostrada en el detalle.
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    background: '#fffbeb',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    fontSize: '0.8rem',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>Registra el acuerdo en la app</div>
                  <div>
                    Si durante la visita llegáis a un acuerdo económico para realizar el servicio, por favor registra tu oferta en la app.
                    Así quedará claro que eres el profesional que va a hacer el trabajo y podrás llevar mejor control de los servicios ganados.
                  </div>
                </div>
              </>
            )}

            {visitRequest && visitRequest.status === 'REJECTED' && (
              <div
                style={{
                  background: '#fef2f2',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '0.85rem',
                  color: '#b91c1c',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Visita de valoración rechazada</div>
                <div>
                  El cliente ha rechazado tu solicitud de visita. Si lo ves claro, puedes enviar una propuesta directamente desde esta pantalla.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Q&A ENTRY */}
      <div className="qa-entry-card" style={{ marginTop: '16px' }} onClick={onOpenQAModal}>
        <div className="qa-icon-badge">
          <IonIcon icon={chatboxEllipsesOutline} />
        </div>
        <div className="qa-content-text">
          <div className="qa-title">Preguntas y Dudas</div>
          <div className="qa-subtitle">
            {questionsCount === 0
              ? 'No hay preguntas todavía'
              : `${questionsCount} pregunta${
                  questionsCount > 1 ? 's' : ''
                } resuelta${questionsCount > 1 ? 's' : ''}`}
          </div>
        </div>
        <IonIcon icon={chevronForwardOutline} color="medium" />
      </div>

      {/* MI PUJA */}
      {myBid && (
        <div
          className={`my-bid-card animate__animated animate__fadeIn ${myBid.status === 'REJECTED' ? 'my-bid-card-rejected' : ''}`}
          style={{ marginTop: '16px' }}
        >
          <div className="bid-header">
            <IonIcon icon={walletOutline} /> {myBid.status === 'REJECTED' ? 'PROPUESTA RETIRADA' : 'TU PROPUESTA'}
          </div>
          <div className="bid-row">
            <span>Tu Precio:</span>
            <strong>{myBid.priceQuote}€</strong>
          </div>
          {myBid.estimatedExecutionTime && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.8rem',
                color: '#065f46',
                marginBottom: 10,
              }}
            >
              <IonIcon icon={timeOutline} style={{ fontSize: '0.9rem' }} />
              <span>
                Disponibilidad: <strong>{myBid.estimatedExecutionTime}</strong>
              </span>
            </div>
          )}
          {myBid.comment && (
            <div className="bid-comment-box">
              <IonIcon icon={chatbubbleEllipsesOutline} /> "{myBid.comment}"
            </div>
          )}
          <div className="bid-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <IonIcon icon={timeOutline} style={{ marginRight: '4px' }} />
              {myBid.status === 'REJECTED' ? 'Retirada el ' : 'Enviada el '}{new Date(myBid.createdAt).toLocaleDateString()}
            </span>
            {canCancelBid && onCancelBid && (
              <IonButton
                className="cancel-bid-btn"
                fill="solid"
                color="danger"
                size="small"
                onClick={() => onCancelBid()}
                disabled={cancellingBid}
              >
                {cancellingBid ? 'Cancelando...' : 'Cancelar propuesta'}
              </IonButton>
            )}
          </div>
        </div>
      )}

      {/* ESTADO CANCELADA */}
      {request.status === 'CANCELLED' && (
        <div style={{ marginTop: '16px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#64748b', fontWeight: 600 }}>Esta solicitud fue cancelada por el cliente.</p>
        </div>
      )}

      {/* ACCIONES */}
      <div style={{ marginTop: '16px', paddingBottom: '40px' }}>
        {!hasActiveBid && request.status === 'PENDING' && canSubmitBid && (
          <IonButton
            expand="block"
            className="pro-main-btn"
            onClick={onOpenBidModal}
          >
            <IonIcon slot="start" icon={walletOutline} /> ENVIAR PROPUESTA
          </IonButton>
        )}

        {!hasActiveBid && request.status === 'PENDING' && !canSubmitBid && (
            <div
            style={{
              textAlign: 'center',
              background: '#fef2f2',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid #fee2e2',
              color: '#b91c1c',
              marginTop: '10px',
            }}
          >
            <div
              style={{
                fontWeight: 800,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <IonIcon icon={lockClosedOutline} /> SOLO PARA PRO
            </div>
            <div
              style={{
                fontSize: '0.9rem',
                marginBottom: '15px',
                color: '#7f1d1d',
              }}
            >
              Esta solicitud es de <strong>alta dificultad</strong>. Necesitas una cuenta
              PRO para enviar propuestas.
            </div>
            <IonButton
              routerLink="/become-pro"
              fill="outline"
              color="danger"
              expand="block"
              style={{ height: '44px', fontWeight: 800 }}
            >
              ACTUALIZAR A PRO
            </IonButton>
          </div>
        )}

        {isWinner && !isCompleted && (
          <IonButton
            expand="block"
            color="success"
            className="pro-main-btn"
            onClick={onHandleFinishWork}
            disabled={isFinishing}
          >
            {isFinishing ? (
              'FINALIZANDO...'
            ) : (
              <>
                <IonIcon slot="start" icon={checkmarkCircle} /> FINALIZAR
                TRABAJO
              </>
            )}
          </IonButton>
        )}

        {isWinner && isCompleted && !hasReviewed && (
          <IonButton
            expand="block"
            color="secondary"
            className="pro-main-btn"
            onClick={onOpenReviewModal}
          >
            <IonIcon icon={star} slot="start" /> VALORAR CLIENTE
          </IonButton>
        )}

        {isWinner && isCompleted && hasReviewed && (
          <div className="completed-badge">
            <IonIcon icon={checkmarkCircle} /> ¡Trabajo cerrado y valorado!
          </div>
        )}
      </div>
    </div>
  );
};

