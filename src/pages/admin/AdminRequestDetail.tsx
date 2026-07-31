import React, { useCallback, useEffect, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  IonToast,
  useIonRouter,
} from '@ionic/react';
import { chevronBackOutline, refreshOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import {
  approveAdminRequest,
  cancelAdminRequest,
  fetchAdminRequestDetail,
  rejectAdminRequest,
  type AdminRequestDetail as AdminRequestDetailType,
} from '../../api/adminApi';
import { isStoredUserAdmin } from '../../utils/adminAccess';
import { getCategoryLabel } from '../../utils/categoryLabels';
import { formatRequestPriceRangeEuros } from '../../utils/requestPriceRange';
import { openRequestMediaFromSources } from '../../components/shared/RequestMediaModal';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { TOAST_DURATION_MS } from '../../config/uiTiming';
import './AdminDashboard.css';
import './AdminRequests.css';

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Moderación',
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  COMPLETED: 'Completada',
};

const AdminRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useIonRouter();
  const requestId = Number(id);
  const [allowed] = useState(() => isStoredUserAdmin());
  const [data, setData] = useState<AdminRequestDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | 'approve' | 'reject' | 'cancel'>(
    null,
  );

  const load = useCallback(async () => {
    if (!isStoredUserAdmin() || !Number.isFinite(requestId)) return;
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAdminRequestDetail(requestId));
    } catch (err: unknown) {
      const http = (err as { response?: { status?: number } })?.response?.status;
      if (http === 404) {
        setError('Solicitud no encontrada o endpoint admin no disponible.');
      } else if (http === 403 || http === 401) {
        setError('Sin permiso ROLE_ADMIN.');
      } else {
        setError('No se pudo cargar el detalle.');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (action: 'approve' | 'reject' | 'cancel') => {
    if (!data) return;
    setBusy(true);
    try {
      if (action === 'approve') {
        const next = await approveAdminRequest(data.id);
        setData(next);
        setToast('Solicitud aprobada y publicada (PENDING).');
      } else if (action === 'reject') {
        await rejectAdminRequest(data.id);
        setToast('Solicitud rechazada.');
        router.push('/admin/requests', 'back');
      } else {
        await cancelAdminRequest(data.id);
        setToast('Solicitud cancelada.');
        router.push('/admin/requests', 'back');
      }
    } catch {
      setToast('No se pudo completar la acción.');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  if (!allowed) {
    return (
      <IonPage className="admin-page">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Admin</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="admin-denied">
            <h1>Acceso restringido</h1>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="admin-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.push('/admin/requests', 'back')}>
              <IonIcon slot="icon-only" icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Solicitud #{id}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => void load()} aria-label="Actualizar">
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="admin-content">
          {loading && !data ? (
            <div className="admin-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : error ? (
            <div className="admin-error">{error}</div>
          ) : data ? (
            <>
              <h1 className="admin-title">{data.title || 'Sin título'}</h1>
              <p className="admin-subtitle">
                {STATUS_LABEL[data.status] ?? data.status}
                {data.category
                  ? ` · ${getCategoryLabel(data.category)}`
                  : ''}
                {data.riskLevel ? ` · riesgo ${data.riskLevel}` : ''}
              </p>

              {(data.status === 'PENDING_APPROVAL' ||
                data.status === 'PENDING') && (
                <section className="admin-section admin-actions">
                  <h2>Acciones</h2>
                  <div className="admin-action-row">
                    {data.status === 'PENDING_APPROVAL' && (
                      <>
                        <IonButton
                          color="success"
                          disabled={busy}
                          onClick={() => setConfirm('approve')}
                        >
                          Aprobar
                        </IonButton>
                        <IonButton
                          color="danger"
                          fill="outline"
                          disabled={busy}
                          onClick={() => setConfirm('reject')}
                        >
                          Rechazar
                        </IonButton>
                      </>
                    )}
                    {data.status === 'PENDING' && (
                      <IonButton
                        color="medium"
                        fill="outline"
                        disabled={busy}
                        onClick={() => setConfirm('cancel')}
                      >
                        Cancelar solicitud
                      </IonButton>
                    )}
                  </div>
                </section>
              )}

              <section className="admin-section">
                <h2>Cliente</h2>
                <p className="admin-detail-line">
                  {data.clientName || '—'} · {data.clientEmail || 'sin email'}
                </p>
                {data.address && (
                  <p className="admin-detail-line">{data.address}</p>
                )}
                {data.desiredExecutionTime && (
                  <p className="admin-detail-line">
                    Disponibilidad: {data.desiredExecutionTime}
                  </p>
                )}
              </section>

              <section className="admin-section">
                <h2>Precio IA</h2>
                <p className="admin-detail-line">
                  {formatRequestPriceRangeEuros({
                    estimatedPriceMin: data.estimatedPriceMin ?? 0,
                    estimatedPriceMax: data.estimatedPriceMax ?? 0,
                  })}
                </p>
                <p className="admin-detail-line">
                  safe={String(data.aiSafe)} · in_scope={String(data.aiInScope)}
                </p>
                {data.aiSafetyReason && (
                  <p className="admin-detail-line warn-text">
                    Motivo: {data.aiSafetyReason}
                  </p>
                )}
                {data.aiOutOfScopeReason && (
                  <p className="admin-detail-line warn-text">
                    Fuera de cobertura: {data.aiOutOfScopeReason}
                  </p>
                )}
              </section>

              <section className="admin-section">
                <h2>Descripción</h2>
                <p className="admin-detail-body">
                  {data.description || '—'}
                </p>
                {data.clientOriginalDescription && (
                  <>
                    <h2 style={{ marginTop: 12 }}>Texto del cliente</h2>
                    <p className="admin-detail-body">
                      {data.clientOriginalDescription}
                    </p>
                  </>
                )}
              </section>

              {(data.photoUrl ||
                data.videoUrl ||
                data.audioUrl ||
                data.extraPhotoUrls?.length ||
                data.extraVideoUrls?.length) && (
                <section className="admin-section">
                  <h2>Media</h2>
                  <div className="admin-media-row">
                    {data.photoUrl && (
                      <button
                        type="button"
                        className="admin-media-thumb"
                        onClick={() =>
                          openRequestMediaFromSources(data, {
                            url: data.photoUrl,
                            kind: 'photo',
                          })
                        }
                      >
                        <img
                          src={resolveMediaUrl(data.photoUrl)}
                          alt="Foto"
                        />
                      </button>
                    )}
                    {data.videoUrl && (
                      <button
                        type="button"
                        className="admin-media-thumb"
                        onClick={() =>
                          openRequestMediaFromSources(data, {
                            url: data.videoUrl,
                            kind: 'video',
                          })
                        }
                      >
                        <span>Vídeo</span>
                      </button>
                    )}
                    <IonButton
                      size="small"
                      fill="outline"
                      onClick={() => openRequestMediaFromSources(data)}
                    >
                      Abrir galería
                    </IonButton>
                  </div>
                </section>
              )}

              <section className="admin-section">
                <h2>Ofertas ({data.bids?.length ?? data.bidCount ?? 0})</h2>
                {(data.bids ?? []).length === 0 ? (
                  <p className="admin-muted" style={{ margin: 0 }}>
                    Sin ofertas.
                  </p>
                ) : (
                  <ul className="admin-bid-list">
                    {(data.bids ?? []).map((b) => (
                      <li key={b.id}>
                        <strong>{b.professionalName || `Bid #${b.id}`}</strong>
                        <span>
                          {' '}
                          · {b.status}
                          {b.pricingType ? ` · ${b.pricingType}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {data.assignedProfessionalName && (
                  <p className="admin-detail-line" style={{ marginTop: 8 }}>
                    Asignado: {data.assignedProfessionalName}
                  </p>
                )}
              </section>
            </>
          ) : null}
        </div>

        <IonAlert
          isOpen={confirm != null}
          header={
            confirm === 'approve'
              ? '¿Aprobar solicitud?'
              : confirm === 'reject'
                ? '¿Rechazar solicitud?'
                : '¿Cancelar solicitud?'
          }
          message={
            confirm === 'approve'
              ? 'Pasará a PENDING y será visible en el mercado.'
              : 'Esta acción no se puede deshacer fácilmente.'
          }
          buttons={[
            { text: 'No', role: 'cancel', handler: () => setConfirm(null) },
            {
              text: 'Sí',
              handler: () => {
                if (confirm) void runAction(confirm);
              },
            },
          ]}
          onDidDismiss={() => setConfirm(null)}
        />
        <IonToast
          isOpen={!!toast}
          message={toast ?? ''}
          duration={TOAST_DURATION_MS}
          onDidDismiss={() => setToast(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminRequestDetail;
