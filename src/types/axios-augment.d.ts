import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** Si es true, un 401 no redirige a /login (verify, reset password, etc.). */
    skipAuthRedirect?: boolean;
  }
}
