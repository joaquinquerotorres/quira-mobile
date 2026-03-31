# Verificación de correo (enlace del registro)

El backend Symfony envía un correo con un enlace del tipo  
`{FRONTEND_URL}/verify-email?token=...` (p. ej. `https://quira.app/verify-email?token=...`).  
La verificación se resuelve en la web pública (`landing/verify-email`) para evitar dependencia de enlaces profundos del sistema operativo.

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

## Flujo web (`landing/verify-email`)

La página web de verificación:

- Lee `token` desde query string.
- Llama a `POST /verify/email` contra `https://api.quira.app/api` (endpoint fijo).
- Muestra resultado de éxito/error directamente en la web.

No intenta abrir la app automáticamente. El objetivo es que `https://quira.app` siga siendo landing pública y que la validación de correo ocurra siempre en web.

## Reenvío desde Perfil

En **Perfil → Datos personales**, si el email no está verificado, el botón **Reenviar verificación** llama a **`POST /verify/email/resend`** (implementado vía `resendVerificationEmail()`), no al endpoint de confirmación con email en el cuerpo.

## Tests

| Archivo | Qué cubre |
|---------|-----------|
| `src/api/verifyEmailApi.test.ts` | Rutas axios, `skipAuthHeader` / `skipAuthRedirect`, normalización de `{ success, message }`. |
| `src/utils/verifyEmailDeepLink.test.ts` | Parseo de `token` desde URLs de verificación. |
| `src/pages/VerifyEmail.test.tsx` | Estados sin token, éxito, `success: false`, errores HTTP, sesión + refresh. |
| `src/pages/VerifyEmailPending.test.tsx` | Reenvío con/sin JWT (toast vía `ion-toast`). |

Ejecutar solo estos tests:

```bash
npm run test -- --run src/api/verifyEmailApi.test.ts src/utils/verifyEmailDeepLink.test.ts src/pages/VerifyEmail.test.tsx src/pages/VerifyEmailPending.test.tsx
```
