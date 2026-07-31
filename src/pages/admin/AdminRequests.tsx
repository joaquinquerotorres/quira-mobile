import React, { useCallback, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import { refreshOutline, searchOutline } from 'ionicons/icons';
import {
  fetchAdminRequests,
  type AdminRequestListItem,
  type AdminRequestStatusFilter,
} from '../../api/adminApi';
import { isStoredUserAdmin } from '../../utils/adminAccess';
import { getCategoryLabel } from '../../utils/categoryLabels';
import { formatRequestPriceRangeEuros } from '../../utils/requestPriceRange';
import './AdminDashboard.css';
import './AdminRequests.css';

const STATUS_FILTERS: { id: AdminRequestStatusFilter; label: string }[] = [
  { id: 'ALL', label: 'Todas' },
  { id: 'PENDING_APPROVAL', label: 'Moderación' },
  { id: 'PENDING', label: 'Pendientes' },
  { id: 'ACCEPTED', label: 'Aceptadas' },
  { id: 'COMPLETED', label: 'Completadas' },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Moderación',
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  COMPLETED: 'Completada',
};

function statusClass(status: string): string {
  if (status === 'PENDING_APPROVAL') return 'warn';
  if (status === 'PENDING') return 'info';
  if (status === 'ACCEPTED') return 'ok';
  if (status === 'COMPLETED') return 'done';
  return 'flat';
}

const PAGE_SIZE = 20;

const AdminRequests: React.FC = () => {
  const router = useIonRouter();
  const [allowed] = useState(() => isStoredUserAdmin());
  const [status, setStatus] = useState<AdminRequestStatusFilter>('ALL');
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [items, setItems] = useState<AdminRequestListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts: { page: number; append: boolean; status: AdminRequestStatusFilter; q: string }) => {
      if (!isStoredUserAdmin()) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminRequests({
          status: opts.status,
          q: opts.q,
          page: opts.page,
          itemsPerPage: PAGE_SIZE,
        });
        setTotal(res.total);
        setPage(res.page);
        setItems((prev) =>
          opts.append ? [...prev, ...(res.items ?? [])] : res.items ?? [],
        );
      } catch (err: unknown) {
        const http = (err as { response?: { status?: number } })?.response?.status;
        if (http === 404) {
          setError(
            'El endpoint /admin/requests aún no está en la API. Despliega el contrato de docs/ADMIN.md (fase 2).',
          );
        } else if (http === 401 || http === 403) {
          setError('Sin permiso ROLE_ADMIN en la API.');
        } else {
          setError('No se pudieron cargar las solicitudes.');
        }
        if (!opts.append) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void load({ page: 1, append: false, status, q });
  }, [load, status, q]);

  if (!allowed) {
    return (
      <IonPage className="admin-page">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Admin · Solicitudes</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="admin-denied">
            <h1>Acceso restringido</h1>
            <p className="admin-muted">Se requiere ROLE_ADMIN.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const hasMore = items.length < total;

  return (
    <IonPage className="admin-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin · Solicitudes</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => void load({ page: 1, append: false, status, q })}
              aria-label="Actualizar"
            >
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (e) => {
            await load({ page: 1, append: false, status, q });
            e.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <div className="admin-content">
          <form
            className="admin-search"
            onSubmit={(e) => {
              e.preventDefault();
              setQ(searchInput.trim());
            }}
          >
            <IonIcon icon={searchOutline} aria-hidden="true" />
            <input
              type="search"
              placeholder="Buscar id, título, email…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>

          <div className="admin-range admin-status-filters" role="group" aria-label="Estado">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={status === f.id ? 'active' : undefined}
                onClick={() => setStatus(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <p className="admin-period-hint">
            {loading && items.length === 0
              ? 'Cargando…'
              : `${total} solicitud${total === 1 ? '' : 'es'}`}
          </p>

          {error && <div className="admin-error">{error}</div>}

          {loading && items.length === 0 ? (
            <div className="admin-loading">
              <IonSpinner name="crescent" />
            </div>
          ) : items.length === 0 && !error ? (
            <section className="admin-section">
              <p className="admin-muted" style={{ margin: 0 }}>
                No hay solicitudes con este filtro.
              </p>
            </section>
          ) : (
            <div className="admin-req-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="admin-req-card"
                  onClick={() => router.push(`/admin/requests/${item.id}`)}
                >
                  <div className="admin-req-card-top">
                    <span className={`admin-status-pill ${statusClass(item.status)}`}>
                      {STATUS_LABEL[item.status] ?? item.status}
                    </span>
                    <span className="admin-req-id">#{item.id}</span>
                  </div>
                  <div className="admin-req-title">{item.title || 'Sin título'}</div>
                  <div className="admin-req-meta">
                    <span>
                      {item.category
                        ? getCategoryLabel(item.category)
                        : 'Sin categoría'}
                    </span>
                    {item.riskLevel ? <span>· {item.riskLevel}</span> : null}
                    <span>· {item.bidCount} ofertas</span>
                  </div>
                  <div className="admin-req-meta">
                    <span>
                      {item.clientName || item.clientEmail || 'Cliente'}
                    </span>
                    <span>
                      ·{' '}
                      {formatRequestPriceRangeEuros({
                        estimatedPriceMin: item.estimatedPriceMin ?? 0,
                        estimatedPriceMax: item.estimatedPriceMax ?? 0,
                      })}
                    </span>
                  </div>
                  {item.aiSafe === false && (
                    <div className="admin-req-flag">IA: safe=false</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <IonInfiniteScroll
          disabled={!hasMore || loading}
          onIonInfinite={async (ev) => {
            await load({ page: page + 1, append: true, status, q });
            ev.target.complete();
          }}
        >
          <IonInfiniteScrollContent loadingText="Cargando más…" />
        </IonInfiniteScroll>
      </IonContent>
    </IonPage>
  );
};

export default AdminRequests;
