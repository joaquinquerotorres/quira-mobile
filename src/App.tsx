import React, { useEffect } from 'react';
import { Redirect, Route, useLocation } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { 
  homeOutline, 
  hammerOutline, 
  personOutline, 
  briefcaseOutline, 
  add,
  calendarOutline,
  statsChartOutline,
  documentTextOutline,
  cashOutline,
  appsOutline,
} from 'ionicons/icons';

import RequestList from './pages/RequestList';
import Market from './pages/Market';
import Profile from './pages/Profile';
import MyWork from './pages/MyWork';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailPending from './pages/VerifyEmailPending';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import BecomePro from './pages/BecomePro';
import NewRequest from './pages/NewRequest';
import RequestDetail from './pages/RequestDetail';
import ProRequestDetail from './pages/ProRequestDetail';
import ProCalendar from './pages/ProCalendar';
import ChooseMode from './pages/ChooseMode';
import Directory from './pages/Directory';
import DirectoryDetail from './pages/DirectoryDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMore from './pages/admin/AdminMore';
import {
  AdminBidsPage,
  AdminOpsPage,
  AdminPlatformPage,
  AdminQualityPage,
  AdminRequestsPage,
  AdminSubscriptionsPage,
  AdminToolsPage,
  AdminUsersPage,
} from './pages/admin/AdminComingSoon';
import { DowngradeBanner } from './components/DowngradeBanner';
import { RequestMediaModalHost } from './components/shared/RequestMediaModal';
import { initAnalytics, logEvent } from './services/analytics';
import { syncPushTokenForCurrentUser } from './services/pushNotifications';
import {
  getEffectiveActiveMode,
  hasProfessionalProfile,
  readStoredUser,
} from './utils/activeMode';
import { hasAdminRole } from './utils/adminAccess';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './theme/variables.css';
import './theme/inputs.css';

setupIonicReact();

function isProShellPath(pathname: string): boolean {
  return (
    pathname === '/my-work' ||
    pathname === '/market' ||
    pathname === '/pro/calendar' ||
    pathname.startsWith('/pro/')
  );
}

const MainTabs: React.FC = () => {
  
  const location = useLocation();

  const hideTabBarPaths = [
    '/login', 
    '/forgot-password',
    '/verify-email',
    '/verify-email-pending',
    '/reset-password',
    '/register', 
    '/become-pro', 
    '/choose-mode',
    '/' // En la raíz para evitar flash antes del redirect
  ];

  const user = readStoredUser();
  const isAdmin = hasAdminRole(user);
  const activeMode = getEffectiveActiveMode();

  // Verificamos si la ruta actual debe ocultar la barra
  const shouldHideTabBar =
    hideTabBarPaths.includes(location.pathname) ||
    (!isAdmin && location.pathname.startsWith('/directory/'));

  // Tabs pro si el modo es pro, o si la ruta actual es del shell profesional
  // (evita tab bar vacía cuando la URL no coincide con ningún botón visible).
  const showProTabs =
    !isAdmin &&
    hasProfessionalProfile(user) &&
    (activeMode === 'pro' || isProShellPath(location.pathname));

  const showClientTabs = !isAdmin && !showProTabs;
  const showAdminTabs = isAdmin;

  return (
    <>
      <IonTabs>
      {!isAdmin && <DowngradeBanner />}
      <IonRouterOutlet>
        <Route exact path="/login">
          <Login />
        </Route>
        <Route exact path="/forgot-password">
          <ForgotPassword />
        </Route>
        <Route exact path="/verify-email">
          <VerifyEmail />
        </Route>
        <Route exact path="/verify-email-pending">
          <VerifyEmailPending />
        </Route>
        <Route exact path="/reset-password">
          <ResetPassword />
        </Route>
        <Route exact path="/register">
          <Register />
        </Route>
        <Route exact path="/choose-mode">
          {isAdmin ? <Redirect to="/admin" /> : <ChooseMode />}
        </Route>
        <Route exact path="/new-request">
          {isAdmin ? <Redirect to="/admin" /> : <NewRequest />}
        </Route>
        <Route exact path="/become-pro">
          {isAdmin ? <Redirect to="/admin" /> : <BecomePro />}
        </Route>
        <Route exact path="/request/:id">
          {isAdmin ? <Redirect to="/admin" /> : <RequestDetail />}
        </Route>
        <Route exact path="/pro/request/:id">
          {isAdmin ? <Redirect to="/admin" /> : <ProRequestDetail />}
        </Route>
        <Route exact path="/request-list">
          {isAdmin ? <Redirect to="/admin" /> : <RequestList />}
        </Route>
        <Route exact path="/directory">
          {isAdmin ? <Redirect to="/admin" /> : <Directory />}
        </Route>
        <Route exact path="/directory/:id">
          {isAdmin ? <Redirect to="/admin" /> : <DirectoryDetail />}
        </Route>
        <Route exact path="/market">
          {isAdmin ? <Redirect to="/admin" /> : <Market />}
        </Route>
        <Route exact path="/profile">
          <Profile />
        </Route>
        <Route exact path="/my-work">
          {isAdmin ? <Redirect to="/admin" /> : <MyWork />}
        </Route>
        <Route exact path="/pro/calendar">
          {isAdmin ? <Redirect to="/admin" /> : <ProCalendar />}
        </Route>
        <Route exact path="/admin">
          <AdminDashboard />
        </Route>
        <Route exact path="/admin/dashboard">
          <Redirect to="/admin" />
        </Route>
        <Route exact path="/admin/requests">
          <AdminRequestsPage />
        </Route>
        <Route exact path="/admin/bids">
          <AdminBidsPage />
        </Route>
        <Route exact path="/admin/more">
          <AdminMore />
        </Route>
        <Route exact path="/admin/users">
          <AdminUsersPage />
        </Route>
        <Route exact path="/admin/subscriptions">
          <AdminSubscriptionsPage />
        </Route>
        <Route exact path="/admin/quality">
          <AdminQualityPage />
        </Route>
        <Route exact path="/admin/ops">
          <AdminOpsPage />
        </Route>
        <Route exact path="/admin/platform">
          <AdminPlatformPage />
        </Route>
        <Route exact path="/admin/tools">
          <AdminToolsPage />
        </Route>
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
      </IonRouterOutlet>

      {/* Mantener IonTabBar siempre montado: desmontarlo rompe Ionic en el navegador.
          Los botones de ambos modos existen; se ocultan con CSS según el modo. */}
      <IonTabBar
        slot="bottom"
        className={`quira-tabbar${shouldHideTabBar ? ' quira-tabbar--hidden' : ''}`}
      >
        <IonTabButton
          tab="requestList"
          href="/request-list"
          className={showClientTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={homeOutline} />
          <IonLabel>Inicio</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="new-request"
          href="/new-request"
          className={
            showClientTabs ? 'quira-tab-pedir' : 'quira-tab-hidden quira-tab-pedir'
          }
        >
          <IonIcon aria-hidden="true" icon={add} />
          <IonLabel>Pedir</IonLabel>
        </IonTabButton>

        <IonTabButton
          tab="market"
          href="/market"
          className={showProTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={hammerOutline} />
          <IonLabel>Mercado</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="my-work"
          href="/my-work"
          className={showProTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={briefcaseOutline} />
          <IonLabel>Gestión</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="pro-calendar"
          href="/pro/calendar"
          className={showProTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={calendarOutline} />
          <IonLabel>Calendario</IonLabel>
        </IonTabButton>

        <IonTabButton
          tab="admin-home"
          href="/admin"
          className={showAdminTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={statsChartOutline} />
          <IonLabel>Resumen</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="admin-requests"
          href="/admin/requests"
          className={showAdminTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={documentTextOutline} />
          <IonLabel>Solicitudes</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="admin-bids"
          href="/admin/bids"
          className={showAdminTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={cashOutline} />
          <IonLabel>Ofertas</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="admin-more"
          href="/admin/more"
          className={showAdminTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={appsOutline} />
          <IonLabel>Más</IonLabel>
        </IonTabButton>

        <IonTabButton tab="profile" href="/profile">
          <IonIcon aria-hidden="true" icon={personOutline} />
          <IonLabel>Perfil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
    </>
  );
};

// Componente Principal que envuelve todo
const App: React.FC = () => {
  useEffect(() => {
    // Inicializamos Analytics (solo nativo) y registramos un evento simple de arranque.
    initAnalytics().then(() => logEvent('app_start')).catch(() => {});
    // Registro de push: pide permisos, obtiene FCM y lo guarda en User.fcmToken.
    syncPushTokenForCurrentUser().catch(() => {});
  }, []);

  return (
    <IonApp>
      <IonReactRouter>
        <MainTabs />
      </IonReactRouter>
      <RequestMediaModalHost />
    </IonApp>
  );
};

export default App;
