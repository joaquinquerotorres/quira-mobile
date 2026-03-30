# Quira Mobile — Documentación de la aplicación

Documento que describe la arquitectura funcional de la app: tipos de usuario, ciclo de vida de solicitudes, propuestas (pujas), preguntas, mercado y suscripciones.

---

## 1. Tipos de usuario y tiers de profesionales

### Roles y tiers efectivos

| Tier | Rol backend | Precio | Características |
|------|-------------|--------|-----------------|
| **CLIENTE** | Solo `clientProfile` | — | Crear solicitudes, aceptar propuestas, valorar. Sin perfil profesional. |
| **FREE (Starter)** | `ROLE_FREE` o `professionalProfile` sin pago | Gratis | 3 propuestas/mes, acceso a LOW y MED Risk, alertas por email |
| **SOLVER** | `ROLE_SOLVER` + `paidThroughAt` activo | 4,99€/mes | Propuestas ilimitadas, LOW y MED Risk, alertas push en tiempo real |
| **PRO** | `ROLE_PRO` + `paidThroughAt` activo | 11,99€/mes | Todo lo de Solver + HIGH Risk, prioridad en listados, alertas push en tiempo real |

### Lógica de tier efectivo (`effectiveTier.ts`)

- **Suscripción de pago activa** solo si hay una fecha `paidThroughAt` resuelta y es **estrictamente futura** (`> now`, ISO 8601). Misma regla que el backend para límites, HIGH y visitas.
- **Resolución de fecha**: primero `professionalProfile.paidThroughAt` si viene informado; si no, `user.paidThroughAt`.
- **`paidThroughAt === null`**, ausente o cadena vacía → **sin ventana de pago conocida**: quien tenga `ROLE_PRO` o `ROLE_SOLVER` se trata como **FREE** en la UI (no se asume Pro de pago “por rol” solo).
- Fecha **vencida** con rol PRO/SOLVER → **FREE** en la UI.
- `isDowngradedDueToExpiredPayment()`: rol PRO o SOLVER **sin** suscripción activa según lo anterior (incluye `null` y caducidad). Alimenta el banner global y avisos de renovación en perfil.

### Downgrade por caducidad

- El componente global `DowngradeBanner` muestra la alerta **Cuota no renovada** cuando `isDowngradedDueToExpiredPayment(user)` es verdadero **y** hay sesión activa: deben existir `quira_token` y `user` en `localStorage`.
- **No se muestra** en rutas de credenciales: `/login`, `/register`, `/forgot-password`, `/verify-email`, `/reset-password` (aunque quede una sesión guardada al abrir la app en la pantalla de login).
- Tras cerrar el aviso, la marca **“ya visto”** se guarda en **`localStorage` por usuario** (`quira_downgrade_banner_dismissed_<id>`), para que **sobreviva al cierre de la app** (en WebView nativo `sessionStorage` suele borrarse al matar el proceso y antes reabría el modal sin cesar).
- **Migración**: si existía el flag antiguo solo en `sessionStorage`, se copia al formato por usuario y se limpia el antiguo.
- `clearStoredAuthAndRedirectToLogin()` y el cierre de sesión en Perfil también limpian las claves de “aviso cerrado” (vía `clearDowngradeBannerDismissKeys()` o `localStorage.clear()` en logout).
- En Profile aparece aviso de plan caducado si la fecha está en el pasado **o** si hay rol PRO/SOLVER sin suscripción activa (`paidThroughAt` null o no futuro).
- Los pros degradados siguen viendo sus trabajos en curso, pero con límites en nuevas propuestas.

### Cliente HTTP y cierre de sesión por 401

- El interceptor de `src/api/axios.ts` ante respuesta **401** (salvo `skipAuthRedirect` en la petición) llama a `clearStoredAuthAndRedirectToLogin()` (`src/api/authSession.ts`): elimina **`quira_token`** y **`user`**, limpia claves del banner de downgrade y asigna `window.location.href = '/login'`.
- Las peticiones pueden enviar **`Authorization: Bearer <token>`** salvo que la config lleve **`skipAuthHeader: true`**. En **`POST /social/login`** (Google/Apple) se usa **`skipAuthHeader` + `skipAuthRedirect`**: no se envía el JWT viejo junto al ID token de Firebase (evita 401/conflictos al verificar) y un 401 de credenciales sociales rechazadas **no** dispara el cierre de sesión automático.
- Tras `signInWithGoogle` / `signInWithApple`, el ID token para el backend se resuelve en **`resolveSocialIdToken()`** (`src/pages/Login.tsx`): primero **`credential.idToken`** si el plugin lo devuelve; si no, **`getIdToken({ forceRefresh: false })`** y, en último caso, **`getIdToken({ forceRefresh: true })`**. Los errores de Axios con cuerpo JSON (p. ej. `detail`, `hydra:description`) se muestran vía `getBackendErrorMessage()` en `src/api/axiosErrorDebug.ts`.
- En la pantalla de **login**, los fallos de credenciales o login social se muestran con **`IonAlert`** (un solo canal, el usuario cierra con «Entendido»); no se duplica con toast. En el resto de pantallas, **`IonToast`** usa la duración **`TOAST_DURATION_MS`** (`src/config/uiTiming.ts`, p. ej. 6 s) para poder leer el mensaje.
- Objetivo: mantener `localStorage` coherente con “no hay sesión” y evitar modales o UI que lean `user` sin token válido.

### Verificación para crear solicitudes o pujar

- Para **crear solicitudes**: hace falta `clientProfile` con `phoneNumber` y `verifiedPhone === true`.
- Para **pujar como profesional**: hace falta `professionalProfile` con `phoneNumber` y `verifiedPhone === true` (el backend valida además límites y tier).
- `getVerificationStatus()` en `hooks/useUserVerification.ts` devuelve:
  - **Cliente**: `hasClientPhone`, `verifiedClientPhone`, `canCreateRequest`.
  - **Profesional**: `hasProPhone`, `verifiedProPhone`, `canBid`.
- En `NewRequest`: si `!canCreateRequest`, pantalla de bloqueo hasta verificar el teléfono del cliente.
- En **Mercado** / **ProRequestDetail**: si `!canBid`, se redirige o avisa para completar/verificar el teléfono profesional en perfil.

---

## 2. Ciclo de vida de las solicitudes (Requests)

### Estados posibles

| Estado | Etiqueta | Descripción |
|--------|----------|-------------|
| `PENDING` | Pendiente | Sin profesional asignado, acepta propuestas |
| `PENDING_APPROVAL` | En revisión | En validación |
| `ACCEPTED` | Asignado | Profesional contratado, trabajo en curso |
| `COMPLETED` | Finalizado | Trabajo completado |
| `CANCELLED` | Cancelada | Cancelada por el cliente |

### Transiciones

- **Cliente cancela**: Solo si `status === 'PENDING'` y no hay `assignedProfessional`. Se hace `PATCH /requests/{id}` con `status: 'CANCELLED'`.
- **Cliente acepta propuesta**: `PATCH /requests/{id}` con `status: 'ACCEPTED'`, `assignedProfessional` y `preciseAddress`; además `PATCH /bids/{id}/accept`.
- **Pro finaliza trabajo**: `PATCH /requests/{id}` con `status: 'COMPLETED'`.
- **Creación**: Al publicar, la solicitud empieza en `PENDING`.

---

## 3. Propuestas (Pujas / Bids)

### Estados de una propuesta

| Estado | Significado |
|--------|-------------|
| `PENDING` | Activa, visible para el cliente |
| `ACCEPTED` | Propuesta aceptada (trabajo ganado) |
| `REJECTED` | Retirada por el profesional |

### Flujo de propuestas

- **Crear**: `POST /bids` con `request` (IRI), `priceQuote`, `comment`, `status: 'PENDING'`.
- **Retirar**: `PATCH /bids/{id}` con `status: 'REJECTED'` (solo si la request está PENDING y la propuesta PENDING).
- **Aceptar**: `PATCH /bids/{id}/accept` cuando el cliente confirma la contratación.

### Quién puede hacer propuestas

- **FREE**: Máximo 3 propuestas al mes. Límite consultado vía `GET /professionals/me/can-bid` (`canBidThisMonth`). El conteo mensual en backend **no debe incluir** propuestas retiradas (`Bid.status === 'REJECTED'`); solo cuentan propuestas activas (p. ej. `PENDING` y, si aplica, `ACCEPTED`).
- **SOLVER**: Propuestas ilimitadas en LOW y MED Risk.
- **PRO**: Propuestas ilimitadas, incluido HIGH Risk.

### Restricciones por riesgo (Risk Level)

| Tier | LOW / MED Risk (baja / media dificultad) | HIGH Risk (alta dificultad) |
|------|----------------|-----------|
| FREE | Ve mercado, puja (con límite mensual) | No ve detalles (blur), no puede pujar |
| SOLVER | Ve todo, puja | Ve detalles, pero no puede pujar |
| PRO | Ve todo, puja | Ve todo, puja |

### Orden de las propuestas (vista cliente)

1. Por tier: PRO > SOLVER > FREE.
2. Dentro de cada tier: por precio ascendente.
3. Desempate: por rating descendente.

Las propuestas con estado `REJECTED` no se muestran al cliente.

En la lista de ofertas (RequestDetail) y en el bloque de profesional asignado se muestran `rating` y `reviewCount` del profesional (campos que vienen del backend en `ProfessionalProfile` / en el objeto del bid).

### Visitas de valoración

Un profesional puede **solicitar una visita** para valorar el trabajo en persona antes de dar un presupuesto final.

- **Solicitar visita** (trabajos **HIGH**): en la app el CTA solo aparece con **tier efectivo PRO** (rol PRO **y** suscripción activa según `paidThroughAt`). El API puede rechazar con 403/422 si no hay pago vigente; el front muestra el mensaje del servidor.
- **Endpoint**: `POST /requests/{id}/visit-request`. El botón solo se muestra si aún no hay solicitud de visita (flujos según estado en UI).
- **Cliente acepta**: `POST /visit-requests/{id}/accept`. Tras aceptar, el PRO ve teléfono del cliente y dirección precisa; el cliente ve botón "LLAMAR AL PROFESIONAL" con el teléfono del PRO (`professionalPhone` en la visita aceptada).
- **Cliente rechaza**: `POST /visit-requests/{id}/reject`.

El detalle de la solicitud (`GET /requests/{id}`) incluye `visitRequests[]`. Cada elemento tiene `id`, `status` (`PENDING` | `ACCEPTED` | `REJECTED`), `professional` (datos del pro) y, solo cuando `status === 'ACCEPTED'`, `professionalPhone`.

---

## 4. Preguntas (Request Questions)

### Flujo

- **Pro hace pregunta**: `POST /request_questions` con `request` (IRI) y `questionText`.
- **Cliente responde**: `PATCH /request_questions/{id}` con `answerText`.
- **Cliente ve preguntas**: `GET /request_questions?request=/api/requests/{id}`.

### Estructura

```typescript
interface RequestQuestion {
  id: number;
  questionText: string;
  answerText?: string;  // sin responder si undefined
  createdAt: string;
  author: { fullName: string };
}
```

- Las preguntas solo se pueden crear y responder mientras el request está en `PENDING`.
- Sin `answerText` → pregunta pendiente de respuesta.

---

## 5. Mercado y oportunidades

### Qué son las oportunidades

- Requests con `is_market=true` y `status=PENDING`.
- Endpoint: `GET /requests?is_market=true&status=PENDING` (con filtros opcionales).

### Filtros

- `title`, `category`, `order[estimatedPriceMin]`, `order[createdAt]`.

### Cards de oportunidad (`MarketOpportunityCard`)

- Columna derecha: etiqueta **«Rango IA»** y el texto del rango (p. ej. `40€ - 80€`); si `isBidden`, badge "ENVIADA" en lugar de repetir la etiqueta.
- Muestran título, zona, categoría y media (foto/audio/video).
- HIGH Risk: overlay borroso y badge "TRABAJO DE ALTA DIFICULTAD".
- `isBidden`: si el usuario tiene una propuesta **activa** (no retirada) en esa oportunidad.
- `isLocked`: si no puede pujar (p. ej. HIGH Risk para no-PRO).

### Botón "ME INTERESA"

- Para **tier efectivo FREE o CLIENT** (incluye ex-PRO / ex-SOLVER sin `paidThroughAt` vigente): antes del modal se llama a `GET /professionals/me/can-bid`. El backend debe aplicar el límite al **plan efectivo**, no solo al rol `ROLE_FREE`. Si `canBidThisMonth === false`, alerta de límite. El conteo debe **excluir** pujas retiradas (`REJECTED`); el texto de “propuestas gratuitas restantes” en `Market` cuenta solo pujas no `REJECTED`.
- **SOLVER** y **PRO** con suscripción activa abren el modal sin esa llamada.
- **HIGH Risk** sin tier **PRO** efectivo: candado / no puede pujar (el API también rechaza `POST /bids` con 422; mensaje vía `getApiErrorMessage`, p. ej. código `BID_HIGH_REQUIRES_PAID_SUBSCRIPTION` o `BID_MONTHLY_LIMIT_EXCEEDED`).

---

## 6. Suscripción y Stripe

### Flujo en la app

1. El usuario elige tier (FREE, SOLVER o PRO).
2. Rellena formulario: nombre, teléfono, CIF (obligatorio para PRO), bio, skills.
3. Si SOLVER o PRO → se llama a `createCheckoutSession()` y se redirige a Stripe Checkout.
4. Retorno: `?success=1` o `?canceled=1`.
5. Si `success=1`: `POST /stripe/sync-subscription` (JWT) y acto seguido `GET /users/{id}` para refrescar `localStorage` con `paidThroughAt` y `subscriptionCancelAtPeriodEnd` aunque el webhook llegue tarde (ver `docs/STRIPE_BACKEND.md`).
6. El webhook del backend debe mantener `paidThroughAt` y roles al día de forma habitual.

### Precios (según UI)

- FREE: Gratis.
- SOLVER: 4,99€/mes.
- PRO: 11,99€/mes.

### `paidThroughAt` y cancelaciones

- `paidThroughAt` indica hasta qué fecha está pagada la suscripción (en `User` y/o `professionalProfile`; el cliente prioriza el del perfil profesional si existe).
- Es la fuente de verdad en cliente y servidor para el **plan efectivo**: sin fecha futura → límites FREE, sin nuevas pujas HIGH, etc.
- `null` significa **sin periodo de pago conocido** en API (no “Pro implícito por rol”).
- Se actualiza desde webhooks Stripe (`subscription.current_period_end`, etc.) y puede alinearse antes con `POST /stripe/sync-subscription` tras Checkout.
- El backend puede exponer además en el recurso `User`:
  - `subscriptionCancelAtPeriodEnd: boolean` para indicar si la suscripción está marcada en Stripe con `cancel_at_period_end = true`.
- En `Profile`:
  - La sección **Suscripción** muestra el plan actual (SOLVER / PRO) y el texto "Activo hasta el {fecha}. A partir de entonces tu cuenta pasará a Free.".
  - Tras llamar a `POST /stripe/cancel-subscription`, si el backend marca `subscriptionCancelAtPeriodEnd = true`, el front muestra el estado "Tu suscripción está cancelada..." hasta fin de periodo y un botón **Reactivar suscripción** que lleva a `/become-pro`.
  - Mientras tanto, el usuario mantiene las capacidades del plan hasta la fecha `paidThroughAt`.

Ver `docs/STRIPE_BACKEND.md` para requisitos de backend.

---

## 7. Rutas principales

| Ruta | Página | Acceso |
|------|--------|--------|
| `/login` | Login | Público |
| `/register` | Registro | Público |
| `/request-list` | Inicio / Mis solicitudes | Autenticado |
| `/request/:id` | Detalle (cliente) | Autenticado |
| `/pro/request/:id` | Detalle (profesional) | Autenticado + pro |
| `/market` | Mercado de oportunidades | Autenticado + pro |
| `/my-work` | Mis propuestas y trabajos | Autenticado + pro |
| `/profile` | Perfil | Autenticado |
| `/profile/notifications` | Configuración de notificaciones | Autenticado |
| `/new-request` | Nueva solicitud | Autenticado |
| `/become-pro` | Registro / mejora de plan | Autenticado |
| `/directory` | Directorio de profesionales | Autenticado |
| `/directory/:id` | Ficha de profesional | Autenticado |
| `/forgot-password` | Recuperar contraseña | Público |
| `/reset-password` | Establecer nueva contraseña (con token) | Público |
| `/verify-email` | Verificación de email (con token) | Público |

### Tabs visibles

- **Mercado** y **Gestión (My Work)**: si tiene `ROLE_PRO` o `professionalProfile` (flujo “profesional” en la app; no equivale solo a “PRO de pago”: el tier efectivo y el API acotan pujas y HIGH).

---

## 8. Endpoints de API principales

### Auth

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/login_check` | Login email/password |
| POST | `/social/login` | Login Google/Apple: JSON **`{ "token": "<id_token>", "provider": "GOOGLE" \| "APPLE" }`** — campo **`token`**, no `firebaseToken` (ver **[API.md](./API.md)**). Cliente: `skipAuthHeader` / `skipAuthRedirect`. |
| GET | `/users?email=...` | Usuario por email |

### Usuarios y perfiles

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/users` | Registro |
| POST | `/users/forgot-password` | Solicitar email de recuperación |
| POST | `/users/reset-password` | Establecer nueva contraseña con token |
| POST | `/verify/email` | Verificar email (por token) o reenviar verificación |
| POST | `/verify/phone/send` | Enviar SMS de verificación de teléfono (`profile: 'client' \| 'professional'`) |
| POST | `/verify/phone/confirm` | Confirmar SMS (`code`, `profile`) |
| POST | `/professional_profiles` | Crear perfil profesional |
| PATCH | `/professional_profiles/{id}` | Actualizar perfil profesional (CIF, bio, skills, zona) |
| GET | `/professional_profiles?itemsPerPage=30` | Listado de pros |
| GET | `/professional_profiles/{id}` | Detalle de un pro |
| GET | `/professionals/me/can-bid` | ¿Puede pujar este mes según **plan efectivo** (FREE / ex-PRO sin pago, etc.)? `canBidThisMonth` debe basarse en el conteo del mes **excluyendo** retiradas (`REJECTED`). |

### Subida de ficheros (tickets + signed URL)

La app usa un flujo de subida por **ticket** (el backend devuelve `signedUrl` + `publicUrl`):

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/upload-ticket/avatar` | Obtener ticket para subir avatar (devuelve `signedUrl` + `publicUrl`) |
| POST | `/upload-ticket/request-media` | Obtener ticket para subir media de solicitud (foto/audio/vídeo; devuelve `signedUrl` + `publicUrl`) |

Después del ticket, el frontend hace `PUT` a `signedUrl` y guarda/usa `publicUrl`.

### Solicitudes

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| GET | `/requests?...` | Lista con filtros |
| GET | `/requests/{id}` | Detalle |
| POST | `/requests` | Crear |
| PATCH | `/requests/{id}` | Actualizar (merge-patch) |

Params: `status`, `category`, `title`, `order[createdAt]`, `order[estimatedPriceMin]`, `is_market`, `history`, `my_requests`, `my_jobs`.

### Propuestas

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| GET | `/bids?my_bids=true&...` | Mis propuestas |
| POST | `/bids` | Crear propuesta |
| PATCH | `/bids/{id}` | Actualizar (p. ej. retirar) |
| PATCH | `/bids/{id}/accept` | Aceptar propuesta |

### Visitas de valoración

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/requests/{id}/visit-request` | Solicitar visita (profesional) |
| POST | `/visit-requests/{id}/accept` | Aceptar visita (cliente) |
| POST | `/visit-requests/{id}/reject` | Rechazar visita (cliente) |

### Preguntas

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| GET | `/request_questions?request=...` | Preguntas de una solicitud |
| POST | `/request_questions` | Crear pregunta |
| PATCH | `/request_questions/{id}` | Responder pregunta |

### Valoraciones

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| GET | `/reviews?request=...&author=...` | Valoraciones de una solicitud |
| POST | `/reviews` | Crear valoración |

### Stripe

| Método | Endpoint | Propósito |
|--------|----------|-----------|
| POST | `/stripe/checkout-session` | Crear sesión de pago Stripe |
| POST | `/stripe/sync-subscription` | Tras Checkout success: alinear BD con Stripe si el webhook va tarde; luego el cliente hace GET usuario |
| POST | `/stripe/cancel-subscription` | Marcar la suscripción para cancelar al final del periodo actual |

---

## 9. Estructuras de datos principales

### ServiceRequest

`id`, `@id`, `title`, `description` (valoración técnica devuelta por la IA / editable en paso 2), **`clientOriginalDescription`** (opcional: texto libre que escribió el cliente en modo texto + imagen antes del análisis; requiere columna y grupos API en backend), **`estimatedPriceMin`** y **`estimatedPriceMax`** (rango en céntimos de la estimación IA para la zona; el front convierte a euros para mostrar), `status`, `riskLevel`, `category`, `address`, `preciseAddress`, `photoUrl`, `audioUrl`, `videoUrl`, `extraPhotoUrls`, `extraVideoUrls`, `extraAudioUrls`, `desiredExecutionTime`, `locationPoint`, `createdAt`, `aiDiagnosis`, `client`, `assignedProfessional` (incluye `phoneNumber` para contacto cuando hay profesional asignado), `visitRequests`, `bids`, `questions`.

#### Backend: campo `clientOriginalDescription`

El cliente envía `clientOriginalDescription` en **`POST /requests`** cuando la solicitud se creó desde el modo texto (y opcionalmente imagen). El backend debe:

1. Añadir en la entidad **ServiceRequest** (o equivalente) una propiedad nullable, p. ej. tipo `text` / `LONGTEXT`: `clientOriginalDescription`.
2. Migración: columna en snake_case según convención del proyecto, p. ej. `client_original_description`.
3. **API Platform / serialización**: incluir el campo en los grupos de lectura y escritura del recurso Request (mismo patrón que `description`), expuesto en JSON como **`clientOriginalDescription`** (camelCase) para alinear con el frontend.
4. Validación: opcional, longitud máxima razonable (p. ej. coincide con lo que acepta `/predict` para `description`).

Sin este campo en API, el frontend sigue enviándolo pero el servidor puede ignorarlo hasta que exista la columna.

### VisitRequest

`id`, `status` (`PENDING` | `ACCEPTED` | `REJECTED`), `professional`, `professionalPhone` (solo cuando la visita está aceptada).

### Bid

`id`, `@id`, `priceQuote`, `comment`, `status`, `createdAt`, `professional`, `request`.

### User

`id`, `@id`, `email`, `roles`, `verifiedEmail`, `professionalProfile`, `clientProfile`, `paidThroughAt`, `subscriptionCancelAtPeriodEnd`.

### ProfessionalProfile

`id`, `@id`, `fullName`, `phoneNumber`, `verifiedPhone`, `avatar`, `taxId`, `bio`, `skills`, `isVerified`, `rating`, `reviewCount`, `user`, `paidThroughAt` (opcional; fin de suscripción si el API lo expone aquí además de en `User`).

### ClientProfile

`id`, `@id`, `fullName`, `phoneNumber`, `verifiedPhone`, `avatar`, `rating`, `reviewCount`, `user`. El backend expone `rating` y `reviewCount` (no `ratingAsClient`).

### Categorías

`DIY`, `PLUMBING`, `ELECTRICITY`, `MASONRY`, `HVAC`, `CLEANING`, `PAINTING`, `GARDENING`.

---

## 10. Vistas específicas

### RequestDetail (cliente)

- Orden del contenido principal (tras multimedia): **título** + estado; **Rango estimado (IA)** (`estimatedPriceMin` / `estimatedPriceMax`, céntimos, mostrados en euros); **Disponibilidad preferida**; **Descripción del problema** (texto original, valoración IA, categoría, **adjuntos adicionales** extraPhotoUrls / extraVideoUrls / extraAudioUrls); **ubicación** (aproximada o exacta según estado); **mapa embebido** si la dirección es exacta; **Preguntas y dudas**; bloque **Profesional asignado** u ofertas **PENDING**; **Cancelar solicitud** al final cuando aplique.
- **Visita de valoración**: el bloque de acción vive **dentro** de la caja de descripción; si hay visita PENDING, el cliente ve "Aceptar visita" y "Rechazar"; si está ACCEPTED, ve el teléfono del profesional y "LLAMAR AL PROFESIONAL".
- Lista de ofertas ordenadas por tier y precio de la **propuesta** (`priceQuote`); cada oferta muestra **rating** y **reviewCount** del profesional.
- En el listado de ofertas, el cliente puede filtrar localmente por **“Solo Pros”** (además de ver “Todos”).
- Bloque **Profesional asignado** (cuando la solicitud está aceptada o completada): mismo estilo que las ofertas (avatar con badge PRO/SOLVER/FREE, nombre, rating y reviewCount), botón CONTACTAR o VALORAR TRABAJO.
- Al hacer clic en el profesional → ficha en `/directory/:id`.
- Botón **"ACEPTAR PRESUPUESTO"** (aceptar la **oferta de un profesional**, no el rango IA) → modal de dirección y confirmación.
- En lanzamiento, las direcciones exactas solo se aceptan si están en provincia de **Córdoba (Andalucía, España)**; de lo contrario, se muestra un aviso y no se guarda la dirección.

### ProRequestDetail (profesional)

- Vista alineada con la del cliente en el mismo orden informativo: **título** + estado; **Rango estimado (IA)** (tarjeta con texto de ayuda; el **modal de propuesta** sugiere como importe inicial la media del rango); **Disponibilidad preferida**; **Descripción del problema** (texto del cliente, valoración IA, categoría, **adjuntos adicionales**); **visita de valoración** (flujo PRO / alta dificultad) **dentro** de esa caja; **ubicación** (aproximada o exacta según estado); **mapa** si el trabajo es ganado; **Preguntas y dudas**; bloque **Cliente**; **Tu propuesta**; **acciones** (enviar propuesta, finalizar, valorar, etc.) al final.
- **Bloque Cliente**: card con título "Cliente", avatar redondeado, nombre, **rating** y **reviewCount** del cliente (si vienen en `request.client`). Botón **"LLAMAR AL CLIENTE"** cuando el pro es ganador (`isWinner`) o cuando la **visita de valoración está aceptada** y el backend envía `client.phoneNumber` (el número no se muestra en UI, solo la acción de llamar).
- **Solicitar visita para valorar** (solo HIGH, **tier efectivo PRO**): `POST /requests/{id}/visit-request`; errores del API se muestran con `getApiErrorMessage`.
- Si tiene propuesta: muestra su propuesta con opción de retirarla (si PENDING).
- Si es HIGH Risk y el tier efectivo no es PRO: bloqueo para pujar; el API valida igualmente.
- Si está degradado pero tiene relación con la solicitud (puja activa o ganador): puede ver el detalle pese a HIGH.

### MyWork

- Segmentos: "Propuestas" y "Trabajos".
- Estados de propuestas: PENDIENTE, GANADA, RETIRADA, CANCELADA, CERRADA.
- Estados de trabajos: ASIGNADO, FINALIZADO.
- En **listados**, las solicitudes muestran etiqueta **«Rango IA»** y el rango en euros (convertido desde céntimos); en **Propuestas** la columna derecha sigue siendo **tu propuesta** (`priceQuote`).

### NewRequest

- En modo **texto** (+ imagen opcional), el texto del usuario **no** se sustituye por el `summary_text` de la IA: se conserva para el paso 2 y se persiste como **`clientOriginalDescription`**. La **`description`** almacenada es la valoración técnica (campo `description` de `/predict`).
- Paso 1: selección de modo (audio, vídeo, texto) y captura de descripción. Opción de capturar (cámara/micrófono) o elegir desde galería para foto, vídeo y audio.
- Paso 2: Diagnóstico IA, título, **nivel de riesgo (`risk_level` → LOW / MEDIUM / HIGH)**, **rango de precio estimado por la IA en la zona** (solo lectura; se muestra como «Rango estimado en tu zona (IA)») y **disponibilidad preferida para realizar el trabajo (sin fecha exacta)**. El nivel de riesgo se muestra como etiqueta no editable en el step 2 y se envía en la creación de la request para rellenar el campo `riskLevel` del backend. **Publicar** envía `estimatedPriceMin`, `estimatedPriceMax` y `aiDiagnosis` (objeto con `min`/`max` en céntimos); **no** se envía `priceAmount`. **Añadir más detalles (opcional)**: fotos, vídeos y audios adicionales (hasta un máximo configurable); texto de ayuda: "Cuanto más detallada sea tu solicitud... más fácil será que los profesionales te hagan una buena oferta". Para audio se puede grabar in situ o elegir desde galería.
- Requiere dirección aproximada (Google Places o GPS).
- Las pestañas audio / vídeo / texto son **excluyentes**: solo se envía el contenido del modo activo al analizar y al publicar.
- Antes de llamar a la IA (`/predict`), se envía:
  - `description`, `image`, `audio`, **`video`** (según el modo; el resto va vacío o `null`),
  - `location`: ciudad/pueblo normalizado (ej. `Posadas, Córdoba (España)` o `Córdoba (España)`), no la dirección completa.
- El cliente usa **timeout explícito** para `POST /predict` (p. ej. 300 s en `httpTimeouts.ts`; recomendado 120–300 s con vídeo). El backend debe permitir lectura del cuerpo y ejecución suficientes; ver **`docs/BACKEND_PREDICT_UPLOAD.md`**.
- En la pestaña **vídeo**, si la app detecta **datos móviles** (Capacitor `@capacitor/network` en iOS/Android) o, cuando no hay detalle de red nativo, **conexión lenta** vía heurística (`navigator.connection.effectiveType` 2g/3g, p. ej. en tests), se muestra un aviso para sugerir Wi‑Fi o paciencia en la subida.
- **Vídeo hacia `/predict`:** la app intenta **re-codificar** en cliente con **datos móviles** o red **lenta**; con **Wi‑Fi** o red **desconocida** solo si el vídeo es **grande** (≥ **~10 MB** decodificados). La re-codificación es **moderada** (calidad suficiente para modelos multimodales / Gemini). Si falla o el vídeo supera **~5 minutos**, se envía el original. La publicación (paso 2) sigue subiendo el vídeo **original** del paso 1 al bucket.
- Para el lanzamiento:
  - Solo se aceptan direcciones dentro de la provincia de **Córdoba (Andalucía, España)**.
  - Si la dirección seleccionada no pertenece a esa provincia, se muestra un toast y se limpia la dirección.
  - Si el teléfono del cliente no está verificado, se muestra una pantalla de bloqueo que invita a ir a Perfil para verificarlo (no deja crear solicitudes).

### Directorio y detalle de profesional

- **Listado (Directorio y Profesionales top en RequestList)**: cada tarjeta muestra avatar redondeado, badge PRO/SOLVER/FREE **encima del avatar**, nombre, **habilidades o categoría en español** (p. ej. Fontanería, Climatización) mediante `getCategoryLabel` / `utils/categoryLabels`, y rating + reviewCount.
- **Ficha de profesional (`/directory/:id`)**: hero con avatar y tier; **InfoCard** con nombre, subtítulo (primera skill o categoría traducida), rating y trabajos; secciones **Sobre el profesional**, **Especialidades** y **Opiniones** dentro de **cajas** (`.directory-detail-card`: fondo blanco, bordes redondeados, sombra suave).

### Profile

- Sección **Cuenta**:
  - "Datos Personales" → modal con:
    - Datos básicos: nombre, email de acceso (editar email pone `verifiedEmail = false` y muestra botón para reenviar verificación).
    - Teléfonos:
      - Si existe `clientProfile`: "Teléfono (como cliente) *" + botón "Verificar teléfono" si no está verificado.
      - Si existe `professionalProfile`: "Teléfono (como profesional) *" + botón "Verificar teléfono" si no está verificado.
    - Para perfiles profesionales:
      - **Biografía\***, **Dirección base\***, **Especialidades\*** siempre obligatorias.
      - **CIF/NIF\*** obligatorio solo para tier PRO.
      - La Dirección base solo admite localidades de la provincia de Córdoba (igual que en `NewRequest`).
- Sección **Suscripción**:
  - Muestra el plan actual (SOLVER/PRO), la fecha `paidThroughAt` y el estado de cancelación (`subscriptionCancelAtPeriodEnd`). El bloque "Plan actual" tiene padding superior e inferior reducido (7px) para mejor lectura.
  - Botón "Cancelar suscripción" → llama a `/stripe/cancel-subscription` y pasa a mostrar "Reactivar suscripción" mientras la cancelación es efectiva a fin de periodo.
- Sección **Preferencias**:
  - Enlace a **Configuración de notificaciones** (`/profile/notifications`), donde se pueden activar/desactivar notificaciones por tipo (solicitudes, ofertas, reseñas) tanto para cliente como para profesional.

---

## 11. Estrategia de tests (resumen)

Para minimizar regresiones antes de publicar:

- **Vitest (unit/integration)**:
  - Se cubren utilidades críticas (p. ej. `resolveMediaUrl`, `getApiErrorMessage`) y flujos sensibles (subidas por ticket en `uploadService`).
  - Componentes con lógica de render según estado/media (p. ej. `RequestDetailMedia`, `ProRequestDetailMedia`, `RequestMediaThumb`, `MarketOpportunityCard`).
  - Robustez ante crashes con `ErrorBoundary`.
- **Ionic en tests**:
  - En ciertos tests se stubbean componentes (p. ej. `IonAlert`) o se evita envolver con `IonApp` cuando no es necesario para reducir flakiness y evitar timers internos que pueden causar errores al teardown en `jsdom`.
