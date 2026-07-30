import React from 'react';
import { IonBadge, IonButton, IonIcon } from '@ionic/react';
import {
  calendarOutline,
  cashOutline,
  navigateOutline,
  lockClosedOutline,
  callOutline,
  checkmarkCircle,
  helpCircleOutline,
  star,
} from 'ionicons/icons';
import { ServiceRequest, VisitRequest } from '../../types';
import { env } from '../../config/env';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { formatStartsAtDateTime } from '../../api/calendarEventsApi';
import type { EffectiveTier } from '../../utils/effectiveTier';
import {
  formatRequestPriceRangeEuros,
  getRequestPriceRangeEuros,
} from '../../utils/requestPriceRange';
import { bidPriceLabel } from '../../utils/bidPriceLabel';
import { getProDetailStatus } from '../../utils/detailStatus';
import {
  DetailHeroHeader,
  InfoBox,
  PRICE_RANGE_DISCLAIMER,
  PersonCard,
  JobDetailsSection,
  QuestionsRow,
  DetailBottomAction,
} from '../detail';

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
  /** Hay una propuesta PENDING activa para este profesional. */
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
  canRequestVisitByPricing?: boolean;
  /** Evento de calendario existente para este trabajo (si lo hay). */
  calendarEventId?: number | null;
  /** Fecha/hora del trabajo agendada (`startsAt`), para mostrarla en detalle. */
  calendarStartsAt?: string | null;
  calendarLoading?: boolean;
  onAddToCalendar?: () => void;
  onEditCalendar?: () => void;
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
  canRequestVisitByPricing = false,
  calendarEventId = null,
  calendarStartsAt = null,
  calendarLoading = false,
  onAddToCalendar,
  onEditCalendar,
}) => {
  const detailStatus = getProDetailStatus({
    isCompleted,
    isWinner,
    hasBid: Boolean(myBid),
  });

  const hasExtraMedia =
    (request.extraPhotoUrls?.length ?? 0) +
      (request.extraVideoUrls?.length ?? 0) +
      (request.extraAudioUrls?.length ?? 0) >
    0;

  const winnerAndCompletionActions = (
    <>
      {isWinner && (
        <IonButton
          expand="block"
          fill="outline"
          color="primary"
          className="pro-main-btn"
          style={{ marginBottom: 10 }}
          disabled={calendarLoading}
          onClick={() => {
            if (calendarEventId && onEditCalendar) {
              onEditCalendar();
              return;
            }
            onAddToCalendar?.();
          }}
        >
          <IonIcon slot="start" icon={calendarOutline} />
          {calendarEventId ? 'EDITAR FECHA DEL TRABAJO' : 'AGENDAR FECHA DEL TRABAJO'}
        </IonButton>
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
    </>
  );

  const proLockUi = (
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
  );

  return (
    <div style={{ marginTop: '20px', padding: '0 5px' }}>
      <DetailHeroHeader
        status={detailStatus.key}
        statusLabel={detailStatus.label}
        title={request.title}
        extras={
          isHighRisk ? (
            <IonBadge color="danger" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
              ALTA DIFICULTAD
            </IonBadge>
          ) : undefined
        }
      />

      {request.client && (
        <PersonCard
          className="animate__animated animate__fadeIn"
          sectionLabel="Cliente"
          name={request.client.fullName || 'Cliente'}
          avatarUrl={request.client.avatar}
          rating={request.client.rating}
          reviewCount={request.client.reviewCount}
          highlight={isWinner || visitRequest?.status === 'ACCEPTED'}
          action={
            (isWinner ||
              (visitRequest?.status === 'ACCEPTED' && request.client.phoneNumber)) ? (
              <IonButton
                expand="block"
                color="success"
                onClick={onCallClient}
                style={{ fontWeight: 800, '--border-radius': '12px' }}
              >
                <IonIcon slot="start" icon={callOutline} /> LLAMAR AL CLIENTE
              </IonButton>
            ) : undefined
          }
        >
          {visitRequest?.status === 'ACCEPTED' && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 10px',
                borderRadius: '10px',
                background: '#ecfdf5',
                border: '1px solid #bbf7d0',
                color: '#065f46',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}
            >
              Visita aceptada: ya puedes contactar por teléfono.
            </div>
          )}
        </PersonCard>
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

      {isWinner && calendarStartsAt && (
        <InfoBox
          tone="success"
          icon={calendarOutline}
          label="Fecha del trabajo"
          value={formatStartsAtDateTime(calendarStartsAt)}
        />
      )}

      <InfoBox
        tone={isWinner ? 'success' : 'neutral'}
        icon={isWinner || isCompleted ? navigateOutline : lockClosedOutline}
        label="Ubicación"
        value={
          isWinner || isCompleted
            ? request.preciseAddress || request.address
            : `Zona: ${request.address.split(',').slice(0, 2).join(', ')}`
        }
      />

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

      <JobDetailsSection
        title="Detalles del trabajo"
        category={request.category}
        description={request.description}
        clientOriginalDescription={request.clientOriginalDescription}
        originalLabel="Texto del cliente"
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

        {canRequestVisitByPricing && request.status === 'PENDING' && (
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
                    El cliente ha aceptado tu visita. Ya puedes ponerte en contacto con él.
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
      </JobDetailsSection>

      <QuestionsRow
        questionsCount={questionsCount}
        emptySubtitle="No hay preguntas todavía"
        countFormat="resolved"
        onClick={onOpenQAModal}
      />

      {/* Acciones finales (DetailBottomAction incluye padding) */}
        {myBid ? (
          <DetailBottomAction
            variant="sent-bid"
            priceLabel={bidPriceLabel(myBid)}
            availability={myBid.estimatedExecutionTime}
            comment={myBid.comment}
            createdAt={myBid.createdAt}
            canWithdraw={canCancelBid}
            onWithdraw={onCancelBid}
            withdrawing={cancellingBid}
          >
            {winnerAndCompletionActions}
          </DetailBottomAction>
        ) : !hasActiveBid && request.status === 'PENDING' && canSubmitBid ? (
          <DetailBottomAction variant="send-bid" onSend={onOpenBidModal}>
            {winnerAndCompletionActions}
          </DetailBottomAction>
        ) : !hasActiveBid && request.status === 'PENDING' && !canSubmitBid ? (
          <DetailBottomAction variant="custom">
            {proLockUi}
            {winnerAndCompletionActions}
          </DetailBottomAction>
        ) : (
          <DetailBottomAction variant="custom">
            {winnerAndCompletionActions}
          </DetailBottomAction>
        )}
    </div>
  );
};
