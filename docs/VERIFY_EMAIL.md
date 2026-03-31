# Verificación de correo (enlace del registro)

El backend Symfony envía un correo con un enlace del tipo  
`{FRONTEND_URL}/verify-email?token=...` (p. ej. `https://quira.app/verify-email?token=...`).  
La app móvil debe poder abrir esa ruta y confirmar el token con la API.

## Rutas en la app

| Ruta | Uso |
|------|-----|
| `/verify-email?token=...` | Confirma el email llamando a la API **sin JWT**. Muestra éxito o el `message` de error (token caducado, etc.). |
| `/verify-email-pending` | Pantalla opcional: texto de ayuda + **Reenviar correo** (requiere sesión con JWT). |

Tras verificar con éxito: si hay **`quira_token`** en `localStorage`, se llama a **`refreshCurrentUserInStorage()`** (GET `/users/:id`) y el botón principal lleva a **`/request-list`**; si no hay sesión, a **`/login`**.

## API (contrato HTTP)

Base URL del cliente: **`VITE_API_URL`** (debe terminar en **`/api`**, p. ej. `https://api.quira.app/api`).

| Endpoint | Auth | Cuerpo / query | Respuesta esperada |
|----------|------|----------------|-------------------|
| `POST /verify/email` | Ninguna (`skipAuthHeader: true`) | JSON `{"token":"<mismo string que en el mail>"}` | `{ "success": boolean, "message": string }` |
| `GET /verify/email?token=...` | Ninguna | Equivalente en backend (la app usa solo POST por defecto). | Mismo JSON |
| `POST /verify/email/resend` | `Authorization: Bearer <JWT>` | `{}` | `{ "success": boolean, "message": string }` |

Código cliente: `src/api/verifyEmailApi.ts` (`confirmEmailWithToken`, `resendVerificationEmail`).

## Enlaces profundos (App Links / Universal Links)

En **nativo**, el plugin `@capacitor/app` recibe la URL al abrir el enlace desde el sistema:

- **`appUrlOpen`**: app ya en segundo plano o vuelve al foreground con la URL.
- **`getLaunchUrl`**: arranque en frío con URL (cuando el SO la entrega).

El componente `src/components/DeepLinkHandler.tsx` escucha esos eventos y hace **`history.replace('/verify-email?token=...')`** si la ruta es `/verify-email` y hay `token`.

La extracción de `token` desde la URL está en `src/utils/verifyEmailDeepLink.ts` (`parseVerifyEmailTokenFromUrl`), probada para URLs `https` (`quira.app`, `www.quira.app`, `localhost`) y también para el esquema nativo `com.quira.app://verify-email?...`.

### Puente web cuando el SO abre navegador

Si por configuración de App Links / Universal Links el enlace se abre en navegador, la web pública sirve `landing/verify-email/index.html`, que redirige a `com.quira.app://verify-email?token=...` para abrir la app y continuar la verificación allí.

### Android

En `android/app/src/main/AndroidManifest.xml` hay intent-filters con **`android:autoVerify="true"`** para:

- `https://quira.app` + `pathPrefix=/verify-email`
- `https://www.quira.app` + `pathPrefix=/verify-email`

Para que **autoVerify** funcione, el dominio debe servir **`/.well-known/assetlinks.json`** con los datos de la app firmada (`com.quira.app`). Sin ese fichero, el enlace puede abrirse en el navegador en lugar de la app.

### iOS

- `ios/App/App/App.entitlements`: **Associated Domains** `applinks:quira.app` y `applinks:www.quira.app`.
- En el servidor: **`apple-app-site-association`** en el dominio (sin extensión, HTTPS).
- En [Apple Developer](https://developer.apple.com): capacidad **Associated Domains** activada para el identificador de la app.

## Reenvío desde Perfil

En **Perfil → Datos personales**, si el email no está verificado, el botón **Reenviar verificación** llama a **`POST /verify/email/resend`** (implementado vía `resendVerificationEmail()`), no al endpoint de confirmación con email en el cuerpo.

## Tests

| Archivo | Qué cubre |
|---------|-----------|
| `src/api/verifyEmailApi.test.ts` | Rutas axios, `skipAuthHeader` / `skipAuthRedirect`, normalización de `{ success, message }`. |
| `src/utils/verifyEmailDeepLink.test.ts` | Parseo de `token` desde URLs de verificación. |
| `src/pages/VerifyEmail.test.tsx` | Estados sin token, éxito, `success: false`, errores HTTP, sesión + refresh. |
| `src/pages/VerifyEmailPending.test.tsx` | Reenvío con/sin JWT (toast vía `ion-toast`). |
| `src/components/DeepLinkHandler.test.tsx` | Listeners en nativo, `appUrlOpen`, `getLaunchUrl`. |

Ejecutar solo estos tests:

```bash
npm run test -- --run src/api/verifyEmailApi.test.ts src/utils/verifyEmailDeepLink.test.ts src/pages/VerifyEmail.test.tsx src/pages/VerifyEmailPending.test.tsx src/components/DeepLinkHandler.test.tsx
```
