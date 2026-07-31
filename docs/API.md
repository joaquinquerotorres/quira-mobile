# API — contrato relevante para la app móvil

La base URL viene de `VITE_API_URL` (p. ej. `https://api.ejemplo.com/api`). Las rutas siguientes son relativas a esa base (en el backend desplegado suele verse como `POST /api/social/login` según el prefijo del proyecto).

Este documento cubre los contratos que la app consume de forma directa: **login social**, **crear solicitud**, **upload tickets** (`maxBytes`), **predict** (+ poll), perfiles profesionales, verificación de teléfono y `fcmToken`. Listado funcional más amplio: **[ARQUITECTURA.md](./ARQUITECTURA.md)**. Flujo IA / media: **[BACKEND_PREDICT_UPLOAD.md](./BACKEND_PREDICT_UPLOAD.md)**.

## `POST /social/login` (Google / Apple)

Alineado con el backend y con `src/pages/Login.tsx`: el cuerpo debe usar **`token`**, no `firebaseToken`.

### Cuerpo JSON

| Campo | Tipo | Descripción |
|--------|------|-------------|
| **`token`** | `string` | **ID token** de Firebase del usuario (JWT emitido por Firebase Auth tras el sign-in nativo). |
| **`provider`** | `GOOGLE` \| `APPLE` | Proveedor usado en el flujo nativo. |

### Cabeceras en cliente

- **No** enviar `Authorization: Bearer <JWT app>` en esta petición (`skipAuthHeader` en Axios).
- Ante **401** en esta ruta, **`skipAuthRedirect`** evita disparar el cierre de sesión global pensado para JWT caducado.

### Respuesta esperada (éxito)

Cuerpo con al menos **`token`** (JWT de la API) y **`user`**, que la app guarda en `localStorage`.

### Diagnóstico (back + front)

El mensaje de “no poder identificarte con Google” **suele salir en la app antes de llegar a la API** (Firebase/Google), pero **también puede fallar después**, cuando el front llama a `POST …/social/login` y el **backend no puede verificar el token** (proyecto Firebase distinto, credenciales mal desplegadas en Railway, etc.).

Para acotar:

- **Red:** en WebView con DevTools (o proxy), comprobar si **existe** la petición a `/api/social/login` (o ruta equivalente con prefijo) y **qué código HTTP** devuelve.
- **Servidor:** revisar logs si aparece error al **verificar el token de Firebase**.

---

## `POST /requests` (crear solicitud)

Cuerpo JSON alineado con `src/pages/NewRequest.tsx` (no exhaustivo):

| Campo | Tipo | Notas |
|--------|------|--------|
| `title`, `description`, `category`, `address`, `status` | string / enum | `description` = valoración técnica (IA). `category`: uno de los **22** códigos `Category` del API (ver tabla abajo). |
| `locationPoint` | GeoJSON Point | `coordinates: [lng, lat]`. |
| **`estimatedPriceMin`**, **`estimatedPriceMax`** | number (céntimos) | Rango de la estimación IA; obligatorios para el flujo actual. |
| **`aiDiagnosis`** | `{ min: number, max: number }` | Redundante con min/max; mismo criterio en céntimos. |
| `desiredExecutionTime` | string | Disponibilidad preferida: presets de UI o `Fecha concreta: DD/MM/YYYY`. |
| `riskLevel` | `LOW` \| `MEDIUM` \| `HIGH` | Opcional; desde `/predict`. |
| `clientOriginalDescription` | string | Opcional; modo texto + imagen. |
| `photoUrl`, `audioUrl`, `videoUrl`, `extraPhotoUrls`, … | URLs | Tras subida a bucket. |

En **`request:read`**, el listado cliente usa **`bidCount`** (nº de propuestas; fallback `bids.length`) para el chip «Propuestas».

En **`pro:read`**, **`ProfessionalProfile.createdAt`** alimenta el texto «En Quira desde …» en el **detalle** del profesional (no en listados).

**No** se envía `priceAmount` (sustituido por el rango anterior).
En respuestas de requests, el frontend usa `desiredExecutionTime` para disponibilidad en cards/listados; `scheduledAt` ya no forma parte del contrato consumido por la app.

### Fecha del trabajo (calendario del profesional)

Un trabajo ganado tiene **como máximo un** `CalendarEvent` con **`startsAt`**: la fecha/hora en que se realizará el trabajo (no hay `endsAt` / rango).

| Método | Ruta | Notas |
|--------|------|--------|
| `GET` | `/calendar_events` | Filtros opcionales `startsAt[after]`, `startsAt[before]`, `request`. |
| `POST` | `/calendar_events` | `{ request: "/api/requests/{id}", startsAt, notes? }`. |
| `PATCH` | `/calendar_events/{id}` | `{ startsAt, notes? }`. |
| `DELETE` | `/calendar_events/{id}` | Quita del calendario; no cancela el trabajo. |

La app deduplica por `request` en cliente; el backend debería imponer **unicidad (professional, request)**.

`startsAt` es **hora civil** (día y hora del trabajo en local), no un instante UTC a convertir. La app envía `YYYY-MM-DDTHH:mm:ss` sin zona y, al leer, **ignora** sufijos `Z` / `+00:00` para que el editor (IonDatetime) y el listado del calendario muestren la misma hora. El backend no debe reinterpretar esa cadena aplicando timezone del servidor.

### `category` (enum)

Alineado con `App\Enum\Category` (quira). Cliente: `CATEGORY_CODES` / `CATEGORY_LABELS` en `src/utils/categoryLabels.ts`.

| Código | Etiqueta UI |
|--------|-------------|
| `CLEANING` | Limpieza |
| `DIY` | Manitas |
| `ELECTRICITY` | Electricidad |
| `GARDENING` | Jardinería |
| `PAINTING` | Pintura |
| `PLUMBING` | Fontanería |
| `HVAC` | Climatización |
| `MASONRY` | Reformas |
| `APPLIANCES` | Electrodomésticos |
| `MOVING` | Mudanzas y Portes |
| `LOCKSMITH` | Cerrajería |
| `POOL` | Mantenimiento de Piscinas |
| `SEWING` | Costura y Arreglos |
| `BLINDS` | Persianas y Toldos |
| `GLAZING` | Cristalería |
| `FURNITURE` | Restauración de Muebles |
| `CLEAROUT` | Vaciado de Pisos |
| `PEST_CONTROL` | Control de Plagas |
| `SMART_HOME` | Domótica y Seguridad |
| `BEAUTY` | Belleza |
| `PETS` | Mascotas |
| `CARE` | Cuidados |

Alias legacy: `DYC` → `DIY`. Si `/predict` devuelve un código desconocido, la app guarda `DIY`.

---

## Upload tickets

### `POST /upload-ticket/avatar`

Body: `{ "contentType": "image/jpeg" }` (u otro MIME de imagen).  
Respuesta: `signedUrl`, `publicUrl`, `expiresIn`. El cliente hace **PUT** del fichero a `signedUrl` y luego envía `publicUrl` donde corresponda (p. ej. avatar de usuario).

### `POST /upload-ticket/request-media`

Body:

| Campo | Tipo | Notas |
|--------|------|--------|
| `type` | `photo` \| `audio` \| `video` | Obligatorio. |
| `contentType` | string | MIME del binario a subir. |

Respuesta:

| Campo | Tipo | Notas |
|--------|------|--------|
| `signedUrl` | string | PUT del binario. |
| `publicUrl` | string | URL pública del objeto (bucket requests). |
| `expiresIn` | number | Segundos de validez del ticket (p. ej. 300). |
| **`maxBytes`** | number | Tope del análisis IA (`PredictMediaLimits`). |

| `type` | `maxBytes` |
|--------|------------|
| `photo` | 10 000 000 (10 MB) |
| `audio` | 12 000 000 (12 MB) |
| `video` | 40 000 000 (40 MB) |

Mismo tope en Wi‑Fi y datos móviles. El cliente valida `blob.size` contra `maxBytes` **antes** del PUT (`uploadService`); la UI usa las mismas cifras en `predictMediaLimits.ts` / `NewRequest`. Detalle del flujo: **[BACKEND_PREDICT_UPLOAD.md](./BACKEND_PREDICT_UPLOAD.md)**.

---

## Predict (IA)

### `POST /predict`

Preferido: body JSON pequeño con URLs ya subidas a Supabase.

| Campo | Tipo | Notas |
|--------|------|--------|
| `description` | string | Texto libre / modo texto. |
| `location` | string | Zona normalizada (p. ej. ciudad). |
| `imageUrl` / `audioUrl` / `videoUrl` | string (HTTPS) | Del bucket de requests; anti-SSRF en backend. |

Respuesta típica:

- **`202`** `{ taskId, status }` → la app hace poll a `GET /predict/tasks/{publicId}` hasta `completed` / `failed` (o timeout de poll).
- **`200`** con `result` si el entorno procesa en sync.

Campos relevantes en `result` (una sola llamada a Gemini):

| Campo | Tipo | Notas |
|--------|------|--------|
| `safe` / `safety_reason` | boolean / string\|null | Moderación (abuso, ilegal, injection, contacto). Legacy: `is_safe` / `reason`. Si `safe=false`, al crear Request el backend puede poner `PENDING_APPROVAL`. |
| `in_scope` / `out_of_scope_reason` | boolean / string\|null | Cobertura Quira (servicio del marketplace). Si falta `in_scope`, la app lo trata como `true`. `in_scope=false` **no** implica moderación; la UI bloquea publicar. |
| `estimated_price_min` / `estimated_price_max` | number (céntimos) | Pueden ser `0` si `safe=false` o `in_scope=false`. |

`aiDiagnosis` al crear la Request preserva `safe`, `safety_reason`, `in_scope`, `out_of_scope_reason` (spread del resultado de predict). Parseo: `src/utils/parsePredictSafety.ts`.

Legacy (evitar; la app no lo usa): `image` / `audio` / `video` en base64 o Data URL.

Límites de fichero: los de la tabla `maxBytes` arriba. Implementación cliente: `predictService.ts`, timeouts en `httpTimeouts.ts`.

### `GET /predict/tasks/{publicId}`

Estado: `pending` | `processing` | `completed` | `failed`, más `result` / `error`. Solo el dueño de la tarea.

---

## Otras rutas

Listado más amplio: **[ARQUITECTURA.md](./ARQUITECTURA.md)**.

---

## `POST /professional_profiles` y `PATCH /professional_profiles/{id}`

Contrato mínimo esperado por el flujo actual de `become-pro` y edición de perfil profesional:

| Campo | Tipo | Notas |
|--------|------|--------|
| `fullName` | string | Obligatorio. |
| `phoneNumber` | string | Obligatorio. |
| `bio` | string | Obligatorio. |
| `skills` | string[] | Obligatorio (al menos una). |
| `address` | string | Obligatorio (dirección base de cobertura). |
| `serviceRadiusKm` | number | Obligatorio en front; rango UI: 5..100. |
| `locationPoint` | GeoJSON Point \| `null` | `{ type: "Point", coordinates: [lng, lat] }`. |
| `taxId` | string \| `null` | Obligatorio para tier PRO (regla de negocio). |
| `tierRequested` | `FREE` \| `SOLVER` \| `PRO` | En `become-pro` para decidir checkout/capacidades. |
| `verifiedPhone` | boolean (opcional) | Puede venir `true` cuando aplica auto-verificación por coincidencia con teléfono cliente ya verificado. |

Respuesta: debe devolver el `ProfessionalProfile` persistido incluyendo `address`, `serviceRadiusKm` y `locationPoint`.

Regla esperada de negocio (servidor): al editar cliente/profesional, si el nuevo `phoneNumber` coincide (normalizado) con el teléfono del otro perfil del mismo usuario y ese otro ya estaba verificado, el backend debe persistir también `verifiedPhone=true` en el perfil editado.

---

## `POST /verify/phone/send` y `POST /verify/phone/confirm`

Uso en la app (`Profile.tsx`):

- **`/verify/phone/send`**: cuerpo `{ profile: 'client' | 'professional' }`. El backend usa el teléfono ya persistido del perfil indicado.
- Tras **Guardar cambios** en el modal de datos personales, si el número editado sigue sin estar verificado y no aplica la auto-verificación cruzada (ver tabla anterior), el cliente llama a `send` y abre el modal para introducir el código SMS. El botón **Reenviar SMS** en ese modal vuelve a llamar a `send`.
- **`/verify/phone/confirm`**: cuerpo `{ code: string, profile: 'client' | 'professional' }`. Si el usuario tiene **cliente + profesional** y ambos números requieren verificación en la misma sesión, primero se completa el código del cliente y luego se puede enviar el SMS del profesional en cadena.

---

## `PATCH /users/{id}` (sincronización de `fcmToken`)

La app nativa (Android/iOS) pide permisos de push, obtiene token FCM y lo sincroniza en el usuario autenticado.

### Cuerpo JSON (merge-patch)

```json
{ "fcmToken": "<token_fcm>" }
```

### Cuándo se envía

- En arranque de app con sesión iniciada (`localStorage.user.id` disponible).
- Solo en nativo (`Capacitor.isNativePlatform()`).
- Solo si permisos push concedidos.
- Solo si el token cambia respecto al último guardado localmente.

---

## `GET /reviews` (perfil: recibidas / hechas)

Usado por el modal Valoraciones del perfil.

| Query | Uso en app |
|--------|------------|
| `target=/api/users/{id}` | Valoraciones **recibidas** (requiere filtro `target` en API Platform) |
| `author=/api/users/{id}` | Valoraciones **hechas** (filtro ya existente) |
| `request=…&author=…` | Comprobar si ya valoré un trabajo (detalle solicitud) |

### Campos útiles en lectura (`review:read`)

La app normaliza: `rating`/`score`, `text`/`comment`, `date`/`createdAt`, `author` (nombre string), y si existen: `targetName`, `requestTitle`, `authorIsProfessional` (para facet cliente vs pro).

Media en UI: `clientProfile.rating` / `professionalProfile.rating` del usuario según el modo activo (fallback: media de la lista recibida).

