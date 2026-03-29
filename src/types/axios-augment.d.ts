import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** No enviar Authorization (p. ej. POST /social/login con token de Firebase). */
    skipAuthHeader?: boolean;
    /** Ante 401, no redirigir a login (p. ej. credenciales sociales rechazadas). */
    skipAuthRedirect?: boolean;
  }
}
