import React, { useState, useEffect } from 'react';
import { 
  IonContent, IonPage, IonInput, IonButton, IonIcon, 
  IonSpinner, IonToast, IonLoading
} from '@ionic/react';
import { Link } from 'react-router-dom';
import { logInOutline, eyeOutline, eyeOffOutline, logoGoogle, logoApple } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/capacitor';
import api from '../api/axios'; 
import './Login.css';

/** Sign in with Apple solo aplica en la app nativa iOS (no en Android). */
const canUseAppleSignIn = () =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

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
        // 1. Ejecutar el login nativo
        if (provider === 'GOOGLE') {
            // Android: el Credential Manager por defecto suele devolver "No credentials available" si no
            // hay credenciales guardadas para ese flujo. El flujo clásico con selector de cuenta es más fiable.
            if (Capacitor.getPlatform() === 'android') {
              await FirebaseAuthentication.signInWithGoogle({
                useCredentialManager: false,
              });
            } else {
              await FirebaseAuthentication.signInWithGoogle();
            }
        } else {
            await FirebaseAuthentication.signInWithApple();
        }

        // 2. OBTENCIÓN SEGURA DEL TOKEN (La clave del éxito)
        // En lugar de confiar en el resultado del signIn, pedimos explícitamente 
        // el token actual al SDK. Esto garantiza que es un ID TOKEN válido y no ha caducado.
        const tokenResult = await FirebaseAuthentication.getIdToken();
        const idToken = tokenResult.token;

        if (!idToken) throw new Error("No se pudo obtener el token de seguridad.");


        // 3. Enviamos el token a Symfony
        const backendResponse = await api.post('/social/login', {
            token: idToken,
            provider: provider // Enviamos qué proveedor es
        });

        // 4. Procesar respuesta del Backend
        const { token, user } = backendResponse.data;
        
        // Guardamos y redirigimos
        localStorage.setItem('quira_token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Forzamos recarga o usamos router para limpiar estados
        window.location.href = '/request-list';

    } catch (err: any) {
        console.error("Error Social Login:", err);

        // Filtro para cuando el usuario le da a "Cancelar" en la ventana de Google/Apple
        const isUserCancel =
          err?.message?.includes('canceled') ||
          err?.message?.includes('cancelled') ||
          err?.code === 'auth/popup-closed-by-user';

        if (isUserCancel) {
            setError(null); // No mostramos error si el usuario canceló voluntariamente
        } else {
            const rawMessage = String(
              err?.message ?? err?.nativeMessage ?? '',
            );
            if (
              rawMessage.includes('No credentials available') ||
              rawMessage.includes('GetCredentialException')
            ) {
              setError(
                'Google no pudo mostrar cuentas en este dispositivo. Comprueba que tengas una cuenta de Google configurada, Play Store actualizado y vuelve a intentarlo; también puedes entrar con email y contraseña.',
              );
            } else if (
              rawMessage.includes('Apple Sign-In solo está disponible') ||
              rawMessage.includes('solo está disponible en la app para Android e iOS')
            ) {
              setError(rawMessage);
            } else {
              setError(
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
                code: err?.code,
                message: err?.message,
                nativeMessage: err?.nativeMessage,
                nativeStack: err?.nativeStack,
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
            {error && <div className="login-error-message">{error}</div>}

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
            <IonToast 
                isOpen={!!error} 
                message={error || ''} 
                duration={3000} 
                color="danger"
                position="top"
                onDidDismiss={() => setError(null)}
            />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;