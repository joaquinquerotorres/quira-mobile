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

## Otras rutas

Listado más amplio: **[ARQUITECTURA.md](./ARQUITECTURA.md)**.
