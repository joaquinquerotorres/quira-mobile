import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonLoading,
  IonAlert,
} from '@ionic/react';
import { Link } from 'react-router-dom';
import { logInOutline, eyeOutline, eyeOffOutline, logoGoogle, logoApple } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/capacitor';
import api from '../api/axios';
import {
  axiosErrorUserHint,
  getBackendErrorMessage,
} from '../api/axiosErrorDebug';
import './Login.css';

/** Sign in with Apple solo aplica en la app nativa iOS (no en Android). */
const canUseAppleSignIn = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

/**
 * ID token para el backend: primero el de la credencial OAuth (si viene),
 * luego getIdToken sin forzar refresh (más estable justo tras el sign-in),
 * y por último con refresh forzado.
 */
/**
 * Android: ApiException / código 10 = DEVELOPER_ERROR (SHA-1 u OAuth no alineados con Firebase).
 * El plugin suele devolver message "10" o "10: ".
 */
function isGoogleDeveloperConfigurationError(err: unknown): boolean {
  const e = err as {
    message?: string;
    nativeMessage?: string;
    code?: string | number;
  };
  const msg = `${e.message ?? ''}`.trim();
  const native = `${e.nativeMessage ?? ''}`;
  if (msg === '10' || /^10\s*:/.test(msg)) return true;
  if (native.includes('ApiException: 10') || native.includes('statusCode=10')) {
    return true;
  }
  if (e.code === 10 || e.code === '10') return true;
  return false;
}

async function resolveSocialIdToken(
  FirebaseAuthentication: typeof import('@capacitor-firebase/authentication').FirebaseAuthentication,
  signInResult: { credential?: { idToken?: string } | null },
): Promise<string> {
  const fromCredential = signInResult.credential?.idToken;
  if (typeof fromCredential === 'string' && fromCredential.length > 20) {
    return fromCredential;
  }
  try {
    const t = await FirebaseAuthentication.getIdToken({ forceRefresh: false });
    if (t.token) return t.token;
  } catch {
    /* continuar */
  }
  const t2 = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
  if (!t2.token) {
    throw new Error('No se pudo obtener el token de seguridad.');
  }
  return t2.token;
}

const Login: React.FC = () => {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicialización
  useEffect(() => {
    const checkUser = async () => {
        if (!Capacitor.isNativePlatform()) return;
        try {
          const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
          const result = await FirebaseAuthentication.getCurrentUser();
          if (result.user) {
            // Usuario ya autenticado en Firebase
          }
        } catch {
          // Fuera de app nativa (p. ej. CI con jsdom) o sin plugin: no bloqueamos el login por email.
        }
    };
    checkUser();
  }, []);

  // --- LOGIN EMAIL/PASS ---
  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/login_check', {
        username: email, 
        password: password
      });

      await processLoginSuccess(response.data.token, email);
      
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 403 && axiosErr.response?.data?.message) {
        setError(axiosErr.response.data.message);
      } else {
        setError('Credenciales incorrectas o error de conexión');
      }
      setLoading(false);
    }
  };

  // --- LOGIN SOCIAL---
  const handleSocialLogin = async (provider: 'GOOGLE' | 'APPLE') => {
    setLoading(true);
    setError(null);

    try {
        if (!Capacitor.isNativePlatform()) {
          throw new Error(
            'El inicio de sesión con Google o Apple solo está disponible en la app para Android e iOS.',
          );
        }

        if (provider === 'APPLE' && !canUseAppleSignIn()) {
          throw new Error('Apple Sign-In solo está disponible en la app para iPhone e iPad.');
        }

        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
        // 1. Login nativo y 2. ID token (credencial OAuth → getIdToken sin refresh → con refresh)
        let signInResult: { credential?: { idToken?: string } | null };
        if (provider === 'GOOGLE') {
            // Android: el Credential Manager por defecto suele devolver "No credentials available" si no
            // hay credenciales guardadas para ese flujo. El flujo clásico con selector de cuenta es más fiable.
            if (Capacitor.getPlatform() === 'android') {
              signInResult = await FirebaseAuthentication.signInWithGoogle({
                useCredentialManager: false,
              });
            } else {
              signInResult = await FirebaseAuthentication.signInWithGoogle();
            }
        } else {
            signInResult = await FirebaseAuthentication.signInWithApple();
        }

        const idToken = await resolveSocialIdToken(
          FirebaseAuthentication,
          signInResult,
        );

        // 3. Enviamos el token al backend (sin JWT antiguo: evita 401/conflictos al verificar el ID token).
        const backendResponse = await api.post(
          '/social/login',
          {
            token: idToken,
            provider,
          },
          { skipAuthHeader: true, skipAuthRedirect: true },
        );

        // 4. Procesar respuesta del Backend
        const { token, user } = backendResponse.data;
        
        // Guardamos y redirigimos
        localStorage.setItem('quira_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Forzamos recarga o usamos router para limpiar estados
        window.location.href = '/request-list';

    } catch (err: unknown) {
        console.error("Error Social Login:", err);

        // Filtro para cuando el usuario le da a "Cancelar" en la ventana de Google/Apple
        const errObj = err as {
          message?: string;
          nativeMessage?: string;
          code?: string;
        };
        const isUserCancel =
          errObj?.message?.includes('canceled') ||
          errObj?.message?.includes('cancelled') ||
          errObj?.code === 'auth/popup-closed-by-user';

        if (isUserCancel) {
            setError(null); // No mostramos error si el usuario canceló voluntariamente
        } else {
            const rawMessage = String(
              errObj?.message ?? errObj?.nativeMessage ?? '',
            );
            const backendMsg = getBackendErrorMessage(err);
            const networkHint = axiosErrorUserHint(err);
            if (
              rawMessage.includes('No credentials available') ||
              rawMessage.includes('GetCredentialException')
            ) {
              setError(
                'Google no pudo mostrar cuentas en este dispositivo. Comprueba que tengas una cuenta de Google configurada, Play Store actualizado y vuelve a intentarlo; también puedes entrar con email y contraseña.',
              );
            } else if (
              provider === 'GOOGLE' &&
              isGoogleDeveloperConfigurationError(err)
            ) {
              setError(
                'Google Sign-In falló por configuración (código 10). Añade en Firebase Console la huella SHA-1 del keystore con el que firmas la app (en proyecto Android: `./gradlew signingReport`), descarga de nuevo `google-services.json`, sustituye `android/app/google-services.json` y vuelve a compilar. En emulador suele ser el keystore de depuración de Android Studio.',
              );
            } else if (
              rawMessage.includes('Apple Sign-In solo está disponible') ||
              rawMessage.includes('solo está disponible en la app para Android e iOS')
            ) {
              setError(rawMessage);
            } else {
              setError(
                backendMsg ??
                  networkHint ??
                  `Error al iniciar sesión con ${provider === 'GOOGLE' ? 'Google' : 'Apple'}`,
              );
            }
            // Reporte explícito para diagnosticar fallos de login social en dispositivo.
            Sentry.captureException(err, {
              tags: {
                area: 'auth',
                flow: 'social-login',
                provider,
              },
              extra: {
                code: errObj?.code,
                message: errObj?.message,
                nativeMessage: errObj?.nativeMessage,
                nativeStack: (err as { nativeStack?: string })?.nativeStack,
              },
            });
        }
    } finally {
        setLoading(false);
    }
  };

  // Helper para reutilizar lógica
  const processLoginSuccess = async (token: string, userEmail: string) => {
      localStorage.setItem('quira_token', token);

      try {
          const userResponse = await api.get(`/users?email=${userEmail}`);
          const members = userResponse.data['hydra:member'] || userResponse.data['member'];
          
          if (members && members.length > 0) {
              const userData = members[0];
              localStorage.setItem('user', JSON.stringify(userData));
              window.location.href = '/request-list';
          } else {
              throw new Error("Perfil no encontrado");
          }
      } catch (e) {
          setError("Error recuperando perfil de usuario");
          setLoading(false);
      }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="ion-padding login-content">
        
        <div className="login-header">
            <div className="login-logo">
                <span className="login-logo-text-indigo">Qu</span>
                <span className="login-logo-text-indigo login-logo-i-wrapper">
                    i<span className="login-smart-dot-big"></span>
                </span>
                <span className="login-logo-text-indigo">r</span>
                <span className="login-logo-text-orange">a</span>
            </div>
            <p className="login-slogan">Tú descansa, Quira se encarga.</p>
        </div>

        <div className="login-form-container">
            <div className="login-input-group">
                <IonInput 
                    type="email" 
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onIonInput={e => setEmail(e.detail.value!)}
                />
            </div>

            <div className="login-input-group login-password-group">
                <IonInput 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Contraseña"
                    value={password}
                    onIonInput={e => setPassword(e.detail.value!)}
                />
                <IonIcon 
                    icon={showPassword ? eyeOffOutline : eyeOutline} 
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-password-toggle"
                />
            </div>
            <div className="login-forgot-wrap">
                <Link to="/forgot-password" className="login-forgot-link">
                    Recuperar contraseña
                </Link>
            </div>

            <IonButton 
                expand="block" 
                color="primary" 
                className="login-btn"
                onClick={handleLogin}
                disabled={loading}
            >
                {loading ? <IonSpinner name="crescent" color="light" /> : (
                    <>
                        <IonIcon slot="start" icon={logInOutline} />
                        Entrar
                    </>
                )}
            </IonButton>

            <div className="login-divider">
                <span>O CON TUS REDES</span>
            </div>

            {/* --- BOTONES SOCIALES --- */}
            <div className="login-social-grid">
                <button className="login-social-btn google" onClick={() => handleSocialLogin('GOOGLE')} disabled={loading}>
                    <IonIcon icon={logoGoogle} />
                    <span>Google</span>
                </button>

                {canUseAppleSignIn() ? (
                  <button className="login-social-btn apple" onClick={() => handleSocialLogin('APPLE')} disabled={loading}>
                    <IonIcon icon={logoApple} />
                    <span>Apple</span>
                  </button>
                ) : null}
            </div>

            <div className="login-divider" style={{marginTop: '20px'}}>
                <span>¿ERES NUEVO?</span>
            </div>

            <IonButton 
                expand="block" 
                fill="outline" 
                color="primary" 
                className="login-register-btn"
                routerLink="/register"
            >
                Regístrate con Email
            </IonButton>

            <p className="login-legal-hint" style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
              <a
                href="https://quira.app/privacidad/index.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#4f46e5', fontWeight: 600 }}
              >
                Privacidad y protección de datos
              </a>
            </p>

            <IonLoading isOpen={loading && !error} message="Iniciando sesión..." />
            <IonAlert
              isOpen={!!error}
              header="Inicio de sesión"
              message={error ?? ''}
              buttons={[
                {
                  text: 'Entendido',
                  role: 'confirm',
                  handler: () => setError(null),
                },
              ]}
              onDidDismiss={() => setError(null)}
            />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;