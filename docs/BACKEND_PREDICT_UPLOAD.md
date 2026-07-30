# Flujo híbrido: media → Supabase → `/predict` por URL

La app **no** envía vídeo/audio/imagen en base64 dentro de `POST /api/predict`. Ese camino hinchaba el JSON (~+33 %), saturaba PHP en **4G** y provocaba timeouts / `ERR_NETWORK`.

El flujo actual: **ticket → PUT binario a Supabase → `/predict` solo con URLs** → worker (`PredictTask` / Messenger) descarga y llama a Gemini.

---

## Flujo (cliente + backend)

```text
1) Cliente: valida tamaño (UI) y, si aplica, comprime el vídeo
2) Cliente: POST /api/upload-ticket/request-media
            → signedUrl + publicUrl + expiresIn + maxBytes
3) Cliente: si blob.size > maxBytes → error (no PUT)
4) Cliente: PUT binario a signedUrl (Supabase) — progreso UI
5) Cliente: POST /api/predict { imageUrl | audioUrl | videoUrl, description?, location? }
6) Backend: PredictTask + AnalyzePredictMessage (Messenger **async**)
            → suele responder 202 { taskId, status }
            → (si sync en algún entorno) 200 con result
7) Cliente: si 202 → poll GET /api/predict/tasks/{publicId}

El `result` de predict (sync o tras poll) incluye, entre otros, `safe` / `safety_reason` e `in_scope` / `out_of_scope_reason`. La app los parsea en `parsePredictSafety.ts` y los reenvía en `aiDiagnosis` al crear la Request. `in_scope=false` es solo UX (no publica); `safe=false` avisa de moderación.
8) Worker: PredictMediaFetcher (anti-SSRF) → Gemini → guarda result
9) Publicar solicitud: reutiliza las mismas publicUrl (sin re-subir el media principal)
```

### Endpoints

| Método | Ruta | Rol |
|--------|------|-----|
| POST | `/api/upload-ticket/request-media` | Ticket (`type`, `contentType`) → `signedUrl`, `publicUrl`, `expiresIn`, **`maxBytes`** |
| POST | `/api/predict` | Body JSON pequeño con `*Url` (preferido) o legacy base64 |
| GET | `/api/predict/tasks/{publicId}` | Estado / resultado de la tarea |

Campos preferidos en `POST /api/predict`: `description`, `location`, `imageUrl`, `audioUrl`, `videoUrl` (HTTPS del bucket de requests de Supabase).

Legacy (compatibilidad backend): `image` / `audio` / `video` en base64 o Data URL → análisis **síncrono** sin tarea. **La app móvil ya no lo usa.**

Contrato resumido en el repo móvil: **[API.md](./API.md)** (§ Predict / Upload). Detalle de negocio: repo **quira** (`docs/API.md`, `PredictMediaLimits`).

---

## Límites de media (`PredictMediaLimits` / `maxBytes`)

Fuente de verdad en API: `App\Service\PredictMediaLimits` (quira). El ticket incluye el tope aplicable.

**Mismo tope en Wi‑Fi y datos móviles.** No hay hard-cap artificial distinto (~25 MB) en no‑Wi‑Fi: con Messenger la subida va a Supabase y el worker descarga hasta estos máximos.

| Media | Tipo ticket | `maxBytes` |
|-------|-------------|------------|
| Imagen | `photo` | **10 000 000** (10 MB) |
| Audio | `audio` | **12 000 000** (12 MB) |
| Vídeo | `video` | **40 000 000** (40 MB) |

Valores en **MB decimales** (× 1 000 000), no MiB (× 1024²).

### Cliente (`quira-mobile`)

| Capa | Qué hace |
|------|----------|
| `src/utils/predictMediaLimits.ts` | Constantes + helpers (fallback si el ticket no trae `maxBytes`) |
| `NewRequest.tsx` | Toasts previos a leer el fichero (misma tabla 10 / 12 / 40) |
| `uploadService.uploadRequestMediaWithTicket` | Tras el ticket, **antes del PUT**: `blob.size > maxBytes` → error |
| Extra media (paso 2) | Mismos topes que el media principal |

Compresión de vídeo (abajo) **no cambia** el tope de fichero: solo intenta aligerar la subida en redes difíciles o ficheros grandes.

---

## Messenger / worker (backend)

En `config/packages/messenger.yaml`, `AnalyzePredictMessage` va a cola **`async`**.

En Railway hace falta un segundo servicio con `CONTAINER_ROLE=worker` (misma imagen Dockerfile). Detalle: `quira/docs/DEPLOY.md` §4b.

Sin worker: `POST /predict` puede responder `202` y el cliente hace polling, pero la tarea **no avanza**.

Migración: tabla `predict_task` (`Version20260727210000`). Con `RUN_MIGRATIONS=1` en el entrypoint de Docker/Railway se aplica al boot (solo servicio **web**).

### Anti-SSRF

`PredictMediaFetcher` solo acepta URLs que empiecen por  
`{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET_REQUESTS}/`.

---

## Timeouts (app)

| Constante | Valor | Uso |
|-----------|-------|-----|
| `PREDICT_REQUEST_TIMEOUT_MS` | 120 000 | POST `/predict` (espera arranque de tarea / respuesta sync) |
| `PREDICT_POLL_INTERVAL_MS` | 1 500 | Entre GET de tarea |
| `PREDICT_POLL_TIMEOUT_MS` | 180 000 | Tope total de polling tras 202 |
| PUT a signed URL | 300 000 | `uploadService.putBlobToSignedUrl` (subidas grandes en 4G) |

Definición: `src/config/httpTimeouts.ts`. Orquestación: `src/services/predictService.ts`, `src/services/uploadService.ts`, `NewRequest.tsx`.

---

## Compresión de vídeo (antes del PUT)

La app puede **re-codificar** en el dispositivo cuando:

- Hay **datos móviles** (`cellular`) o **red lenta** (`slow_or_unreliable`), **o**
- Hay **Wi‑Fi** / `unknown` y el vídeo decodificado pesa **≥ 10 MiB** (`PREDICT_VIDEO_LARGE_BYTES_WIFI_OR_UNKNOWN` = 10 × 1024²).

Objetivo: aligerar la subida sin destruir el contenido para Gemini (~960 px, ~2,5 Mbit/s). Ver `src/utils/videoCompressForPredict.ts`.

Otros topes de compresión (no son el límite de análisis):

| Constante | Valor | Uso |
|-----------|-------|-----|
| Duración máx. (web) | ~300 s | No intentar re-encode si es más largo |
| Duración máx. (nativo) | ~120 s | Menos memoria en WebView |
| Bytes decodificados máx. (web) | 16 MiB | Evitar OOM al comprimir |
| Bytes decodificados máx. (nativo) | 10 MiB | Idem, más estricto |

Si falla la compresión o se supera un tope, se sube el **original** (siempre que respete `maxBytes`).

El fichero comprimido suele ser **WebM**; el ticket usa `contentType` para la extensión.

UI adicional: en pestaña vídeo, aviso si la red parece datos móviles / lenta; duración de captura en galería acotada a **~20 s** en `NewRequest` (UX, independiente de `maxBytes`).

---

## Legacy: base64 directo a PHP (evitar)

Si algún cliente antiguo aún envía base64:

- PHP: `max_execution_time` / `max_input_time` altos (`docker/php/zz-quira.ini`).
- Nginx: `client_max_body_size`, `client_body_timeout`, `proxy_*_timeout` acordes.
- Timeout cliente ≥ 120–300 s.

Ese camino es el que históricamente cortaba la conexión en 4G mientras se leía `php://input`.

---

## Mapa de código (móvil)

| Área | Archivos |
|------|----------|
| Límites | `src/utils/predictMediaLimits.ts` (+ test) |
| Ticket + PUT | `src/services/uploadService.ts` (+ test) |
| Predict + poll | `src/services/predictService.ts` (+ test) |
| Compresión / red | `videoCompressForPredict.ts`, `videoUploadNetworkHint.ts` |
| UI NewRequest | `src/pages/NewRequest.tsx` |
| Timeouts | `src/config/httpTimeouts.ts` |
