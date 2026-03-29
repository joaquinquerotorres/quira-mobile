# Backend: `/predict` con vídeo grande y redes lentas

La app envía `POST /api/predict` con un JSON que incluye `video` en **base64** (el payload supera el tamaño del fichero ~33 %). En **4G** la subida puede durar **varios minutos** antes de que PHP empiece a procesar.

Si PHP tiene `max_execution_time = 30`, el contador suele empezar al iniciar la petición y **sigue corriendo mientras se lee `php://input`**. Resultado típico:

```text
FatalError: Maximum execution time of 30 seconds exceeded
… file_get_contents('php://input')
```

El cliente entonces ve **Axios `ERR_NETWORK`** sin cuerpo de respuesta (conexión cortada).

## Qué ajustar (Symfony / PHP)

1. **Solo en la acción `/predict`** (no en todo el proyecto):
   - `set_time_limit(300)` o `0` al entrar en el controlador.
   - Si usas `php.ini` por virtualhost: `max_execution_time` y **`max_input_time`** altos para esa ruta (p. ej. 300–600).
2. **php-fpm** (`www.conf` o pool):
   - `request_terminate_timeout` ≥ tiempo máximo que quieras permitir (p. ej. 300s), o `0` con cuidado.

## Proxy / servidor web (Nginx)

- `client_max_body_size` suficiente para el JSON (p. ej. `50m` o más).
- `client_body_timeout` alto (tiempo para **subir** el cuerpo; p. ej. 300s).
- Si hay `proxy_pass` a PHP: `proxy_read_timeout` y `proxy_send_timeout` acordes.

## Apache + mod_php

- `TimeOut` (segundos de espera de lectura del cuerpo).
- `LimitRequestBody` si aplica.

## App móvil (recomendado)

- Para `POST /api/predict` con vídeo, usar **timeout explícito** en el cliente (p. ej. **120 000–300 000 ms**), no el default corto de algunas pilas.
- En este repo: `PREDICT_REQUEST_TIMEOUT_MS` en `src/config/httpTimeouts.ts` (**300 000 ms** = 5 min) y se pasa a `api.post('/predict', …, { timeout: … })` desde `NewRequest.tsx`.

### Compresión moderada en cliente (solo red “lenta”)

Antes de enviar el vídeo a `/predict`, la app puede **re-codificarlo en el dispositivo** solo si la red se considera limitada:

- **Sí comprimir:** `cellular` (datos móviles) o `slow_or_unreliable` (heurística de red lenta en entornos sin detalle nativo).
- **No comprimir:** Wi‑Fi ni estado `unknown` (no degradar sin señal clara).

Implementación: `src/utils/videoCompressForPredict.ts` (canvas + `MediaRecorder`, ancho máx. ~854px, ~2,2 Mbit/s, mantiene audio del fichero cuando el navegador expone `captureStream` en el `<video>`). Si la API no está disponible, el resultado no reduce tamaño o falla el proceso, se **envía el vídeo original**.

El fichero resultante suele ser **WebM (VP8/VP9)** aunque el de cámara fuera MP4/MOV: el backend/Gemini debe aceptar ese contenedor para la ruta `/predict` o rechazar con mensaje claro.

Límite práctico: no se intenta comprimir en cliente si el vídeo supera **~5 minutos** de duración (`PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC`): en ese caso se envía el original (la compresión cliente es sobre todo para no bloquear la subida en 4G).

## Mejoras a medio plazo

- Recibir el vídeo por **multipart** o **URL firmada** a almacenamiento objeto, y que `/predict` solo reciba la referencia: menos tiempo bloqueando PHP y menos RAM.
