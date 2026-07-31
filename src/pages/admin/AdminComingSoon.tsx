import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { isStoredUserAdmin } from '../../utils/adminAccess';
import './AdminDashboard.css';

interface AdminComingSoonProps {
  title: string;
  blurb: string;
}

/** Placeholder de módulos admin aún no implementados (fases 2–9). */
export const AdminComingSoon: React.FC<AdminComingSoonProps> = ({
  title,
  blurb,
}) => {
  if (!isStoredUserAdmin()) {
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
            <p className="admin-muted">Se requiere ROLE_ADMIN.</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="admin-page">
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin · {title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="admin-content">
          <h1 className="admin-title">{title}</h1>
          <p className="admin-subtitle">{blurb}</p>
          <section className="admin-section">
            <p className="admin-muted" style={{ margin: 0 }}>
              Esta sección llegará en una PR siguiente del roadmap admin. El
              acceso y las pestañas ya están preparados.
            </p>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
};

export const AdminBidsPage: React.FC = () => (
  <AdminComingSoon
    title="Ofertas"
    blurb="Bids globales, precios y win rate."
  />
);

export const AdminUsersPage: React.FC = () => (
  <AdminComingSoon
    title="Usuarios y pros"
    blurb="Cuentas, verificación y perfiles profesionales."
  />
);

export const AdminSubscriptionsPage: React.FC = () => (
  <AdminComingSoon
    title="Suscripciones"
    blurb="Planes SOLVER/PRO, sync Stripe y cancelaciones."
  />
);

export const AdminQualityPage: React.FC = () => (
  <AdminComingSoon
    title="Calidad y confianza"
    blurb="Reviews, predict safe/in_scope y colas de contenido."
  />
);

export const AdminOpsPage: React.FC = () => (
  <AdminComingSoon
    title="Ops / producto"
    blurb="Categorías, zonas, riesgo HIGH y can-bid."
  />
);

export const AdminPlatformPage: React.FC = () => (
  <AdminComingSoon
    title="Plataforma"
    blurb="Altas y actividad por iOS / Android / web."
  />
);

export const AdminToolsPage: React.FC = () => (
  <AdminComingSoon
    title="Herramientas"
    blurb="Buscador global, export CSV, feature flags y audit log."
  />
);
