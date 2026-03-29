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

### Compresión moderada en cliente (datos móviles, red lenta o Wi‑Fi con vídeo grande)

Antes de enviar el vídeo a `/predict`, la app puede **re-codificarlo en el dispositivo** cuando:

- Hay **datos móviles** (`cellular`) o **red lenta** (`slow_or_unreliable`) — siempre que no supere el límite de duración (véase abajo), **o**
- Hay **Wi‑Fi** o estado **desconocido** (`unknown`) y el vídeo decodificado pesa **≥ 10 MiB** (`PREDICT_VIDEO_LARGE_BYTES_WIFI_OR_UNKNOWN` en `src/utils/videoCompressForPredict.ts`): se considera fichero **grande** (p. ej. alta resolución o bitrate alto); por debajo de ese umbral en Wi‑Fi/`unknown` **no** se comprime.

El objetivo no es el archivo mínimo, sino **aligerar la subida** sin destruir el contenido para el modelo: resolución máxima ~**960px** de ancho, bitrate moderado (~**2,5 Mbit/s**), audio del vídeo cuando el navegador lo permite — orientado a que modelos multimodales (p. ej. Gemini) sigan entendiendo imagen y sonido.

Implementación: `src/utils/videoCompressForPredict.ts` (canvas + `MediaRecorder`, …). El tamaño “decodificado” del data URL usa **`atob`** para acotar bien el umbral de 10 MiB (el cálculo naïf `length×3/4` falla con padding base64). Si la API no está disponible, el resultado no reduce tamaño o falla el proceso, se **envía el vídeo original**.

El fichero resultante suele ser **WebM (VP8/VP9)** aunque el de cámara fuera MP4/MOV: el backend/Gemini debe aceptar ese contenedor para la ruta `/predict` o rechazar con mensaje claro.

**Límite de duración (solo vídeos muy largos):** no se intenta la compresión en cliente si el vídeo dura **más de ~5 minutos** (`PREDICT_VIDEO_MAX_DURATION_COMPRESS_SEC`), para evitar memoria/tiempo excesivos en el móvil. Los vídeos **cortos** **sí** pueden comprimirse cuando la red es móvil/lenta.

## Mejoras a medio plazo

- Recibir el vídeo por **multipart** o **URL firmada** a almacenamiento objeto, y que `/predict` solo reciba la referencia: menos tiempo bloqueando PHP y menos RAM.
