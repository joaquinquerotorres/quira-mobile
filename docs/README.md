# Documentación de Quira Mobile

## Contenido

- **[GUIA_PRODUCTO.md](./GUIA_PRODUCTO.md)** — Guía de producto para **marketing / product managers** (flujos, planes, precio, privacidad, mensajes; sin detalle técnico).
- **[ARQUITECTURA.md](./ARQUITECTURA.md)** — Documentación funcional de la aplicación:
  - Tipos de usuario y tiers (CLIENTE, FREE, SOLVER, PRO)
  - Sesión, 401, cliente HTTP (`skipAuthHeader` / `skipAuthRedirect`, mensajes de error del API) y banner de cuota caducada (`DowngradeBanner`: rutas de login, `localStorage` por usuario)
  - Ciclo de vida de las solicitudes
  - Propuestas (pujas): estados, quién puede pujar, orden
  - Preguntas (Request Questions)
  - Mercado y oportunidades
  - Suscripción y Stripe
  - Rutas, endpoints y estructuras de datos (incluye **`clientOriginalDescription`**: texto del cliente en modo texto + imagen, frente a **`description`** = valoración IA; **`estimatedPriceMin` / `estimatedPriceMax`**: rango en céntimos de la estimación IA, y el front convierte a euros para mostrar, sin `priceAmount`)

- **[API.md](./API.md)** — `POST /social/login`: cuerpo con **`token`** + **`provider`** (no `firebaseToken`); diagnóstico si falla Google antes o después de la API.
- **[VERIFY_EMAIL.md](./VERIFY_EMAIL.md)** — Verificación de email tras el registro: flujo web en `landing/verify-email`, API sin JWT y reenvío con JWT.
- **[FEATURES.md](./FEATURES.md)** — Referencia rápida de auth y enlaces a API / otros docs.
- **[STRIPE_BACKEND.md](./STRIPE_BACKEND.md)** — Requisitos de backend para la integración con Stripe (checkout, webhooks, `paidThroughAt`).
- **[BACKEND_PREDICT_UPLOAD.md](./BACKEND_PREDICT_UPLOAD.md)** — Flujo híbrido (ticket Supabase → `/predict` por URL → `PredictTask` / polling), timeouts (`PREDICT_REQUEST_TIMEOUT_MS`, `PREDICT_POLL_*`) y **compresión opcional** antes del PUT (`videoCompressForPredict.ts`).
- **Feedback en UI:** `src/config/uiTiming.ts` (`TOAST_DURATION_MS`) para toasts legibles; errores en **Login** con `IonAlert` (ver `FEATURES.md`).

## Privacidad y RGPD

- **URL oficial:** `https://quira.app/privacidad/index.html`.
- **Acceso desde la app:** menú **Perfil** → «Privacidad y datos (RGPD)», enlaces en **Login** y **Registro** (se abre la URL en el navegador del sistema).
- La política legal y el sitio público de marketing viven en la carpeta **`landing/`** del repo (p. ej. `quira.app`), no en el bundle que corre dentro de la app.

## Apps nativas (iOS y Android) — producto

El producto son **las apps en tienda** (Android e iOS). El código React/Vite genera **`dist/`**, que **Capacitor incrusta en el WebView** de cada app: ese bundle **no** está pensado como sitio web para usuarios finales. La única web pública del proyecto es lo que despliegues desde **`landing/`** (estático).

| Qué quieres | Dónde se publica | Qué usar |
|-------------|------------------|----------|
| App **Android** | [Google Play Console](https://play.google.com/console) — subes un **AAB** (recomendado) o APK firmado | Proyecto `android/` tras `npm run build` + `npx cap sync android` + firma con tu keystore |
| App **iOS** | [App Store Connect](https://appstoreconnect.apple.com) — subes un **IPA** / archive firmado | Proyecto `ios/` tras `npm run build` + `npx cap sync ios` + certificados y perfil de aprovisionamiento de Apple |
| **Sitio público** (marketing, privacidad, legales) | **Cloudflare Pages** sirve la carpeta **`landing/`** (p. ej. `quira.app` + `/privacidad`) | Output de deploy = **`landing/`**; no es el bundle **`dist/`** de la app |

**Variables de entorno (`VITE_*`)**: se inyectan en **build time** al ejecutar `npm run build`; el resultado en **`dist/`** lo empaqueta Capacitor dentro del binario nativo. Configúralas en `.env`, en **GitHub Actions Variables** para CI, o donde integres el paso de build; **no hace falta** publicar `dist/` en internet para que las apps hablen con tu API.

**CI/CD relevante para tiendas** (ya en este repo):

- **Native build (manual)**: validar que **compila** Android (APK debug) e iOS (simulador, sin firma de distribución).
- **Native release (manual, signed)**: **Android** puede producir **AAB firmado** si configuras los Secrets del keystore; **iOS** sigue como plantilla hasta que añadas certificados/provisioning (Fastlane match, etc.).

El despliegue de la **web pública** (`landing/` en Cloudflare Pages) se describe más abajo. Eso **no sustituye** las apps en tienda. Publicar el bundle **`dist/`** en una URL es **otro asunto** (solo tendría sentido para previews o demos internas, no para la web de producto).

## Variables de entorno

Copia `.env.example` a `.env` y configura:

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API (ej. `https://api.quira.app/api`) |
| `VITE_GOOGLE_MAPS_KEY` | Clave de Google Maps para autocompletado (opcional) |
| `VITE_SENTRY_DSN` | DSN del proyecto Sentry (opcional). Si está vacío, Sentry no se inicializa. |

### Sentry (errores en la app)

La app integra **`@sentry/capacitor`** + **`@sentry/react`**: captura errores de JavaScript/React, el `ErrorBoundary` envía excepciones con stack de componentes, y el bridge puede reportar **crashes nativos** (iOS/Android) según la [documentación de Sentry para Capacitor](https://docs.sentry.io/platforms/javascript/guides/capacitor/).

1. Crea un proyecto en [sentry.io](https://sentry.io) y copia el **DSN** a `VITE_SENTRY_DSN` en `.env` (y en variables de CI si generáis builds con Sentry activo).
2. Tras instalar o actualizar dependencias Sentry, ejecuta **`npx cap sync`** para alinear proyectos nativos.
3. **Versiones**: `@sentry/capacitor` exige la misma versión menor de `@sentry/react` que indica su `package.json` (p. ej. `10.43.0`). No subir `@sentry/react` por encima sin comprobar compatibilidad.
4. (Opcional) Subir **source maps** en release para stacks legibles: `npx @sentry/wizard@latest -i sourcemaps`.

## Firebase (Android/iOS) — ficheros locales (NO subir al repo)

Los ficheros nativos de Firebase **no deben commitearse** (están en `.gitignore`):

- Android: `android/app/google-services.json`
- iOS: `ios/App/App/GoogleService-Info.plist`

En el repo dejamos **plantillas** sin datos sensibles:

- Android: `android/app/google-services.json.example`
- iOS: `ios/App/App/GoogleService-Info.plist.example`

### Configuración en local

1. Copia las plantillas a los nombres reales:
   - `cp android/app/google-services.json.example android/app/google-services.json`
   - `cp ios/App/App/GoogleService-Info.plist.example ios/App/App/GoogleService-Info.plist`
2. Sustituye los valores `REPLACE_ME_*` por los de tu proyecto Firebase (desde Firebase Console).

### Google Sign-In en la app Android

Requisitos del plugin **`@capacitor-firebase/authentication`** (ver [setup Google](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/setup-google.md)):

1. En **`android/variables.gradle`**: `rgcfaIncludeGoogle = true` y `androidxCredentialsVersion = '1.3.0'` (sin esto las dependencias de Google pueden quedar solo como `compileOnly` y el login falla de formas opacas).
2. En **Firebase Console → Configuración del proyecto**, añade la **huella SHA-1** (y SHA-256 si aplica) del keystore con el que firmas el APK/AAB (debug y release). Descarga de nuevo `google-services.json` si hace falta.
3. **Authentication → Método de inicio de sesión**: **Google** activado.
4. En código, en Android se llama a `signInWithGoogle({ useCredentialManager: false })` para usar el selector de cuenta clásico; el **Credential Manager** por defecto a menudo devuelve *No credentials available* si no hay credenciales guardadas para ese flujo.

### Google Sign-In en la app iOS

Con **`@capacitor-firebase/authentication`** y el **Swift Package** generado por Capacitor (`ios/App/CapApp-SPM/Package.swift`), el plugin ya incluye **GoogleSignIn** en iOS; no hace falta añadir el subspec CocoaPods `CapacitorFirebaseAuthentication/Google` salvo que migres a Pods.

Requisitos para que el flujo funcione de extremo a extremo:

1. **`GoogleService-Info.plist`** en `ios/App/App/` con `CLIENT_ID` y **`REVERSED_CLIENT_ID`** del cliente iOS de Firebase (como en la sección de configuración local).
2. **`Info.plist` → URL Types (`CFBundleURLTypes`)**: debe existir un esquema cuyo valor sea exactamente el **`REVERSED_CLIENT_ID`** del plist de Firebase. Sin esto, tras el flujo de Google (Safari / vista del sistema), la app no recibe el redirect y el login falla de forma silenciosa o con error genérico.
3. **Firebase Console → Authentication**: proveedor **Google** activado; en la app iOS registrada, el **Bundle ID** coincide con el de Xcode (`com.quira.app` en este proyecto).
4. **`AppDelegate`**: mantener `application(_:open:options:)` delegando en `ApplicationDelegateProxy.shared` (ya está en la plantilla Capacitor); eso enruta la URL de vuelta al plugin.

En TypeScript, en iOS basta con `FirebaseAuthentication.signInWithGoogle()` sin opciones; `useCredentialManager` solo aplica en Android.

### Configuración en CI (GitHub Actions)

Recomendado: guardar los ficheros reales como **Secrets** en base64 y recrearlos en el runner.

1. En GitHub: `Settings → Secrets and variables → Actions → Secrets`
   - `ANDROID_GOOGLE_SERVICES_JSON_BASE64`
   - `IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64`
2. En CI, antes de compilar Android/iOS, decodifica:

```bash
echo "$ANDROID_GOOGLE_SERVICES_JSON_BASE64" | base64 --decode > android/app/google-services.json
echo "$IOS_GOOGLE_SERVICE_INFO_PLIST_BASE64" | base64 --decode > ios/App/App/GoogleService-Info.plist
```

Nota: en el CI actual (build de `dist/` para tests y calidad) **no hace falta** recrearlos salvo que añadas jobs de build nativo.

## Builds nativos (Android/iOS) en CI bajo demanda

Hay un workflow manual para generar builds nativos sin ejecutarlos en cada PR:

- GitHub Actions: **Native build (manual)**
- Entrada: `platform = android | ios | both`

Este workflow:
- genera `.env` en el runner desde `vars.*`
- restaura opcionalmente los configs nativos de Firebase desde Secrets base64
- construye:
  - Android: `assembleDebug` y sube el APK como artifact
  - iOS: build de **simulador** sin signing (útil para validar que compila)

## CI/CD (GitHub Actions) — checklist y configuración “release-ready”

### Branch protection (GitHub UI)

Recomendado para `main`:

- Requerir Pull Request para merge
- Requerir approvals (mínimo 1)
- Requerir status checks antes de merge:
  - `CI / lint`
  - `CI / unit`
  - `CI / build`
- (Opcional) Workflow manual **Quality gate** con Cypress completo; el CI por defecto en `.github/workflows/ci.yml` no ejecuta e2e en cada PR.
- Bloquear force-push (salvo admins) y restringir quién puede push

### Dependabot

El repo incluye `.github/dependabot.yml` para abrir PRs semanales de:
- dependencias `npm`
- workflows de GitHub Actions

### Quality gate manual

Workflow manual: **Quality gate (manual)**.

- Ejecuta lint + unit + build y, opcionalmente, Cypress completo (no solo smoke).
- Úsalo justo antes de subir a stores o generar un release.

### Release nativo firmado (Android/iOS)

Workflow manual: **Native release (manual, signed)**.

#### Android (AAB firmado)

Secrets necesarios (GitHub → Settings → Secrets and variables → Actions → Secrets):
- `ANDROID_KEYSTORE_BASE64` (keystore en base64)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Opcional si usas Firebase en Android:
- `ANDROID_GOOGLE_SERVICES_JSON_BASE64`

El workflow genera un `.aab` en `android/app/build/outputs/bundle/release/` y lo sube como artifact.

#### iOS (IPA firmado)

El job de iOS está dejado como **plantilla** (para evitar builds falsamente “verdes” sin signing).
Para habilitarlo necesitas aportar certificados y provisioning profiles (recomendado: Fastlane match).

## Web pública: `landing/` en Cloudflare Pages

La **única web** del producto es el sitio estático de la carpeta **`landing/`**: portada (`index.html`), **privacidad** (`privacidad/`, p. ej. `https://quira.app/privacidad/…`) y el resto de páginas legales o de marketing que vivan ahí. Eso es lo que está (y debe estar) publicado en **Cloudflare Pages** con el dominio público (p. ej. `quira.app`). **No** uses el bundle **`dist/`** de la app Capacitor como sustituto de esta web.

### Configuración típica en Cloudflare Pages (solo `landing/`)

- **Root directory** del proyecto en Pages: raíz del repositorio (o la carpeta que uses en tu pipeline).
- **Build command**: suele poder dejarse **vacío** o ser un no-op si publicas HTML estático tal cual; si el asistente exige comando, algo como `exit 0` puede bastar según cómo definas el directorio de salida.
- **Build output directory**: **`landing`** (Cloudflare sirve el contenido de esa carpeta: es el sitio web real).

Ajusta nombres exactos según tu proyecto en el panel de Cloudflare; lo importante es que **el origen del sitio público sea `landing/`**, no `dist/`.

### Backend y CORS (landing)

Si **`landing/`** hace peticiones `fetch` / XHR a tu API, el backend debe permitir en CORS el origen de producción (p. ej. `https://quira.app`) y el de previews de Pages si los usas (`*.pages.dev` o el host concreto).

### CI/CD y GitHub Actions

| Enfoque | Qué hacer |
|--------|-----------|
| **Cloudflare Pages conectado al repo** | Cada push puede desplegar la **landing**; GitHub sigue ejecutando **CI** (lint/test/build/e2e) en PRs y `main`. No confundir el build de **`dist/`** en CI (para tests y empaquetado nativo) con el despliegue web. |
| **Despliegue de Pages solo desde Actions** | Job con `wrangler pages deploy landing` (o equivalente) y secretos `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, nombre del proyecto; evita despliegues duplicados si también tienes build automático en el panel. |

Recomendación práctica: **Pages para `landing/`** + CI en GitHub para calidad del monorepo (app + landing en el mismo repo).

---

## Publicar el bundle `dist/` en una URL (no es la web del producto)

Solo relevante si en algún momento quisieras una **demo o preview** de la misma SPA que va dentro del WebView de Capacitor. **Quira** no define la web pública así: la web pública es **`landing/`**, arriba.

- El proyecto app es **Vite + React**; `npm run build` genera **`dist/`**.
- **`public/_redirects`**: fallback a `index.html` para rutas del cliente en ese bundle; Vite copia `public/` a la raíz de `dist/` (sirve si despliegas `dist/`, no para la landing estática).
- **Variables `VITE_*`**: solo aplican al **build de la app** (`npm run build` para Capacitor o para un despliegue puntual de `dist/`).

### Firebase Auth: dominios autorizados (solo si publicas `dist/` con login Firebase en navegador)

Si desplegaras la SPA de **`dist/`** en un origen HTTPS y usaras Auth orientado a navegador ahí, en **Firebase Console → Authentication → Authorized domains** habría que añadir ese dominio. Para **apps nativas** + **`landing/`** estática, la configuración habitual en Firebase son los clientes **iOS/Android**; la landing no sustituye a la app.

## Tests (recomendado antes de release)

### Unit / Integration (Vitest)

- Ejecutar toda la suite:
  - `npm test`
- Modo watch (desarrollo):
  - `npm run test.unit`

### End-to-end (Cypress)

- Ejecutar en CI (headless):
  - `npm run test.e2e`
- Abrir UI de Cypress:
  - `npm run cy:open`

### Notas de estabilidad en tests

- Algunos tests **stubbean componentes de Ionic** (p. ej. `IonAlert`, wrappers sin `IonApp`) para evitar timers internos que pueden producir errores al teardown en `jsdom`.
- Plugins de **Capacitor** (`@capacitor/network`, micrófono, etc.) suelen **mockearse** en tests de páginas; la lógica de red para avisos en vídeo está cubierta en `src/utils/videoUploadNetworkHint.test.ts`.
- Criterios de **compresión de vídeo** antes del PUT a Supabase (red + umbral Wi-Fi, límites por plataforma) y `predictVideoPayloadDecodedBytes`: `src/utils/videoCompressForPredict.test.ts`.
- Flujo híbrido **`/predict` por URL** + polling: `src/services/predictService.test.ts`; timeouts en `src/config/httpTimeouts.ts` / `httpTimeouts.test.ts`.
- **Duración de toasts:** `TOAST_DURATION_MS` en `src/config/uiTiming.ts`; test en `src/config/uiTiming.test.ts`.
- **Errores HTTP** para mensajes al usuario: `getBackendErrorMessage` / `axiosErrorUserHint` en `src/api/axiosErrorDebug.ts`; tests en `src/api/axiosErrorDebug.test.ts`.
- **`DowngradeBanner`**: montar con **`MemoryRouter`** y ruta inicial si se prueba visibilidad por path (`/login` vs `/profile`); ver `src/components/DowngradeBanner.test.tsx`.
- **Login:** `src/pages/Login.test.tsx` comprueba errores de API vía **`IonAlert`** (`alertdialog`, botón «Entendido»), coherente con la UI real.
- Si un test redefine `vi.mock('@ionic/react', importOriginal => …)`, debe seguir sustituyendo **`IonApp`** por un stub ligero (p. ej. `Fragment`), no el componente real: de lo contrario `ion-app` programa timers que pueden ejecutarse tras el teardown de jsdom y Vitest reporta rechazos no gestionados (`window` / `document` is not defined). Opcionalmente reutiliza los mismos stubs que `src/setupTests.ts` (`IonRouterOutlet`, `IonTabs`, …).
- El objetivo es priorizar tests **deterministas** y rápidos para reducir flakiness antes de publicar.
