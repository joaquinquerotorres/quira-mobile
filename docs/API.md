# API — contrato relevante para la app móvil

La base URL viene de `VITE_API_URL` (p. ej. `https://api.ejemplo.com/api`). Las rutas siguientes son relativas a esa base (en el backend desplegado suele verse como `POST /api/social/login` según el prefijo del proyecto).

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
| `title`, `description`, `category`, `address`, `status` | string / enum | `description` = valoración técnica (IA). |
| `locationPoint` | GeoJSON Point | `coordinates: [lng, lat]`. |
| **`estimatedPriceMin`**, **`estimatedPriceMax`** | number (céntimos) | Rango de la estimación IA; obligatorios para el flujo actual. |
| **`aiDiagnosis`** | `{ min: number, max: number }` | Redundante con min/max; mismo criterio en céntimos. |
| `desiredExecutionTime` | string | Disponibilidad preferida (texto libre predefinido en UI). |
| `riskLevel` | `LOW` \| `MEDIUM` \| `HIGH` | Opcional; desde `/predict`. |
| `clientOriginalDescription` | string | Opcional; modo texto + imagen. |
| `photoUrl`, `audioUrl`, `videoUrl`, `extraPhotoUrls`, … | URLs | Tras subida a bucket. |

**No** se envía `priceAmount` (sustituido por el rango anterior).

En las respuestas de **`GET /requests`** (y objetos `ServiceRequest` embebidos), la disponibilidad que muestra la app en listados y mercado es **`desiredExecutionTime`** (string). **No** se usa ningún campo `scheduledAt` en el cliente.

---

## Otras rutas

Listado más amplio: **[ARQUITECTURA.md](./ARQUITECTURA.md)**.
