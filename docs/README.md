# Documentación de Quira Mobile

## Contenido

- **[ARQUITECTURA.md](./ARQUITECTURA.md)** — Documentación funcional de la aplicación:
  - Tipos de usuario y tiers (CLIENTE, FREE, SOLVER, PRO)
  - Sesión, 401 y banner de cuota caducada (`DowngradeBanner`)
  - Ciclo de vida de las solicitudes
  - Propuestas (pujas): estados, quién puede pujar, orden
  - Preguntas (Request Questions)
  - Mercado y oportunidades
  - Suscripción y Stripe
  - Rutas, endpoints y estructuras de datos

- **[STRIPE_BACKEND.md](./STRIPE_BACKEND.md)** — Requisitos de backend para la integración con Stripe (checkout, webhooks, `paidThroughAt`).
- **[BACKEND_PREDICT_UPLOAD.md](./BACKEND_PREDICT_UPLOAD.md)** — Timeouts PHP/nginx, subidas lentas (`/predict` con vídeo) y timeout explícito en cliente (`PREDICT_REQUEST_TIMEOUT_MS`, 120–300 s).

## Privacidad y RGPD

- **URL oficial:** `https://quira.app/privacidad/index.html`.
- **Acceso desde la app:** menú **Perfil** → «Privacidad y datos (RGPD)», enlaces en **Login** y **Registro** (apertura externa en navegador).
- La política legal se mantiene en la landing web para tener una única fuente actualizada.

## Apps nativas (iOS y Android) — objetivo principal

Si lo que quieres son **dos aplicaciones** (una en **App Store** y otra en **Google Play**), el camino correcto **no** es subir “la app” a Cloudflare: **Cloudflare Pages solo publica la versión web** (HTML/JS en un dominio). Las apps de tienda son **binarios distintos** generados con **Capacitor** a partir del mismo código React/Vite.

| Qué quieres | Dónde se publica | Qué usar |
|-------------|------------------|----------|
| App **Android** | [Google Play Console](https://play.google.com/console) — subes un **AAB** (recomendado) o APK firmado | Proyecto `android/` tras `npm run build` + `npx cap sync android` + firma con tu keystore |
| App **iOS** | [App Store Connect](https://appstoreconnect.apple.com) — subes un **IPA** / archive firmado | Proyecto `ios/` tras `npm run build` + `npx cap sync ios` + certificados y perfil de aprovisionamiento de Apple |
| Sitio web opcional (landing, PWA, demo) | Cloudflare Pages u otro hosting estático | `npm run build` → carpeta `dist/` |

**Variables de entorno (`VITE_*`)**: se inyectan en **build time** cuando generas el bundle web que Capacitor copia al proyecto nativo. Configúralas en tu máquina (`.env`), en **GitHub Actions Variables** si usas los workflows de build, o en Xcode/Android Studio según cómo integres el paso de build; **no hace falta Cloudflare** para que las apps en tienda hablen con tu API.

**CI/CD relevante para tiendas** (ya en este repo):

- **Native build (manual)**: validar que **compila** Android (APK debug) e iOS (simulador, sin firma de distribución).
- **Native release (manual, signed)**: **Android** puede producir **AAB firmado** si configuras los Secrets del keystore; **iOS** sigue como plantilla hasta que añadas certificados/provisioning (Fastlane match, etc.).

La sección **Cloudflare Pages (web)** más abajo queda como **opcional**, solo si además quieres una URL web pública.

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

Nota: en el CI actual (web build + tests) **no hace falta** recrearlos salvo que añadas jobs de build nativo.

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
  - `CI / e2e`
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

## Cloudflare Pages (web)

**Solo aplica si quieres una versión web** (navegador). Para **solo** apps iOS/Android en tiendas, puedes **ignorar** esta sección.

La app es **Vite + React SPA**; el build estático sale en **`dist/`**. En Cloudflare no hace falta tocar el CI de GitHub **si** conectas el repositorio desde el panel de Pages y dejas que Cloudflare ejecute el build.

### Ajustes en el repo (ya hechos / recomendados)

- **`public/_redirects`**: fallback a `index.html` para rutas del cliente (recargas y enlaces directos). Vite copia `public/` a la raíz de `dist/`.
- **Build en Cloudflare**:
  - **Build command**: `npm run build` (o `npm ci && npm run build` si el entorno no instala deps antes; el asistente de Pages suele incluir `npm ci`).
  - **Build output directory**: `dist`
  - **Root directory**: raíz del repo (si no usas monorepo).
- **Node**: en Pages → Settings → Environment variables, fija **Node version** a **20** para alinear con GitHub Actions (opcional pero recomendable).

### Variables de entorno (Vite)

Las variables `VITE_*` se **inyectan en build time**. En Cloudflare Pages: **Settings → Environment variables** y repite los mismos nombres que en `.env.example` / GitHub **Variables** (p. ej. `VITE_API_URL`, Firebase web, `VITE_GOOGLE_MAPS_KEY`).

- **Production** y **Preview**: configura ambas si quieres previews de PR con API de staging; si no, las previews pueden fallar al llamar a la API por CORS o URLs incorrectas.

### Backend y CORS

La API debe permitir el origen del sitio en Cloudflare:

- Dominio de producción: `https://tu-dominio.com`
- Dominio por defecto de Pages: `https://<project>.pages.dev`
- **Previews** de PR: URLs tipo `https://<hash>.<project>.pages.dev` — si el navegador llama a la API, el backend debe aceptar esos `Origin` o usar una política acordada (a veces solo se habilita previews contra un API de staging con CORS amplio).

### Firebase (solo web)

En **Firebase Console → Authentication → Settings → Authorized domains** añade:

- Tu dominio de Cloudflare
- `*.pages.dev` si Firebase lo permite para previews, o el dominio concreto de preview que uses

### CI/CD: ¿hay que cambiar GitHub Actions?

| Enfoque | Qué hacer |
|--------|-----------|
| **Solo Cloudflare Pages conectado a Git** | No es obligatorio cambiar workflows: cada push puede desplegar en Cloudflare; GitHub sigue ejecutando **CI** (lint/test/build/e2e) en PRs y `main`. Mantén **las mismas variables** en GitHub (CI) y en Cloudflare (build del sitio). |
| **Despliegue solo desde GitHub Actions** | Añadir un job con `wrangler pages deploy` o `cloudflare/pages-action` y secretos `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` + nombre del proyecto. Entonces **desactiva** el build automático duplicado en el panel de Pages para no publicar dos veces. |

Recomendación práctica: **Pages conectado a Git** + mantener el CI actual en GitHub para calidad; sin duplicar deploy salvo que quieras un pipeline único en Actions.

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
- El timeout de **`POST /predict`** se documenta y fija en `src/config/httpTimeouts.ts`; su valor está cubierto en `src/config/httpTimeouts.test.ts`.
- El objetivo es priorizar tests **deterministas** y rápidos para reducir flakiness antes de publicar.
