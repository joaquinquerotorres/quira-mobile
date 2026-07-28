# Flujo híbrido: media → Supabase → `/predict` por URL

La app **ya no** envía vídeo/audio/imagen en base64 dentro de `POST /api/predict`. Ese camino hinchaba el JSON (~+33 %), saturaba PHP en **4G** y provocaba timeouts/`ERR_NETWORK`.

## Flujo actual (recomendado)

```text
1) Cliente: opcionalmente comprime el vídeo
2) Cliente: POST /api/upload-ticket/request-media → signedUrl + publicUrl
3) Cliente: PUT binario a signedUrl (Supabase) — con progreso UI
4) Cliente: POST /api/predict { imageUrl | audioUrl | videoUrl, description?, location? }
5) Backend: crea PredictTask + Messenger (AnalyzePredictMessage)
   - sync (default): procesa en la misma petición → 200 { taskId, status, result }
   - async: 202 { taskId, status } → cliente hace poll GET /api/predict/tasks/{id}
6) Worker/handler: descarga media desde Supabase (anti-SSRF), llama a Gemini, guarda result
7) Publicar: reutiliza las mismas publicUrl (sin re-subir el media principal)
```

### Endpoints

| Método | Ruta | Rol |
|--------|------|-----|
| POST | `/api/upload-ticket/request-media` | Ticket firmado (`type`, `contentType`) |
| POST | `/api/predict` | Body JSON pequeño con `*Url` (preferido) o legacy base64 |
| GET | `/api/predict/tasks/{publicId}` | Estado / resultado de la tarea |

Campos preferidos en `POST /api/predict`: `description`, `location`, `imageUrl`, `audioUrl`, `videoUrl` (HTTPS del bucket de requests de Supabase).

Legacy (compatibilidad): `image` / `audio` / `video` en base64 o Data URL → análisis **síncrono** sin tarea. La app móvil ya no lo usa.

### Messenger

En `config/packages/messenger.yaml`, `App\Message\AnalyzePredictMessage` va a **`async`**.

En Railway hace falta un segundo servicio con `CONTAINER_ROLE=worker` (misma imagen Dockerfile). Detalle: `quira/docs/DEPLOY.md` §4b.

Sin worker: `POST /predict` responde `202` y el cliente hace polling, pero la tarea no avanza.

Migración: tabla `predict_task` (`Version20260727210000`). Con `RUN_MIGRATIONS=1` en el entrypoint de Docker/Railway se aplica al boot (solo en el servicio **web**).

### Anti-SSRF

`PredictMediaFetcher` solo acepta URLs que empiecen por  
`{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET_REQUESTS}/`.

## Timeouts (app)

| Constante | Valor | Uso |
|-----------|-------|-----|
| `PREDICT_REQUEST_TIMEOUT_MS` | 120 000 | POST `/predict` (espera Gemini o arranque de tarea) |
| `PREDICT_POLL_INTERVAL_MS` | 1 500 | Entre GET de tarea |
| `PREDICT_POLL_TIMEOUT_MS` | 180 000 | Tope total de polling tras 202 |

Implementación cliente: `src/services/predictService.ts`, `src/services/uploadService.ts`, `NewRequest.tsx`.

## Compresión de vídeo (antes del PUT a Supabase)

La app puede **re-codificar** en el dispositivo cuando:

- Hay **datos móviles** (`cellular`) o **red lenta** (`slow_or_unreliable`), **o**
- Hay **Wi-Fi** / `unknown` y el vídeo decodificado pesa **≥ 10 MiB**.

Objetivo: aligerar la subida a Supabase sin destruir el contenido para Gemini (~960px, ~2,5 Mbit/s). Ver `src/utils/videoCompressForPredict.ts`.

Límites: duración máx. para comprimir (~5 min web / ~120 s nativo); tope de bytes decodificados para evitar OOM. Si falla, se sube el original.

El fichero comprimido suele ser **WebM**; el ticket usa `contentType` para la extensión.

## Legacy: base64 directo a PHP (evitar)

Si algún cliente antiguo aún envía base64:

- PHP necesita `max_execution_time` / `max_input_time` altos (`docker/php/zz-quira.ini`).
- Nginx: `client_max_body_size`, `client_body_timeout`, `proxy_*_timeout` acordes.
- Timeout cliente ≥ 120–300 s.

Ese camino es el que históricamente cortaba la conexión en 4G mientras se leía `php://input`.
