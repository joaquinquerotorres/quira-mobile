import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useIonRouter } from '@ionic/react';
import { env } from '../config/env';
import { API_PUBLIC_ORIGIN, PUBLIC_SITE_ORIGIN } from '../config/publicSite';
import './PrivacyLegal.css';

/**
 * Información de privacidad / RGPD alineada con el stack: API propia, Gemini (IA),
 * Twilio (notificaciones), Stripe (suscripciones), Google Maps, Google Analytics,
 * Firebase (auth + analítica), Sentry opcional, Capacitor.
 */
const PrivacyLegal: React.FC = () => {
  const router = useIonRouter();

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#f8fafc' } as React.CSSProperties}>
          <IonButtons slot="start">
            <IonButton onClick={() => router.goBack()} aria-label="Volver">
              <IonIcon icon={chevronBackOutline} color="dark" />
            </IonButton>
          </IonButtons>
          <IonTitle>Privacidad y datos personales</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="privacy-legal-page ion-padding">
        <div className="privacy-legal-inner">
          <span className="privacy-legal-tag">Información legal</span>
          <p className="privacy-legal-lead">
            Esta aplicación (Quira) trata datos personales conforme al Reglamento (UE) 2016/679 (RGPD) y la
            normativa española de protección de datos. El sitio del proyecto es{' '}
            <a href={PUBLIC_SITE_ORIGIN} target="_blank" rel="noopener noreferrer">
              quira.app
            </a>
            ; la API del servicio está en{' '}
            <a href={API_PUBLIC_ORIGIN} target="_blank" rel="noopener noreferrer">
              api.quira.app
            </a>
            . A continuación resumimos qué ocurre en esta app y con qué proveedores técnicos; el detalle
            jurídico completo puede ampliarse en la política de privacidad en web y, si aplica, información
            sobre cookies.
          </p>

          <div className="privacy-legal-note">
            El texto siguiente describe el comportamiento del software Quira Mobile. Quien sea responsable del
            tratamiento en calidad de <strong>persona física o autónomo</strong> debe poder identificarse e indicar
            un medio de contacto para el ejercicio de derechos (el art. 13 del RGPD lo exige). El delegado de
            protección de datos (DPO) solo aplica en los supuestos previstos por la ley.
          </div>

          <h2>1. Responsable del tratamiento</h2>
          {env.privacyControllerSummary ? (
            <p>{env.privacyControllerSummary}</p>
          ) : (
            <p>
              Los datos personales son tratados por quien ofrece el servicio Quira (el &quot;responsable&quot; del
              tratamiento), en su condición de persona física, autónomo o entidad, según corresponda. La
              identificación completa del responsable (p. ej. nombre y apellidos o razón social, NIF y domicilio a
              efectos de notificaciones) y un <strong>correo electrónico de contacto</strong> deben estar
              disponibles para los interesados; si no figuran en esta pantalla, deben publicarse en la política de
              privacidad del sitio web del servicio o facilitarse por el canal de soporte que indiques.
            </p>
          )}
          {env.privacyContactEmail ? (
            <p>
              <strong>Contacto para privacidad y ejercicio de derechos (RGPD):</strong>{' '}
              <a href={`mailto:${encodeURIComponent(env.privacyContactEmail)}`}>{env.privacyContactEmail}</a>
            </p>
          ) : (
            <p>
              Para ejercer derechos de acceso, rectificación, supresión u otros previstos en el RGPD, utiliza el
              correo o formulario que el responsable publique en su sitio web o en la documentación del servicio.
            </p>
          )}
          <p>
            <strong>Política de privacidad (web):</strong>{' '}
            <a href={env.privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
              {env.privacyPolicyUrl.replace(/^https?:\/\//, '')}
            </a>
          </p>

          <h2>2. Datos que se tratan en y a través de la aplicación</h2>
          <p>Según cómo uses la app, pueden tratarse, entre otros:</p>
          <ul>
            <li>
              <strong>Identificación y cuenta:</strong> correo electrónico, nombre, contraseña (gestionada de
              forma segura en el servidor), roles (cliente / profesional), verificación de correo y teléfono.
            </li>
            <li>
              <strong>Perfiles:</strong> datos de perfil de cliente y/o profesional (teléfono, dirección o zona de
              servicio, radio de trabajo, biografía, habilidades, identificadores fiscales si los indicas, foto de
              perfil).
            </li>
            <li>
              <strong>Actividad del servicio:</strong> solicitudes de servicio, descripciones, presupuestos,
              categorías, mensajes o preguntas asociadas a solicitudes, propuestas (pujas), estados, valoraciones,
              historial de trabajos según lo que exponga la API.
            </li>
            <li>
              <strong>Contenido multimedia:</strong> fotos, audio y vídeo que adjuntes a solicitudes o perfil; se
              suben mediante URLs firmadas generadas por el backend (el destino final del fichero depende de la
              configuración del servidor: almacenamiento propio, nube, etc.).
            </li>
            <li>
              <strong>Ubicación:</strong> coordenadas o dirección cuando usas mapas, autocompletado de direcciones o
              geolocalización del dispositivo (solo si concedes permiso al sistema operativo).
            </li>
            <li>
              <strong>Suscripción y pagos:</strong> datos necesarios para gestionar suscripciones (p. ej. planes
              Solver/Pro); el cobro se canaliza a través de Stripe (ver apartado de terceros).
            </li>
            <li>
              <strong>Sesión en el dispositivo:</strong> la app puede guardar en el almacenamiento local del
              teléfono o navegador un token de sesión y una copia del objeto de usuario para mantener la sesión
              iniciada (p. ej. <code>quira_token</code> y datos de usuario en <code>localStorage</code> en la
              versión web embebida en Capacitor).
            </li>
            <li>
              <strong>Datos técnicos y de diagnóstico:</strong> si está configurado, el servicio de monitorización de
              errores (Sentry) puede recibir registros de fallos, rendimiento y metadatos del dispositivo o
              navegador.
            </li>
            <li>
              <strong>Analítica y medición de uso:</strong> de forma interna se utilizan <strong>Google Analytics</strong>{' '}
              y <strong>Firebase Analytics</strong> (Google) para entender el uso del servicio, audiencia y
              rendimiento; en la app, Firebase también puede aportar datos de analítica cuando el proyecto está
              configurado.
            </li>
            <li>
              <strong>Tratamientos en el servidor (API):</strong> el backend puede utilizar la{' '}
              <strong>API de Gemini</strong> (Google) para funciones de inteligencia artificial sobre textos o datos
              que envíes al servicio; y <strong>Twilio</strong> para el envío de notificaciones (p. ej. SMS u otros
              canales que Twilio ofrezca). Esos tratamientos se describen aquí a nivel informativo; el responsable
              debe formalizarlos en su política y contratos con encargados.
            </li>
          </ul>

          <h2>3. Finalidades</h2>
          <ul>
            <li>Prestar el servicio de intermediación entre clientes y profesionales.</li>
            <li>Gestionar el registro, la cuenta, la verificación de contacto y la seguridad del acceso.</li>
            <li>Mostrar mapas, direcciones y distancias cuando corresponda.</li>
            <li>Gestionar suscripciones de pago y cumplir obligaciones contables/fiscales que correspondan al responsable.</li>
            <li>Mejorar la estabilidad y seguridad de la aplicación (p. ej. informes de error con Sentry, si aplica).</li>
            <li>
              Medir y analizar el uso del servicio con <strong>Google Analytics</strong> y{' '}
              <strong>Firebase Analytics</strong> (métricas, eventos, rendimiento).
            </li>
            <li>
              Enviarte <strong>notificaciones</strong> (p. ej. por SMS u otros canales) a través de{' '}
              <strong>Twilio</strong>, según tu configuración y permisos.
            </li>
            <li>
              Ofrecer funciones asistidas por <strong>IA (Gemini)</strong> cuando el backend envíe datos a la API de
              Google, con la finalidad indicada en cada funcionalidad.
            </li>
          </ul>

          <h2>4. Base legal (orientación general)</h2>
          <p>
            La base legal concreta (ejecución de un contrato, interés legítimo, obligación legal, consentimiento)
            depende de cada tratamiento y debe concretarse en la política del responsable. En muchos despliegues, el
            registro y la prestación del servicio se basan en la relación contractual o precontractual; la analítica
            no esencial puede basarse en consentimiento, según configuración y normativa aplicable (especialmente en
            entornos web con cookies).
          </p>

          <h2>5. Encargados del tratamiento y proveedores tecnológicos</h2>
          <p>
            El servicio Quira utiliza, entre otros, los siguientes proveedores que pueden tratar datos personales en
            nombre del responsable (encargados de tratamiento o destinatarios, según el caso y los contratos
            aplicables):
          </p>
          <ul>
            <li>
              <strong>Servidor / API propia (backend Quira):</strong> almacenamiento principal de cuentas,
              solicitudes, perfiles y lógica de negocio; integración con los servicios siguientes. Comunicaciones
              cifradas (HTTPS).
            </li>
            <li>
              <strong>Stripe:</strong> <strong>pagos y suscripciones</strong> (planes Solver/Pro u otros). El cobro se
              gestiona en el checkout alojado por Stripe; los datos de tarjeta los trata Stripe bajo normas PCI.{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
                Privacidad de Stripe
              </a>
              .
            </li>
            <li>
              <strong>Twilio:</strong> <strong>notificaciones</strong> al usuario (p. ej. SMS u otros canales
              contratados para el servicio) cuando el backend envía avisos a través de Twilio.{' '}
              <a href="https://www.twilio.com/en-us/legal/privacy" target="_blank" rel="noopener noreferrer">
                Privacidad de Twilio
              </a>
              .
            </li>
            <li>
              <strong>Google — Gemini (API):</strong> el backend puede enviar contenidos a la{' '}
              <strong>API de Gemini</strong> para funciones de IA; Google trata esos datos según sus términos y la
              configuración del proyecto. Revisa la documentación de Google sobre IA y privacidad en{' '}
              <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">
                términos del API de Gemini
              </a>{' '}
              y la política general de Google.
            </li>
            <li>
              <strong>Google — Maps Platform:</strong> <strong>localizaciones y direcciones</strong> en la app:
              autocompletado (Places), geocodificación, mapas embebidos y enlaces a Google Maps. Datos tratados
              según Google Maps Platform y la configuración en Google Cloud.{' '}
              <a href="https://cloud.google.com/maps-platform/terms?hl=es" target="_blank" rel="noopener noreferrer">
                Términos de Google Maps Platform
              </a>
              {' · '}
              <a
                href="https://developers.google.com/maps/documentation/terms/maps-service-terms?hl=es"
                target="_blank"
                rel="noopener noreferrer"
              >
                Términos del servicio de Maps (API)
              </a>
              {' · '}
              <a href="https://support.google.com/maps/answer/1516777?hl=es" target="_blank" rel="noopener noreferrer">
                Privacidad y ubicación en Google Maps
              </a>
              .
            </li>
            <li>
              <strong>Google — Analytics (uso interno del responsable):</strong> <strong>Google Analytics</strong>{' '}
              para medición de tráfico, comportamiento y campañas en las propiedades web o el servicio configuradas
              por el responsable.{' '}
              <a
                href="https://support.google.com/analytics/answer/6004245?hl=es"
                target="_blank"
                rel="noopener noreferrer"
              >
                Protección de datos en Google Analytics
              </a>
              .
            </li>
            <li>
              <strong>Google — Firebase:</strong> en la aplicación móvil/web: <strong>Firebase Authentication</strong>{' '}
              (inicio de sesión con Google o Apple) y <strong>Firebase Analytics</strong> para eventos y uso de la
              app, además de la configuración estándar del proyecto Firebase.{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                Privacidad de Google
              </a>
              {' · '}
              <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
                Privacidad de Firebase
              </a>
              .
            </li>
            <li>
              <strong>Sentry</strong> (opcional en el cliente): si se configura el DSN, errores y trazas para
              depuración.{' '}
              <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer">
                Privacidad de Sentry
              </a>
              .
            </li>
            <li>
              <strong>Capacitor y plugins nativos:</strong> permisos del sistema (cámara, micrófono, geolocalización,
              almacenamiento) según el uso en la app; gestión en ajustes del dispositivo.
            </li>
          </ul>
          <p>
            <strong>Almacenamiento de archivos:</strong> las subidas de avatar y multimedia usan tickets y URLs
            firmadas proporcionadas por tu API; el proveedor de almacenamiento final (por ejemplo un bucket en la
            nube) es el que corresponda a la configuración del backend, no a esta lista fija en el código fuente.
          </p>

          <h2>6. Transferencias internacionales</h2>
          <p>
            Algunos proveedores anteriores pueden tratar datos en terceros países (por ejemplo Estados Unidos). En
            esos casos, el responsable suele basarse en decisiones de adecuación, cláusulas contractuales tipo
            (SCC) u otras garantías previstas en el art. 46 del RGPD, según documentación del proveedor y el
            análisis de cada caso.
          </p>

          <h2>7. Conservación</h2>
          <p>
            Los plazos de conservación dependen de la finalidad (prestación del servicio, obligaciones legales,
            reclamaciones). Deben detallarse en la política del responsable y en la configuración del backend
            (p. ej. borrado o anonimización tras un tiempo prudencial).
          </p>

          <h2>8. Tus derechos</h2>
          <p>
            Puedes ejercer los derechos de acceso, rectificación, supresión, limitación, portabilidad, oposición y,
            cuando el tratamiento se base en el consentimiento, retirarlo, según el RGPD. También puedes reclamar
            ante la autoridad de control (en España, la{' '}
            <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
              AEPD
            </a>
            ).
          </p>
          {env.privacyContactEmail ? (
            <p>
              Para iniciar una solicitud de ejercicio de derechos, puedes escribir a{' '}
              <a href={`mailto:${encodeURIComponent(env.privacyContactEmail)}`}>{env.privacyContactEmail}</a>
              {'. '}
              Indica de forma razonable qué derecho ejerces y tu identidad; el responsable puede pedirte información
              adicional para verificar que la solicitud es legítima.
            </p>
          ) : (
            <p>
              El responsable debe indicar en su sitio web o soporte un canal concreto para estas solicitudes
              (correo, formulario, etc.).
            </p>
          )}
          <p>
            Si la app no incluye aún un botón de &quot;exportar datos&quot; o &quot;eliminar cuenta&quot;, esas
            funciones pueden requerir desarrollo en backend y procedimientos internos; eso no sustituye la
            obligación de atender las solicitudes por otros medios razonables cuando el RGPD lo exija.
          </p>

          <h2>9. Menores de edad</h2>
          <p>
            El servicio debe configurarse según las reglas de uso que fije el responsable. Si no está permitido el
            registro de menores, debe indicarse claramente en los términos de uso y en la política de privacidad del
            responsable.
          </p>

          <h2>10. Actualizaciones</h2>
          <p>
            Esta información puede actualizarse cuando cambie la app o los proveedores integrados. La fecha de la
            última revisión puede mostrarse en la política publicada por el responsable.
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyLegal;
