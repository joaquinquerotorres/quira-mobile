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
  addCircleOutline 
} from 'ionicons/icons';

import RequestList from './pages/RequestList';
import Market from './pages/Market';
import Profile from './pages/Profile';
import MyWork from './pages/MyWork';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailPending from './pages/VerifyEmailPending';
import DeepLinkHandler from './components/DeepLinkHandler';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';
import BecomePro from './pages/BecomePro';
import NewRequest from './pages/NewRequest';
import RequestDetail from './pages/RequestDetail';
import ProRequestDetail from './pages/ProRequestDetail';
import Directory from './pages/Directory';
import DirectoryDetail from './pages/DirectoryDetail';
import NotificationSettings from './pages/NotificationSettings';
import { DowngradeBanner } from './components/DowngradeBanner';
import { initAnalytics, logEvent } from './services/analytics';
import { syncPushTokenForCurrentUser } from './services/pushNotifications';

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
    '/profile/notifications',
    '/' // En la raíz para evitar flash antes del redirect
  ];

  // Verificamos si la ruta actual debe ocultar la barra
  // Ocultamos si estamos dentro de un detalle (/directory/123)
  const shouldHideTabBar = 
    hideTabBarPaths.includes(location.pathname) || 
    location.pathname.startsWith('/directory/'); // Oculta tabs en el detalle del pro

  const userStr = localStorage.getItem('user');
  let isPro = false;
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      isPro = user.roles?.includes('ROLE_PRO') || !!user.professionalProfile; 
    } catch (e) {
      console.error("Error parsing user", e);
    }
  }

  return (
    <>
      <DeepLinkHandler />
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
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
      </IonRouterOutlet>

      {/* 4. Renderizado Condicional de la Barra */}
      {/* Solo mostramos IonTabBar si NO estamos en las páginas de login/registro/detalle */}
      {!shouldHideTabBar && (
        <IonTabBar slot="bottom" className="quira-tabbar">
          
          {/* TAB 1: INICIO */}
          <IonTabButton tab="requestList" href="/request-list">
            <IonIcon aria-hidden="true" icon={homeOutline} />
            <IonLabel>Inicio</IonLabel>
          </IonTabButton>

          {/* TAB 2: MERCADO (Solo PRO) */}
          {isPro && (
            <IonTabButton tab="market" href="/market">
              <IonIcon aria-hidden="true" icon={hammerOutline} />
              <IonLabel>Mercado</IonLabel>
            </IonTabButton>
          )}

          {/* BOTÓN CENTRAL: PEDIR (icono grande pero sin margin extra: evita recortar la etiqueta) */}
          <IonTabButton tab="new-request" href="/new-request" className="quira-tab-pedir">
            <IonIcon aria-hidden="true" icon={addCircleOutline} />
            <IonLabel>Pedir</IonLabel>
          </IonTabButton>

          {/* TAB 4: GESTIÓN (Solo PRO) */}
          {isPro && (
            <IonTabButton tab="my-work" href="/my-work">
              <IonIcon aria-hidden="true" icon={briefcaseOutline} />
              <IonLabel>Gestión</IonLabel>
            </IonTabButton>
          )}

          {/* TAB 3: PERFIL */}
          <IonTabButton tab="profile" href="/profile">
            <IonIcon aria-hidden="true" icon={personOutline} />
            <IonLabel>Perfil</IonLabel>
          </IonTabButton>

        </IonTabBar>
      )}
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
