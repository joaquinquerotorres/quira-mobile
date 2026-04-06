# Funcionalidades — referencia rápida

El contrato HTTP detallado (p. ej. login social) está en **[API.md](./API.md)**.

## Autenticación

- **Email y contraseña:** `POST /login_check` (ver ARQUITECTURA).
- **Verificación de email (enlace del registro):** flujo web en **`/verify-email?token=...`** (landing), confirmación con **`POST /verify/email`** sin JWT; reenvío con sesión en **`POST /verify/email/resend`**. Detalle y tests: **[VERIFY_EMAIL.md](./VERIFY_EMAIL.md)**.
- **Google y Apple (app nativa):** Firebase Auth en el dispositivo; luego **`POST /social/login`** con cuerpo JSON **`{ "token": "<id_token_firebase>", "provider": "GOOGLE" | "APPLE" }`**.  
  - El backend y la app usan el campo **`token`**, no `firebaseToken`.

### Errores genéricos con Google

Pueden deberse a:

1. Fallo **antes** de la API (SDK Firebase/Google en el cliente).
2. Fallo **después**, en la verificación del ID token en el servidor (mismo criterio que en API.md: Firebase vs backend, despliegue, etc.).

Ver **[API.md](./API.md)** — sección de diagnóstico.

### Mensajes en pantalla (Login vs resto)

- **Login:** errores de email/contraseña o Google/Apple con **`IonAlert`** (un solo aviso; el usuario pulsa «Entendido» para cerrar).
- **Resto de la app:** avisos breves con **`IonToast`**, duración **`TOAST_DURATION_MS`** (`src/config/uiTiming.ts`, p. ej. 6 segundos) para no ocultar el texto de inmediato.

## Otros

- Stripe / suscripción: **[STRIPE_BACKEND.md](./STRIPE_BACKEND.md)**.
- `/predict` y vídeo: **[BACKEND_PREDICT_UPLOAD.md](./BACKEND_PREDICT_UPLOAD.md)**.
- Solicitudes: rango de precio IA (`estimatedPriceMin` / `estimatedPriceMax`); contrato de **`POST /requests`** en **[API.md](./API.md)** y vistas en **[ARQUITECTURA.md](./ARQUITECTURA.md)** (NewRequest, listados, detalle). Para **publicar** hace falta **teléfono de cliente** en perfil y **`verifiedPhone`**; la app avisa en el paso 1, bloquea `POST /predict` si aún no aplica y persiste un borrador al ir a Perfil (detalle en ARQUITECTURA, **NewRequest** y **Verificación para crear solicitudes**).
