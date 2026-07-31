import React, { useCallback, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import { chevronBackOutline, refreshOutline } from 'ionicons/icons';
import {
  fetchAdminStatsOverview,
  kpiDeltaPercent,
  type AdminKpiDelta,
  type AdminStatsOverview,
  type AdminStatsRange,
} from '../../api/adminApi';
import { AdminFunnel } from '../../components/admin/AdminFunnel';
import { AdminTimeseriesChart } from '../../components/admin/AdminTimeseriesChart';
import { isStoredUserAdmin } from '../../utils/adminAccess';
import './AdminDashboard.css';

const RANGES: { id: AdminStatsRange; label: string }[] = [
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: '90d', label: '90 días' },
];

function formatDelta(kpi: AdminKpiDelta): { text: string; cls: string } {
  const pct = kpiDeltaPercent(kpi);
  if (pct === null) {
    return { text: `vs ${kpi.previous} ant.`, cls: 'flat' };
  }
  const sign = pct > 0 ? '+' : '';
  const cls = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';
  return { text: `${sign}${pct.toFixed(0)}% vs ant.`, cls };
}

function KpiCard({ label, kpi }: { label: string; kpi: AdminKpiDelta }) {
  const delta = formatDelta(kpi);
  return (
    <div className="admin-kpi">
      <span className="admin-kpi-label">{label}</span>
      <div className="admin-kpi-value">{kpi.value}</div>
      <span className={`admin-kpi-delta ${delta.cls}`}>{delta.text}</span>
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const router = useIonRouter();
  const [allowed, setAllowed] = useState(() => isStoredUserAdmin());
  const [range, setRange] = useState<AdminStatsRange>('30d');
  const [data, setData] = useState<AdminStatsOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selected: AdminStatsRange) => {
    if (!isStoredUserAdmin()) {
      setAllowed(false);
      return;
    }
    setAllowed(true);
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchAdminStatsOverview(selected);
      setData(overview);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        setError('No tienes permiso para ver el admin (ROLE_ADMIN requerido en API).');
      } else if (status === 404) {
        setError(
          'El endpoint /admin/stats/overview aún no está disponible en la API. Despliega el contrato documentado en docs/ADMIN.md.',
        );
      } else {
        setError('No se pudieron cargar las métricas del admin.');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  if (!allowed) {
    return (
      <IonPage className="admin-page">
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => router.push('/profile', 'back')}>
                <IonIcon slot="icon-only" icon={chevronBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>Admin</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="admin-denied">
            <h1>Acceso restringido</h1>
            <p className="admin-muted">
              Esta sección solo está disponible para usuarios con ROLE_ADMIN.
            </p>
            <IonButton fill="outline" onClick={() => router.push('/profile', 'back')}>
              Volver al perfil
            </IonButton>
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
            <IonButton onClick={() => router.push('/profile', 'back')}>
              <IonIcon slot="icon-only" icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Admin · Dashboard</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => void load(range)} aria-label="Actualizar">
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="admin-content">
          <div className="admin-header-row">
            <div>
              <h1 className="admin-title">Resumen</h1>
              <p className="admin-subtitle">KPIs, embudo, colas y tendencias</p>
            </div>
          </div>

          <div className="admin-range" role="group" aria-label="Periodo">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                className={range === r.id ? 'active' : undefined}
                onClick={() => setRange(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {data?.period && (
            <p className="admin-period-hint">
              {data.period.from} → {data.period.to} (vs {data.period.previousFrom} →{' '}
              {data.period.previousTo})
            </p>
          )}

          {error && <div className="admin-error">{error}</div>}

          {loading && !data ? (
            <div className="admin-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : data ? (
            <>
              <section className="admin-section">
                <h2>Colas operativas</h2>
                <div className="admin-queues">
                  <div className="admin-queue">
                    <strong>{data.queues.pendingApproval}</strong>
                    <span>Moderación (PENDING_APPROVAL)</span>
                  </div>
                  <div className="admin-queue">
                    <strong>{data.queues.pendingVisitRequests}</strong>
                    <span>Visitas pendientes</span>
                  </div>
                </div>
              </section>

              <section className="admin-section">
                <h2>KPIs del periodo</h2>
                <div className="admin-kpi-grid">
                  <KpiCard label="Usuarios nuevos" kpi={data.kpis.newUsers} />
                  <KpiCard label="Pros nuevos" kpi={data.kpis.newPros} />
                  <KpiCard label="Solicitudes" kpi={data.kpis.newRequests} />
                  <KpiCard label="Ofertas" kpi={data.kpis.newBids} />
                  <KpiCard label="Ofertas aceptadas" kpi={data.kpis.acceptedBids} />
                  <KpiCard label="Completadas" kpi={data.kpis.completedRequests} />
                  <KpiCard
                    label="Suscripciones activas"
                    kpi={data.kpis.activePaidSubscriptions}
                  />
                  <div className="admin-kpi">
                    <span className="admin-kpi-label">Cancel. al periodo</span>
                    <div className="admin-kpi-value">
                      {data.kpis.cancelAtPeriodEnd.value}
                    </div>
                    <span className="admin-kpi-delta flat">Stripe cancel_at_period_end</span>
                  </div>
                </div>
              </section>

              <section className="admin-section">
                <h2>Embudo</h2>
                <AdminFunnel funnel={data.funnel} />
              </section>

              <section className="admin-section">
                <h2>Tendencias</h2>
                <AdminTimeseriesChart points={data.timeseries.points} />
              </section>
            </>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;
