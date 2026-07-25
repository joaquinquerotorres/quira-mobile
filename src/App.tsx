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
  addCircleOutline,
  calendarOutline,
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
import NotificationSettings from './pages/NotificationSettings';
import { DowngradeBanner } from './components/DowngradeBanner';
import { initAnalytics, logEvent } from './services/analytics';
import { syncPushTokenForCurrentUser } from './services/pushNotifications';
import {
  getEffectiveActiveMode,
  hasProfessionalProfile,
  readStoredUser,
} from './utils/activeMode';

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
    '/profile/notifications',
    '/' // En la raíz para evitar flash antes del redirect
  ];

  // Verificamos si la ruta actual debe ocultar la barra
  // Ocultamos si estamos dentro de un detalle (/directory/123)
  const shouldHideTabBar = 
    hideTabBarPaths.includes(location.pathname) || 
    location.pathname.startsWith('/directory/'); // Oculta tabs en el detalle del pro

  const user = readStoredUser();
  const activeMode = getEffectiveActiveMode();
  // Tabs pro si el modo es pro, o si la ruta actual es del shell profesional
  // (evita tab bar vacía cuando la URL no coincide con ningún botón visible).
  const showProTabs =
    hasProfessionalProfile(user) &&
    (activeMode === 'pro' || isProShellPath(location.pathname));

  return (
    <>
      <IonTabs>
      <DowngradeBanner />
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
          <ChooseMode />
        </Route>
        <Route exact path="/new-request">
          <NewRequest />
        </Route>
        <Route exact path="/become-pro">
          <BecomePro />
        </Route>
        <Route exact path="/request/:id">
            <RequestDetail />
        </Route>
        <Route exact path="/pro/request/:id">
            <ProRequestDetail />
        </Route>
        <Route exact path="/request-list">
          <RequestList />
        </Route>
        <Route exact path="/directory">
          <Directory />
        </Route>
        
        {/* --- 2. NUEVA RUTA DE DETALLE --- */}
        <Route exact path="/directory/:id">
          <DirectoryDetail />
        </Route>

        <Route exact path="/market">
          <Market />
        </Route>
        <Route exact path="/profile">
          <Profile />
        </Route>
        <Route exact path="/profile/notifications">
          <NotificationSettings />
        </Route>
        <Route exact path="/my-work">
          <MyWork />
        </Route>
        <Route exact path="/pro/calendar">
          <ProCalendar />
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
          className={showProTabs ? 'quira-tab-hidden' : undefined}
        >
          <IonIcon aria-hidden="true" icon={homeOutline} />
          <IonLabel>Inicio</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="new-request"
          href="/new-request"
          className={showProTabs ? 'quira-tab-hidden quira-tab-pedir' : 'quira-tab-pedir'}
        >
          <IonIcon aria-hidden="true" icon={addCircleOutline} />
          <IonLabel>Pedir</IonLabel>
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
          tab="market"
          href="/market"
          className={showProTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={hammerOutline} />
          <IonLabel>Mercado</IonLabel>
        </IonTabButton>
        <IonTabButton
          tab="pro-calendar"
          href="/pro/calendar"
          className={showProTabs ? undefined : 'quira-tab-hidden'}
        >
          <IonIcon aria-hidden="true" icon={calendarOutline} />
          <IonLabel>Calendario</IonLabel>
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
    </IonApp>
  );
};

export default App;
