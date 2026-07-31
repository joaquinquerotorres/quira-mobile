import React from 'react';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  cardOutline,
  constructOutline,
  phonePortraitOutline,
  peopleOutline,
  shieldCheckmarkOutline,
  settingsOutline,
} from 'ionicons/icons';
import { isStoredUserAdmin } from '../../utils/adminAccess';
import './AdminDashboard.css';

const LINKS: {
  href: string;
  label: string;
  hint: string;
  icon: string;
}[] = [
  {
    href: '/admin/users',
    label: 'Usuarios y pros',
    hint: 'Verificación, roles, notas',
    icon: peopleOutline,
  },
  {
    href: '/admin/subscriptions',
    label: 'Suscripciones',
    hint: 'Stripe, paidThroughAt, cancelaciones',
    icon: cardOutline,
  },
  {
    href: '/admin/quality',
    label: 'Calidad y confianza',
    hint: 'Reviews, predict, moderación IA',
    icon: shieldCheckmarkOutline,
  },
  {
    href: '/admin/ops',
    label: 'Ops / producto',
    hint: 'Categorías, zonas, can-bid',
    icon: constructOutline,
  },
  {
    href: '/admin/platform',
    label: 'Plataforma',
    hint: 'iOS / Android / versión app',
    icon: phonePortraitOutline,
  },
  {
    href: '/admin/tools',
    label: 'Herramientas',
    hint: 'Buscador, export, flags, audit',
    icon: settingsOutline,
  },
];

const AdminMore: React.FC = () => {
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
          <IonTitle>Admin · Más</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="admin-content">
          <h1 className="admin-title">Más módulos</h1>
          <p className="admin-subtitle">
            Atajos del roadmap admin (fases 4–9)
          </p>
          <IonList className="admin-more-list" lines="full">
            {LINKS.map((item) => (
              <IonItem key={item.href} routerLink={item.href} detail button>
                <IonIcon slot="start" icon={item.icon} color="primary" />
                <IonLabel>
                  <h2>{item.label}</h2>
                  <p>{item.hint}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminMore;
