import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonIcon, IonItem, IonLabel, IonToggle, 
  IonButton, useIonViewWillEnter, IonList, IonModal,
  IonHeader, IonToolbar, IonTitle, IonButtons, IonInput, IonTextarea, 
  IonSelect, IonSelectOption, IonSpinner, IonToast, useIonRouter,
  IonBadge, IonRange
} from '@ionic/react';
import { 
  personOutline, logOutOutline, closeOutline, chevronBackOutline, 
  notificationsOutline, shieldCheckmarkOutline, briefcaseOutline, documentTextOutline,
  starOutline,
  hammerOutline, receiptOutline, chevronForwardOutline, calendarOutline, cameraOutline,
  saveOutline, checkmarkCircle, flashOutline, star, callOutline, 
  trendingUpOutline, locationOutline, optionsOutline, navigateOutline,
  informationCircleOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  mailOutline,
  refreshOutline,
} from 'ionicons/icons';
import GooglePlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { Geolocation } from '@capacitor/geolocation';
import api from '../api/axios';
import { resendVerificationEmail } from '../api/verifyEmailApi';
import { uploadAvatarWithTicket } from '../services/uploadService';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { formatRequestPriceRangeEuros } from '../utils/requestPriceRange';
import { streetLineFromGeocode } from '../utils/streetLineFromGeocode';
import { getEffectiveActiveMode, hasProfessionalProfile } from '../utils/activeMode';
import './Profile.css';
import { LogoHeader } from '../components/layout/LogoHeader';
import '../components/layout/LogoHeader.css';

import { env } from '../config/env';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import {
  getEffectiveTier,
  resolvePaidThroughAt,
  isDowngradedDueToExpiredPayment,
} from '../utils/effectiveTier';
import { refreshCurrentUserInStorage } from '../utils/refreshCurrentUser';
import { SESSION_KEY_DOWNGADE_DISMISSED } from '../components/DowngradeBanner';
import { CATEGORY_OPTIONS } from '../utils/categoryLabels';

const SESSION_KEY_SUBSCRIPTION_CANCEL_REQUESTED = 'quira_subscription_cancel_requested';

const serverUrl = env.serverUrl;
const GOOGLE_API_KEY = env.googleMapsKey;

function comparablePhone(raw: string | undefined | null): string {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

const Profile: React.FC = () => {
  const router = useIonRouter();
  const [user, setUser] = useState<any>(null);
  
  // Estado de roles
  const [isPro, setIsPro] = useState(false);
  const [currentTier, setCurrentTier] = useState<'CLIENT' | 'FREE' | 'SOLVER' | 'PRO'>('CLIENT');

  const [showEditModal, setShowEditModal] = useState(false);
  // --- NUEVO: Controla cuándo el modal ya es visible para cargar el mapa ---
  const [modalReady, setModalReady] = useState(false); 

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Estados para Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Formulario de edición
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [clientPhoneNumber, setClientPhoneNumber] = useState('');
  const [professionalPhoneNumber, setProfessionalPhoneNumber] = useState('');
  const [taxId, setTaxId] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  // ESTADOS DE UBICACIÓN Y MAPA
  const [address, setAddress] = useState<string>('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(30);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<google.maps.Map | null>(null);
  const serviceCircle = useRef<google.maps.Circle | null>(null);

  // Historial: 2 modales separados (pro / cliente)
  const [showHistoryProModal, setShowHistoryProModal] = useState(false);
  const [showHistoryClientModal, setShowHistoryClientModal] = useState(false);
  const [history, setHistory] = useState<any[]>([]);           // Trabajos que he completado (como pro)
  const [historyAsClient, setHistoryAsClient] = useState<any[]>([]); // Trabajos que me han hecho (como cliente)
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Cambio de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Verificación de teléfono por código (profile indica cuál se está verificando)
  const [showPhoneVerifyModal, setShowPhoneVerifyModal] = useState(false);
  const [phoneVerifyProfile, setPhoneVerifyProfile] = useState<'client' | 'professional'>('client');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  /** Solo cuenta cliente: evita reenviar SMS en cada guardado si el número no cambió (una vez por apertura del editor). */
  const soloClientSmsSentRef = useRef(false);

  // Suscripción cancelada (mostrar hasta fin de periodo + opción reactivar)
  const [subscriptionCancelRequested, setSubscriptionCancelRequested] = useState(false);

  useIonViewWillEnter(() => {
    loadUserFromStorage();
    refreshUserFromApi();
  });

  useEffect(() => {
    if (showEditModal) {
      soloClientSmsSentRef.current = false;
    }
  }, [showEditModal]);

  const loadUserFromStorage = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        const tier = getEffectiveTier(parsedUser);
        const viewingAsPro =
          getEffectiveActiveMode() === 'pro' && hasProfessionalProfile(parsedUser);
        setCurrentTier(viewingAsPro ? tier : 'CLIENT');
        setIsPro(viewingAsPro);
        const paidIso = resolvePaidThroughAt(parsedUser);
        const paidThrough = paidIso ? new Date(paidIso) : null;
        const periodExpired = paidThrough != null && paidThrough <= new Date();
        // Fuente de verdad: backend subscriptionCancelAtPeriodEnd. Si no existe, usamos sessionStorage (cancelación desde esta sesión).
        if (parsedUser.subscriptionCancelAtPeriodEnd === true) {
          sessionStorage.setItem(SESSION_KEY_SUBSCRIPTION_CANCEL_REQUESTED, '1');
          setSubscriptionCancelRequested(true);
        } else if (parsedUser.subscriptionCancelAtPeriodEnd === false || periodExpired) {
          sessionStorage.removeItem(SESSION_KEY_SUBSCRIPTION_CANCEL_REQUESTED);
          setSubscriptionCancelRequested(false);
        } else {
          setSubscriptionCancelRequested(sessionStorage.getItem(SESSION_KEY_SUBSCRIPTION_CANCEL_REQUESTED) === '1');
        }
    }
  };

  /** Refresca el usuario desde la API para paidThroughAt, subscriptionCancelAtPeriodEnd, etc. */
  const refreshUserFromApi = async () => {
    const ok = await refreshCurrentUserInStorage();
    if (ok) loadUserFromStorage();
  };

  // --- CÁLCULO DE ZOOM (mantiene el mapa cercano, evita alejarse demasiado) ---
  const getZoomForRadius = (radius: number) => {
      if (radius <= 5) return 13;
      if (radius <= 10) return 12;
      if (radius <= 15) return 11;
      if (radius <= 25) return 10;
      if (radius <= 50) return 9;
      if (radius <= 80) return 9;
      if (radius <= 100) return 8;
      return 8;
  };

  // --- LÓGICA DE MAPA REACTIVA ---
  useEffect(() => {
    // Solo cargamos el mapa si el modal está LISTO (evita pantalla gris)
    if (modalReady && isPro && mapRef.current) {
        const initialPos = coords || { lat: 37.888, lng: -4.779 }; // Córdoba default
        
        if (!googleMap.current) {
            // Inicializar Mapa
            googleMap.current = new google.maps.Map(mapRef.current, {
                center: initialPos,
                zoom: getZoomForRadius(serviceRadiusKm),
                disableDefaultUI: true,
                gestureHandling: 'none', // Evita que el usuario mueva el mapa, solo visual
                styles: []
            });

            // Inicializar Círculo
            serviceCircle.current = new google.maps.Circle({
                strokeColor: "#4f46e5",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#4f46e5",
                fillOpacity: 0.2,
                map: googleMap.current,
                center: initialPos,
                radius: serviceRadiusKm * 1000,
            });
        } else {
            // Actualizar Mapa Existente (Reactivo al mover el slider)
            google.maps.event.trigger(googleMap.current, "resize"); // Previene gris si cambia tamaño
            googleMap.current.setCenter(initialPos);
            googleMap.current.setZoom(getZoomForRadius(serviceRadiusKm)); // Zoom ajustado manualmente

            if (serviceCircle.current) {
                serviceCircle.current.setCenter(initialPos);
                serviceCircle.current.setRadius(serviceRadiusKm * 1000);
            }
        }
    }
  }, [modalReady, isPro, coords, serviceRadiusKm]); // Se ejecuta cuando 'modalReady' es true o cambia el radio

  const openHistoryPro = async () => {
    setShowHistoryProModal(true);
    setLoadingHistory(true);
    try {
      const response = await api.get('/requests?history=true');
      const data = response.data['hydra:member'] || response.data['member'] || [];
      setHistory(data.filter((item: any) => item.status === 'COMPLETED'));
    } catch (error) {
      setToast("Error al cargar el historial");
    } finally {
      setLoadingHistory(false);
    }
  };

  const openHistoryAsClient = async () => {
    setShowHistoryClientModal(true);
    setLoadingHistory(true);
    try {
      const response = await api.get('/requests?my_requests=true');
      const data = response.data['hydra:member'] || response.data['member'] || [];
      setHistoryAsClient(data.filter((item: any) => item.status === 'COMPLETED'));
    } catch (error) {
      setToast("Error al cargar el historial");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.removeItem(SESSION_KEY_DOWNGADE_DISMISSED);
    window.location.href = '/login';
  };

  const handleCancelSubscription = async () => {
    if (!user?.professionalProfile?.id) {
      setToast('No se ha encontrado tu perfil profesional.');
      return;
    }
    try {
      // Backend: cancelar en Stripe (cancel_at_period_end), no modificar paidThroughAt ni roles.
      // Exponer subscriptionCancelAtPeriodEnd: true en /me o usuario para que el front muestre "Reactivar" hasta que se reactive.
      await api.post('/stripe/cancel-subscription', {
        professionalProfileId: user.professionalProfile.id,
      });
      sessionStorage.setItem(SESSION_KEY_SUBSCRIPTION_CANCEL_REQUESTED, '1');
      const updatedUser = { ...user, subscriptionCancelAtPeriodEnd: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSubscriptionCancelRequested(true);
      const paidIso = resolvePaidThroughAt(user);
      const paidThroughLabel = paidIso
        ? new Date(paidIso).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : null;
      setToast(
        paidThroughLabel
          ? `Tu suscripción se cancelará al final del periodo actual (${paidThroughLabel}). Seguirás siendo ${currentTier} hasta entonces.`
          : 'Tu suscripción se cancelará al final del periodo actual. Seguirás teniendo acceso hasta entonces.'
      );
    } catch {
      setToast('No se pudo cancelar la suscripción. Inténtalo de nuevo más tarde.');
    }
  };

  const sendPhoneVerificationSms = async (
    profile: 'client' | 'professional',
    stateUser: typeof user = user
  ) => {
    if (!stateUser) return;
    const phone =
      profile === 'client'
        ? stateUser.clientProfile?.phoneNumber
        : stateUser.professionalProfile?.phoneNumber;

    if (!phone?.trim()) {
      setToast('Añade primero el teléfono en Datos Personales.');
      return;
    }

    try {
      const res = await api.post(
        '/verify/phone/send',
        { profile },
        { skipAuthRedirect: true }
      );
      const data = res?.data as { success?: boolean; skipped?: boolean; reason?: string; message?: string } | undefined;

      if (data?.success && data.skipped && data.reason === 'same_number_already_verified') {
        const nextUser = { ...stateUser };
        if (profile === 'client' && nextUser.clientProfile) {
          nextUser.clientProfile = { ...nextUser.clientProfile, verifiedPhone: true };
        } else if (profile === 'professional' && nextUser.professionalProfile) {
          nextUser.professionalProfile = { ...nextUser.professionalProfile, verifiedPhone: true };
        }
        setUser(nextUser);
        localStorage.setItem('user', JSON.stringify(nextUser));
        setToast(data.message || 'Teléfono ya verificado.');
        return;
      }

      setPhoneVerifyProfile(profile);
      setToast('Te hemos enviado un SMS con un código de verificación (si tu número es válido).');
      setPhoneCode('');
      setShowPhoneVerifyModal(true);
    } catch {
      setToast('No se pudo iniciar la verificación del teléfono. Inténtalo más tarde.');
    }
  };

  const handleConfirmPhoneCode = async () => {
    const trimmed = phoneCode.trim();
    if (!trimmed) {
      setToast('Introduce el código que has recibido por SMS.');
      return;
    }
    if (trimmed.length < 4) {
      setToast('El código parece demasiado corto.');
      return;
    }

    setPhoneVerifyLoading(true);
    try {
      await api.post(
        '/verify/phone/confirm',
        { code: trimmed, profile: phoneVerifyProfile },
        { skipAuthRedirect: true }
      );

      const updatedUser = { ...user! };
      if (phoneVerifyProfile === 'client' && updatedUser.clientProfile) {
        updatedUser.clientProfile = { ...updatedUser.clientProfile, verifiedPhone: true };
      } else if (phoneVerifyProfile === 'professional' && updatedUser.professionalProfile) {
        updatedUser.professionalProfile = { ...updatedUser.professionalProfile, verifiedPhone: true };
      }
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setToast('Teléfono verificado correctamente.');
      setShowPhoneVerifyModal(false);

      if (
        phoneVerifyProfile === 'client' &&
        updatedUser.professionalProfile &&
        !updatedUser.professionalProfile.verifiedPhone &&
        comparablePhone(updatedUser.professionalProfile.phoneNumber || '').length > 0
      ) {
        void sendPhoneVerificationSms('professional', updatedUser);
      }
    } catch {
      setToast('Código incorrecto o expirado. Inténtalo de nuevo.');
    } finally {
      setPhoneVerifyLoading(false);
    }
  };

  const handleResendEmailVerification = async () => {
    if (!user?.email) {
      setToast('No se ha encontrado un email asociado a tu cuenta.');
      return;
    }
    try {
      const data = await resendVerificationEmail();
      setToast(
        data.success
          ? data.message ||
              'Si tu email no estaba verificado, te hemos enviado un correo de verificación.'
          : data.message ||
              'No se pudo enviar el correo de verificación. Inténtalo de nuevo más tarde.',
      );
    } catch {
      setToast('No se pudo enviar el correo de verificación. Inténtalo de nuevo más tarde.');
    }
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) {
      setToast('Introduce tu contraseña actual.');
      return;
    }
    if (!newPassword.trim()) {
      setToast('Introduce la nueva contraseña.');
      return;
    }
    if (newPassword.length < 6) {
      setToast('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast('La confirmación de contraseña no coincide.');
      return;
    }

    setPasswordLoading(true);
    try {
      const userEmail = user?.email;
      if (!userEmail) {
        setToast('No se pudo verificar el usuario.');
        setPasswordLoading(false);
        return;
      }
      // Verificar contraseña actual con login_check antes de cambiar
      await api.post('/login_check', {
        username: userEmail,
        password: currentPassword,
      }, { skipAuthRedirect: true } as any);
      const userId = user?.id;
      await api.patch(`/users/${userId}`, {
        currentPassword: currentPassword,
        plainPassword: newPassword,
      }, { headers: { 'Content-Type': 'application/merge-patch+json' } });
      setToast('Contraseña actualizada correctamente.');
      setShowPasswordModal(false);
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setToast('La contraseña actual no es correcta.');
      } else {
        const msg = error?.response?.data?.['hydra:description']
          ?? error?.response?.data?.message
          ?? 'Error al cambiar la contraseña. Comprueba que la contraseña actual sea correcta.';
        setToast(msg);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const openEditModal = () => {
      if (!user) return;
      setEmail(user.email || '');
      setClientPhoneNumber(user.clientProfile?.phoneNumber || '');
      setProfessionalPhoneNumber(user.professionalProfile?.phoneNumber || '');
      const clientName = user.clientProfile?.fullName || '';
      const proName = user.professionalProfile?.fullName || '';
      const clientAvatar = user.clientProfile?.avatar ?? null;
      const proAvatar = user.professionalProfile?.avatar ?? null;
      setFullName(proName || clientName || user.fullName || '');
      setAvatarUrl(proAvatar || clientAvatar);
      if (user.professionalProfile) {
          const pro = user.professionalProfile;
          setTaxId(pro.taxId || '');
          setBio(pro.bio || '');
          setSkills(pro.skills || []);
          setAddress(pro.address || '');
          setServiceRadiusKm(pro.serviceRadiusKm || 30);
          if (pro.locationPoint?.coordinates) {
              setCoords({ lat: pro.locationPoint.coordinates[1], lng: pro.locationPoint.coordinates[0] });
          }
      }
      setShowEditModal(true);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        setToast("La imagen es demasiado grande (Máx 5MB).");
        return;
    }

    setUploadingAvatar(true);
    try {
        const newUrl = await uploadAvatarWithTicket(file);
        await api.post('/users/avatar', { url: newUrl });
        setAvatarUrl(newUrl);
        const updatedUser = { ...user };
        if (isPro && updatedUser.professionalProfile) {
            updatedUser.professionalProfile.avatar = newUrl;
        } else if (updatedUser.clientProfile) {
            updatedUser.clientProfile.avatar = newUrl;
        }
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setToast("Foto actualizada correctamente");
    } catch (error) {
        setToast("Error al subir la imagen.");
    } finally {
        setUploadingAvatar(false);
    }
  };

  const toggleSkill = (value: string) => {
      if (skills.includes(value)) {
          setSkills(skills.filter(s => s !== value));
      } else {
          setSkills([...skills, value]);
      }
  };

  const getCurrentLocation = async () => {
    try {
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
        });
        const { latitude, longitude } = coordinates.coords;
        setCoords({ lat: latitude, lng: longitude });
        if (GOOGLE_API_KEY) {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`);
            const data = await res.json();
            if (data.results?.[0]) {
               const result = data.results[0];
               const comps = result.address_components;
               const get = (type: string) =>
                 comps.find((c: any) => c.types?.includes(type))?.long_name as string | undefined;
               const province =
                 get('administrative_area_level_2') ||
                 get('administrative_area_level_1');
               const country = get('country');
               const isSpain = country === 'España' || country === 'Spain';
               const isCordoba =
                 province === 'Córdoba' ||
                 province === 'Cordoba';
               if (!(isSpain && isCordoba)) {
                 setToast("Por ahora solo aceptamos direcciones en Córdoba (Andalucía).");
                 setAddress('');
                 setCoords(null);
                 return;
               }
               setAddress(streetLineFromGeocode(result.formatted_address, result));
            }
        } else {
          const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setAddress(fallback);
        }
    } catch (error: any) {
      const code = error?.code || error?.message;
      if (typeof code === 'string' && code.includes('timeout')) {
        setToast('No se pudo obtener la ubicación a tiempo. Intenta de nuevo cerca de una ventana o con el GPS activado.');
      } else {
        setToast("Error al obtener ubicación.");
      }
    }
  };

  const handleAddressSelect = async (value: any) => {
    if (!value) { setAddress(''); setCoords(null); return; }
    try {
      const results = await geocodeByAddress(value.label);
      const result = results[0];
      const comps = (result as any).address_components;
      const get = (type: string) =>
        comps.find((c: any) => c.types?.includes(type))?.long_name as string | undefined;
      const province =
        get('administrative_area_level_2') ||
        get('administrative_area_level_1');
      const country = get('country');
      const isSpain = country === 'España' || country === 'Spain';
      const isCordoba =
        province === 'Córdoba' ||
        province === 'Cordoba';
      if (!(isSpain && isCordoba)) {
        setToast("Por ahora solo aceptamos direcciones en Córdoba (Andalucía).");
        setAddress('');
        setCoords(null);
        return;
      }
      setAddress(streetLineFromGeocode(value.label, result as any));
      const { lat, lng } = await getLatLng(result);
      setCoords({ lat, lng });
    } catch (error) {
      console.error("Geocode error", error);
      setAddress(value.label);
    }
  };

  const saveProfile = async () => {
      if (!fullName.trim()) { setToast("El nombre es obligatorio"); return; }
      if (!email.trim()) { setToast("El email es obligatorio."); return; }
      if (!isPro && user?.clientProfile && !clientPhoneNumber.trim()) { setToast("El teléfono de cliente es obligatorio."); return; }
      if (isPro && user?.professionalProfile && !professionalPhoneNumber.trim()) { setToast("El teléfono de profesional es obligatorio."); return; }
      if (isPro && user?.professionalProfile) {
        if (!bio.trim()) {
          setToast("La biografía es obligatoria para perfil profesional.");
          return;
        }
        if (!address.trim()) {
          setToast("La dirección base es obligatoria para perfil profesional.");
          return;
        }
        if (!skills || skills.length === 0) {
          setToast("Selecciona al menos una especialidad.");
          return;
        }
        if (currentTier === 'PRO' && !taxId.trim()) {
          setToast("El CIF/NIF es obligatorio para cuentas PRO.");
          return;
        }
      }

      setSaving(true);
      try {
          const updatedUser = { ...user! };
          const trimmedEmail = email.trim();
          const emailChanged = trimmedEmail.toLowerCase() !== (user!.email || '').trim().toLowerCase();
          const userId = updatedUser.id;

          const nextClientPhone = clientPhoneNumber.trim();
          const nextProfessionalPhone = professionalPhoneNumber.trim();
          const prevClientPhone = user!.clientProfile ? user!.clientProfile.phoneNumber || '' : '';
          const prevProPhone = user!.professionalProfile ? user!.professionalProfile.phoneNumber || '' : '';
          const clientPhoneChanged = nextClientPhone !== prevClientPhone;
          const professionalPhoneChanged = nextProfessionalPhone !== prevProPhone;
          const shouldAutoVerifyClientPhone =
            clientPhoneChanged &&
            Boolean(user!.professionalProfile?.verifiedPhone) &&
            comparablePhone(nextClientPhone).length > 0 &&
            comparablePhone(nextClientPhone) === comparablePhone(user!.professionalProfile?.phoneNumber);
          const shouldAutoVerifyProfessionalPhone =
            professionalPhoneChanged &&
            Boolean(user!.clientProfile?.verifiedPhone) &&
            comparablePhone(nextProfessionalPhone).length > 0 &&
            comparablePhone(nextProfessionalPhone) === comparablePhone(user!.clientProfile?.phoneNumber);

          if (emailChanged) {
            await api.patch(
              `/users/${userId}`,
              { email: trimmedEmail },
              { headers: { 'Content-Type': 'application/merge-patch+json' } }
            );
            updatedUser.email = trimmedEmail;
            updatedUser.verifiedEmail = false;
          }

          if (!isPro && user!.clientProfile) {
              const clientId = typeof user!.clientProfile === 'object' ? user!.clientProfile.id : (user!.clientProfile as string).split('/').pop();
              const payloadClient = {
                fullName,
                phoneNumber: nextClientPhone,
                ...(shouldAutoVerifyClientPhone ? { verifiedPhone: true } : {}),
              };
              await api.patch(`/client_profiles/${clientId}`, payloadClient, { headers: { 'Content-Type': 'application/merge-patch+json' } });
              updatedUser.clientProfile = { ...updatedUser.clientProfile!, ...payloadClient };
              if (clientPhoneChanged) {
                  updatedUser.clientProfile.verifiedPhone = shouldAutoVerifyClientPhone;
              }
          }

          if (isPro && user!.professionalProfile) {
              const proId = typeof user!.professionalProfile === 'object' ? user!.professionalProfile.id : (user!.professionalProfile as string).split('/').pop();
              const payloadPro = {
                  fullName, taxId, bio, skills, phoneNumber: nextProfessionalPhone, address,
                  serviceRadiusKm: Number(serviceRadiusKm),
                  locationPoint: coords ? { type: 'Point', coordinates: [coords.lng, coords.lat] } : null,
                  ...(shouldAutoVerifyProfessionalPhone ? { verifiedPhone: true } : {}),
              };
              await api.patch(`/professional_profiles/${proId}`, payloadPro, { headers: { 'Content-Type': 'application/merge-patch+json' } });
              updatedUser.professionalProfile = { ...updatedUser.professionalProfile!, ...payloadPro };
              if (professionalPhoneChanged) {
                  updatedUser.professionalProfile.verifiedPhone = shouldAutoVerifyProfessionalPhone;
              }
          }

          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setToast("Perfil actualizado correctamente");
          setShowEditModal(false);
          setModalReady(false);
          googleMap.current = null;

          const clientNeedsSms =
            !isPro &&
            !!user!.clientProfile &&
            !!updatedUser.clientProfile &&
            !updatedUser.clientProfile.verifiedPhone &&
            comparablePhone(nextClientPhone).length > 0 &&
            (
              (clientPhoneChanged && !shouldAutoVerifyClientPhone) ||
              (!user!.professionalProfile && !clientPhoneChanged && !soloClientSmsSentRef.current)
            );

          const proNeedsSms =
            isPro &&
            !!user!.professionalProfile &&
            !!updatedUser.professionalProfile &&
            !updatedUser.professionalProfile.verifiedPhone &&
            comparablePhone(nextProfessionalPhone).length > 0 &&
            professionalPhoneChanged &&
            !shouldAutoVerifyProfessionalPhone;

          if (clientNeedsSms) {
            await sendPhoneVerificationSms('client', updatedUser);
            if (!user!.professionalProfile && !clientPhoneChanged) {
              soloClientSmsSentRef.current = true;
            }
          } else if (proNeedsSms) {
            await sendPhoneVerificationSms('professional', updatedUser);
          }
      } catch (error) {
          const anyErr = error as any;
          const violations = anyErr?.response?.data?.violations as Array<{ propertyPath?: string; message?: string }> | undefined;
          const emailViolation = violations?.find(v => v.propertyPath === 'email');
          if (emailViolation) {
            setToast('Ya existe una cuenta con ese email.');
          } else {
            const hydraMsg = anyErr?.response?.data?.['hydra:description'] as string | undefined;
            setToast(hydraMsg || "Error al guardar los cambios.");
          }
      } finally {
          setSaving(false);
      }
  };

  const getInitials = () => {
      const name = isPro ? user?.professionalProfile?.fullName : user?.clientProfile?.fullName;
      return (name || 'U').charAt(0).toUpperCase();
  };

  const getMainAvatar = () => {
    const avatar = isPro ? user?.professionalProfile?.avatar : user?.clientProfile?.avatar;
    if (avatar) {
        return <img src={resolveMediaUrl(avatar)} alt="Avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}} />;
    }
    return getInitials();
  };

  const getDisplayName = () => {
      return isPro ? user?.professionalProfile?.fullName : user?.clientProfile?.fullName || 'Usuario';
  };

  const navigateToDetail = (itemId: number, asPro: boolean) => {
      setShowHistoryProModal(false);
      setShowHistoryClientModal(false);
      const route = asPro ? `/pro/request/${itemId}` : `/request/${itemId}`;
      router.push(route);
  };

  const renderTierBadge = () => {
      switch (currentTier) {
          case 'PRO':
              return <div className="tier-pill pro"><IonIcon icon={shieldCheckmarkOutline}/> PROFESIONAL</div>;
          case 'SOLVER':
              return <div className="tier-pill solver"><IonIcon icon={flashOutline}/> SOLVER</div>;
          case 'FREE':
              return <div className="tier-pill free"><IonIcon icon={briefcaseOutline}/> STARTER</div>;
          default:
              return <div className="tier-pill client">CLIENTE</div>;
      }
  };

  const subscriptionEndIso = user ? resolvePaidThroughAt(user) : null;
  const showTrialExpiredBanner = Boolean(
    isPro &&
      user &&
      ((subscriptionEndIso != null && new Date(subscriptionEndIso) < new Date()) ||
        isDowngradedDueToExpiredPayment(user)),
  );

  return (
    <IonPage>
      <LogoHeader />

      <IonContent fullscreen style={{'--background': '#f8fafc'}}>
        
        <div className="profile-hero animate__animated animate__fadeIn">
            <div className="profile-avatar" style={{overflow: 'hidden'}}>
                {getMainAvatar()}
            </div>
            
            <h2 className="profile-name">{getDisplayName()}</h2>
            <p className="profile-email">{user?.email}</p>
            <div style={{marginTop: '12px'}}>
                {renderTierBadge()}
            </div>
        </div>

        {showTrialExpiredBanner && (
            <div className="profile-trial-expired-banner" onClick={() => router.push('/become-pro')}>
                <div className="profile-trial-expired-content">
                    <IonIcon icon={flashOutline} />
                    <div>
                        <strong>Tu plan ha caducado</strong>
                        <p>Renueva tu suscripción para mantener tu perfil profesional</p>
                    </div>
                    <IonIcon icon={chevronForwardOutline} />
                </div>
            </div>
        )}

        {isPro && currentTier !== 'PRO' && !showTrialExpiredBanner && (
            <div
                className="profile-trial-expired-banner"
                onClick={() => router.push('/become-pro')}
            >
                <div className="profile-trial-expired-content">
                    <IonIcon icon={trendingUpOutline} />
                    <div>
                        <strong>Mejorar mi plan</strong>
                        <p>Más trabajos y alertas push en tiempo real</p>
                    </div>
                    <IonIcon icon={chevronForwardOutline} />
                </div>
            </div>
        )}

        <div className="profile-section-title">Tu Actividad</div>
        <div className="profile-menu-card">
            {isPro ? (
              <IonItem lines="none" detail={false} button onClick={openHistoryPro} className="menu-item">
                  <div slot="start" className="icon-box icon-blue"><IonIcon icon={hammerOutline} /></div>
                  <IonLabel className="item-label">Trabajos que he completado</IonLabel>
                  <IonIcon slot="end" icon={chevronForwardOutline} color="medium" style={{fontSize: '18px'}} />
              </IonItem>
            ) : (
              <IonItem lines="none" detail={false} button onClick={openHistoryAsClient} className="menu-item">
                  <div slot="start" className="icon-box icon-blue"><IonIcon icon={receiptOutline} /></div>
                  <IonLabel className="item-label">Mis trabajos finalizados</IonLabel>
                  <IonIcon slot="end" icon={chevronForwardOutline} color="medium" style={{fontSize: '18px'}} />
              </IonItem>
            )}
        </div>

        <div className="profile-section-title">Cuenta</div>
        <div className="profile-menu-card">
            <IonItem lines="none" detail={false} button onClick={openEditModal} className="menu-item">
                <div slot="start" className="icon-box icon-gray"><IonIcon icon={personOutline} /></div>
                <IonLabel className="item-label">Datos Personales</IonLabel>
                <IonIcon slot="end" icon={chevronForwardOutline} color="medium" style={{fontSize: '18px'}} />
            </IonItem>
            <div className="menu-separator"></div>
            <IonItem lines="none" detail={false} button onClick={openPasswordModal} className="menu-item">
                <div slot="start" className="icon-box icon-gray"><IonIcon icon={lockClosedOutline} /></div>
                <IonLabel className="item-label">Seguridad y Contraseña</IonLabel>
                <IonIcon slot="end" icon={chevronForwardOutline} color="medium" style={{fontSize: '18px'}} />
            </IonItem>
        </div>

        {(currentTier === 'SOLVER' || currentTier === 'PRO') && (
          <div className="profile-subscription-section">
            <div className="profile-section-title">Suscripción</div>
            <div className="profile-menu-card profile-menu-card--subscription">
              <IonItem lines="none" className="menu-item">
                <div slot="start" className="icon-box icon-orange">
                  <IonIcon icon={briefcaseOutline} />
                </div>
                <IonLabel className="item-label">
                  <div className="profile-verification-title-row">
                    <span>Plan actual</span>
                    <span className={`profile-verification-pill ${subscriptionCancelRequested ? 'profile-verification-pill--warn' : 'profile-verification-pill--ok'}`}>
                      {currentTier === 'PRO' ? 'PRO' : 'SOLVER'}
                    </span>
                  </div>
                  <div className="profile-verification-sub">
                    {subscriptionCancelRequested ? (
                      subscriptionEndIso ? (
                        <>Tu suscripción está cancelada. Seguirás teniendo acceso {currentTier} hasta el{' '}
                          {new Date(subscriptionEndIso).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}. A partir de entonces pasarás a Free.</>
                      ) : (
                        'Tu suscripción está cancelada. Seguirás teniendo acceso hasta el final del periodo actual; después pasarás a Free.'
                      )
                    ) : subscriptionEndIso ? (
                      `Activo hasta el ${new Date(subscriptionEndIso).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}. A partir de entonces tu cuenta pasará a Free.`
                    ) : (
                      'Tu suscripción está activa. Si la cancelas, al final del periodo actual tu cuenta pasará a Free.'
                    )}
                  </div>
                  {subscriptionCancelRequested ? (
                    <button
                      type="button"
                      className="profile-verification-link-btn"
                      onClick={() => router.push('/become-pro')}
                    >
                      Reactivar suscripción
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="profile-verification-link-btn"
                      onClick={handleCancelSubscription}
                    >
                      Cancelar suscripción
                    </button>
                  )}
                </IonLabel>
              </IonItem>
            </div>
          </div>
        )}

        <div className="profile-section-title">Preferencias</div>
        <div className="profile-menu-card">
            <IonItem lines="none" detail={false} button routerLink="/profile/reviews" className="menu-item">
                <div slot="start" className="icon-box icon-orange"><IonIcon icon={starOutline} /></div>
                <IonLabel className="item-label">Valoraciones</IonLabel>
                <IonIcon slot="end" icon={chevronForwardOutline} color="medium" style={{fontSize: '18px'}} />
            </IonItem>
            <div className="menu-separator"></div>
            <IonItem lines="none" detail={false} button routerLink="/profile/notifications" className="menu-item">
                <div slot="start" className="icon-box icon-gray"><IonIcon icon={notificationsOutline} /></div>
                <IonLabel className="item-label">Notificaciones</IonLabel>
                <IonIcon slot="end" icon={chevronForwardOutline} color="medium" style={{fontSize: '18px'}} />
            </IonItem>
            <div className="menu-separator"></div>
            <IonItem
              lines="none"
              detail={false}
              button
              href="https://quira.app/privacidad/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="menu-item"
            >
                <div slot="start" className="icon-box icon-blue"><IonIcon icon={shieldCheckmarkOutline} /></div>
                <IonLabel className="item-label">Privacidad y datos (RGPD)</IonLabel>
                <IonIcon slot="end" icon={chevronForwardOutline} color="medium" style={{fontSize: '18px'}} />
            </IonItem>
            {!isPro && !hasProfessionalProfile(user) && (
                <>
                    <div className="menu-separator"></div>
                    <IonItem lines="none" detail={false} button routerLink="/become-pro" className="menu-item">
                        <div slot="start" className="icon-box icon-orange"><IonIcon icon={briefcaseOutline} /></div>
                        <IonLabel className="item-label" style={{color: '#ea580c'}}>¡Quiero trabajar!</IonLabel>
                        <IonIcon slot="end" icon={chevronForwardOutline} color="medium" style={{fontSize: '18px'}} />
                    </IonItem>
                </>
            )}
        </div>

        <IonButton expand="block" fill="clear" className="logout-button" onClick={handleLogout}>
            <IonIcon slot="start" icon={logOutOutline} /> CERRAR SESIÓN
        </IonButton>

        {/* MODAL HISTORIAL: Trabajos que he completado (como pro) */}
        <IonModal isOpen={showHistoryProModal} onDidDismiss={() => setShowHistoryProModal(false)} initialBreakpoint={0.75} breakpoints={[0, 0.75, 1]}>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle style={{fontWeight: 900}}>Trabajos que he completado</IonTitle>
                    <IonButtons slot="end"><IonButton onClick={() => setShowHistoryProModal(false)} color="medium"><IonIcon icon={closeOutline} /></IonButton></IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{'--background': '#f8fafc'}}>
                {loadingHistory ? (
                    <div style={{textAlign:'center', marginTop:'40px'}}><IonSpinner name="crescent"/></div>
                ) : history.length > 0 ? (
                    history.map(item => (
                        <div key={item.id} className="history-card" onClick={() => navigateToDetail(item.id, true)}>
                            <div style={{flex: 1}}>
                                <h3 className="history-title">{item.title}</h3>
                                <div className="history-date">
                                    <IonIcon icon={calendarOutline} />
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="history-price">{formatRequestPriceRangeEuros(item)}</div>
                        </div>
                    ))
                ) : (
                    <div className="empty-history">
                        <IonIcon icon={receiptOutline} />
                        <p>Aún no has completado trabajos.</p>
                    </div>
                )}
            </IonContent>
        </IonModal>

        {/* MODAL VERIFICACIÓN TELÉFONO */}
        <IonModal isOpen={showPhoneVerifyModal} onDidDismiss={() => setShowPhoneVerifyModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary" style={{ '--padding-top': '10px' }}>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowPhoneVerifyModal(false)} style={{ color: 'white' }}>
                  <IonIcon icon={chevronBackOutline} style={{ fontSize: '24px' }} />
                </IonButton>
              </IonButtons>
              <IonTitle className="ion-text-center">
                <div className="brand-container">
                  <span className="brand-text-main">Qu</span>
                  <span className="brand-text-secondary">i</span>
                  <span className="brand-text-main">r</span>
                  <span className="brand-text-secondary">a</span>
                </div>
              </IonTitle>
              <IonButtons slot="end" style={{ width: '48px' }} />
            </IonToolbar>
          </IonHeader>
          <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
            <div className="profile-edit-hero animate__animated animate__fadeIn">
              <h2>Verificar teléfono</h2>
              <p>
                Introduce el código que has recibido por SMS.
                {user?.clientProfile && user?.professionalProfile && (
                  <span className="profile-verify-hint"> Verificando teléfono {phoneVerifyProfile === 'client' ? '(como cliente)' : '(como profesional)'}.</span>
                )}
              </p>
            </div>
            <div className="profile-edit-content profile-password-content">
              <div className="profile-edit-form animate__animated animate__fadeInUp">
                <div className="profile-edit-section">
                  <IonLabel className="profile-edit-label">Código SMS</IonLabel>
                  <div className="profile-edit-input">
                    <IonInput
                      type="tel"
                      inputmode="numeric"
                      value={phoneCode}
                      onIonInput={e => setPhoneCode(e.detail.value ?? '')}
                      placeholder="Ej: 123456"
                      clearOnEdit={false}
                    />
                  </div>
                </div>
              </div>
              <div className="profile-edit-footer profile-phone-verify-footer">
                <button
                  type="button"
                  className="profile-phone-resend-sms"
                  onClick={() => sendPhoneVerificationSms(phoneVerifyProfile)}
                >
                  <IonIcon icon={refreshOutline} className="profile-phone-resend-sms__icon" aria-hidden />
                  Reenviar SMS
                </button>
                <IonButton
                  className="quira-main-btn profile-edit-save"
                  onClick={handleConfirmPhoneCode}
                  disabled={phoneVerifyLoading}
                >
                  {phoneVerifyLoading ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>CONFIRMAR CÓDIGO</>
                  )}
                </IonButton>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* MODAL HISTORIAL: Trabajos que me han hecho (como cliente) */}
        <IonModal isOpen={showHistoryClientModal} onDidDismiss={() => setShowHistoryClientModal(false)} initialBreakpoint={0.75} breakpoints={[0, 0.75, 1]}>
            <IonHeader className="ion-no-border">
                <IonToolbar>
                    <IonTitle style={{fontWeight: 900}}>{isPro ? 'Trabajos que me han hecho' : 'Mis trabajos finalizados'}</IonTitle>
                    <IonButtons slot="end"><IonButton onClick={() => setShowHistoryClientModal(false)} color="medium"><IonIcon icon={closeOutline} /></IonButton></IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding" style={{'--background': '#f8fafc'}}>
                {loadingHistory ? (
                    <div style={{textAlign:'center', marginTop:'40px'}}><IonSpinner name="crescent"/></div>
                ) : historyAsClient.length > 0 ? (
                    historyAsClient.map(item => (
                        <div key={item.id} className="history-card" onClick={() => navigateToDetail(item.id, false)}>
                            <div style={{flex: 1}}>
                                <h3 className="history-title">{item.title}</h3>
                                <div className="history-date">
                                    <IonIcon icon={calendarOutline} />
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="history-price">{formatRequestPriceRangeEuros(item)}</div>
                        </div>
                    ))
                ) : (
                    <div className="empty-history">
                        <IonIcon icon={receiptOutline} />
                        <p>{isPro ? 'Aún no tienes trabajos donde hayas sido cliente.' : 'No tienes trabajos finalizados.'}</p>
                    </div>
                )}
            </IonContent>
        </IonModal>

        {/* MODAL EDICIÓN PERFIL */}
        <IonModal
            isOpen={showEditModal}
            onDidDismiss={() => { setShowEditModal(false); setModalReady(false); googleMap.current = null; }}
            onDidPresent={() => setModalReady(true)}
        >
            <IonHeader className="ion-no-border">
                <IonToolbar color="primary" style={{ '--padding-top': '10px' }}>
                    <IonButtons slot="start">
                        <IonButton onClick={() => setShowEditModal(false)} style={{ color: 'white' }}>
                            <IonIcon icon={chevronBackOutline} style={{ fontSize: '24px' }} />
                        </IonButton>
                    </IonButtons>
                    <IonTitle className="ion-text-center">
                        <div className="brand-container">
                            <span className="brand-text-main">Qu</span>
                            <span className="brand-text-secondary">i</span>
                            <span className="brand-text-main">r</span>
                            <span className="brand-text-secondary">a</span>
                        </div>
                    </IonTitle>
                    <IonButtons slot="end" style={{ width: '48px' }} />
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
                <div className="profile-edit-hero animate__animated animate__fadeIn">
                    <h2>Editar Perfil</h2>
                    <p>Tus datos</p>
                </div>

                <div className="profile-edit-content profile-edit-content-main">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div className="profile-edit-avatar-wrap" onClick={handleAvatarClick}>
                            <div className="profile-edit-avatar" style={{ overflow: 'hidden' }}>
                                {uploadingAvatar ? (
                                    <IonSpinner name="crescent" color="primary" />
                                ) : avatarUrl ? (
                                    <img src={resolveMediaUrl(avatarUrl)} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    getInitials()
                                )}
                            </div>
                            <div className="profile-edit-avatar-badge">
                                <IonIcon icon={cameraOutline} />
                            </div>
                        </div>
                        <span className="profile-edit-avatar-hint">Toca para cambiar</span>
                    </div>

                    <div className="profile-edit-form animate__animated animate__fadeInUp">
                        <div className="profile-edit-section">
                            <IonLabel className="profile-edit-label">Nombre y Apellidos *</IonLabel>
                            <div className="profile-edit-input">
                                <IonIcon icon={briefcaseOutline} />
                                <IonInput value={fullName} onIonInput={e => setFullName(e.detail.value!)} placeholder="Tu nombre completo" />
                            </div>
                        </div>

                        <div className="profile-edit-section">
                            <IonLabel className="profile-edit-label">
                              Email de acceso *
                              {user?.verifiedEmail && (
                                <IonIcon
                                  icon={checkmarkCircle}
                                  style={{ marginLeft: 6, fontSize: '16px', color: '#16a34a', verticalAlign: 'middle' }}
                                />
                              )}
                            </IonLabel>
                            <div className="profile-edit-input">
                                <IonIcon icon={mailOutline} />
                                <IonInput
                                  type="email"
                                  value={email}
                                  onIonInput={e => setEmail(e.detail.value ?? '')}
                                  placeholder="correo@ejemplo.com"
                                />
                            </div>
                            {!user?.verifiedEmail && (
                              <div className="profile-phone-verify-row">
                                <button
                                  type="button"
                                  className="profile-verification-link-btn profile-verification-link-btn--inline"
                                  onClick={handleResendEmailVerification}
                                >
                                  Reenviar verificación
                                </button>
                              </div>
                            )}
                        </div>

                        {!isPro && user?.clientProfile && (
                            <div className="profile-edit-section">
                                <IonLabel className="profile-edit-label">
                                    Teléfono de contacto *
                                    {user.clientProfile.verifiedPhone && (
                                      <IonIcon
                                        icon={checkmarkCircle}
                                        style={{ marginLeft: 6, fontSize: '16px', color: '#16a34a', verticalAlign: 'middle' }}
                                      />
                                    )}
                                </IonLabel>
                                <div className="profile-edit-input">
                                    <IonIcon icon={callOutline} />
                                    <IonInput
                                      type="tel"
                                      value={clientPhoneNumber}
                                      onIonInput={e => setClientPhoneNumber(e.detail.value ?? '')}
                                      placeholder="600 000 000"
                                    />
                                </div>
                                {!user.clientProfile.verifiedPhone && (
                                  <p className="profile-phone-save-verify-hint">
                                    Al guardar te enviaremos un SMS para verificar el número (si aplica).
                                  </p>
                                )}
                            </div>
                        )}
                        {isPro && user?.professionalProfile && (
                            <div className="profile-edit-section">
                                <IonLabel className="profile-edit-label">
                                    Teléfono de contacto *
                                    {user.professionalProfile.verifiedPhone && (
                                      <IonIcon
                                        icon={checkmarkCircle}
                                        style={{ marginLeft: 6, fontSize: '16px', color: '#16a34a', verticalAlign: 'middle' }}
                                      />
                                    )}
                                </IonLabel>
                                <div className="profile-edit-input">
                                    <IonIcon icon={callOutline} />
                                    <IonInput
                                      type="tel"
                                      value={professionalPhoneNumber}
                                      onIonInput={e => setProfessionalPhoneNumber(e.detail.value ?? '')}
                                      placeholder="600 000 000"
                                    />
                                </div>
                                {!user.professionalProfile.verifiedPhone && (
                                  <p className="profile-phone-save-verify-hint">
                                    Al guardar te enviaremos un SMS para verificar el número (si aplica).
                                  </p>
                                )}
                            </div>
                        )}

                    {isPro && (
                        <>
                            <div className="profile-edit-divider" />
                            <IonLabel className="profile-edit-section-title">Perfil Profesional</IonLabel>

                            <div className="profile-edit-section">
                                <IonLabel className="profile-edit-label">
                                  CIF / NIF{currentTier === 'PRO' ? ' *' : ''}
                                </IonLabel>
                                <div className="profile-edit-input">
                                    <IonIcon icon={documentTextOutline} />
                                    <IonInput value={taxId} onIonInput={e => setTaxId(e.detail.value!)} placeholder="B12345678" />
                                </div>
                            </div>

                            <div className="profile-edit-section">
                                <IonLabel className="profile-edit-label">Biografía *</IonLabel>
                                <div className="profile-edit-input profile-edit-textarea">
                                    <IonTextarea value={bio} rows={4} onIonInput={e => setBio(e.detail.value!)} placeholder="Cuéntales tu experiencia..." />
                                </div>
                            </div>

                            <IonLabel className="profile-edit-section-title">Zona de Cobertura</IonLabel>

                            <div className="profile-edit-section">
                                <IonLabel className="profile-edit-label">Dirección base *</IonLabel>
                                <div className="profile-edit-address-row">
                                    <div className="profile-edit-input profile-edit-autocomplete" style={{ flex: 1, padding: 0, overflow: 'visible', zIndex: 10001 }}>
                                    <GooglePlacesAutocomplete
                                        apiKey={GOOGLE_API_KEY}
                                        selectProps={{
                                            value: address ? { label: address, value: address } : null,
                                            onChange: handleAddressSelect,
                                            placeholder: 'Buscar dirección...',
                                            styles: googleAutocompleteStyles
                                        }}
                                        autocompletionRequest={{ componentRestrictions: { country: ['es'] } }}
                                    />
                                    </div>
                                    <IonButton className="gps-btn-profile" onClick={getCurrentLocation} aria-label="Usar mi ubicación actual">
                                        <IonIcon slot="icon-only" icon={navigateOutline} />
                                    </IonButton>
                                </div>
                            </div>

                            <div className="profile-edit-map-card service-zone-card">
                                <div className="map-wrapper-google">
                                    <div ref={mapRef} style={{ width: '100%', height: '230px' }}></div>
                                </div>
                                <div className="radius-control-box">
                                    <div className="radius-header">
                                        <IonLabel>Radio de servicio: <strong>{serviceRadiusKm} km</strong></IonLabel>
                                        <IonBadge color="primary" mode="ios">{serviceRadiusKm} km</IonBadge>
                                    </div>
                                    <IonRange 
                                        min={5} 
                                        max={100} 
                                        step={5} 
                                        value={serviceRadiusKm} 
                                        onIonChange={e => setServiceRadiusKm(Number(e.detail.value))} 
                                        className="custom-range"
                                    >
                                        <IonIcon slot="start" icon={optionsOutline} />
                                        <IonIcon slot="end" icon={trendingUpOutline} />
                                    </IonRange>
                                </div>
                                <div className="privacy-note">
                                    <IonIcon icon={informationCircleOutline} />
                                    <p>Tu ubicación no es pública, solo se usa para calcular el rango de servicio.</p>
                                </div>
                            </div>

                            <div className="profile-edit-section">
                                <IonLabel className="profile-edit-label">Especialidades *</IonLabel>
                                <div className="profile-edit-skills-grid">
                                    {CATEGORY_OPTIONS.map((opt) => {
                                      const isSelected = skills.includes(opt.value);
                                      return (
                                        <div
                                          key={opt.value}
                                          className={`profile-edit-skill-chip ${isSelected ? 'chip-selected' : ''}`}
                                          onClick={() => toggleSkill(opt.value)}
                                        >
                                          <IonIcon icon={isSelected ? checkmarkCircle : hammerOutline} />
                                          <span>{opt.label}</span>
                                        </div>
                                      );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                    </div>

                    <div className="profile-edit-footer">
                        <IonButton className="quira-main-btn profile-edit-save" onClick={saveProfile} disabled={saving}>
                            {saving ? <IonSpinner name="crescent" /> : <><IonIcon slot="start" icon={saveOutline} /> GUARDAR CAMBIOS</>}
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        </IonModal>

        {/* MODAL CAMBIO DE CONTRASEÑA */}
        <IonModal isOpen={showPasswordModal} onDidDismiss={() => setShowPasswordModal(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar color="primary" style={{ '--padding-top': '10px' }}>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowPasswordModal(false)} style={{ color: 'white' }}>
                  <IonIcon icon={chevronBackOutline} style={{ fontSize: '24px' }} />
                </IonButton>
              </IonButtons>
              <IonTitle className="ion-text-center">
                <div className="brand-container">
                  <span className="brand-text-main">Qu</span>
                  <span className="brand-text-secondary">i</span>
                  <span className="brand-text-main">r</span>
                  <span className="brand-text-secondary">a</span>
                </div>
              </IonTitle>
              <IonButtons slot="end" style={{ width: '48px' }} />
            </IonToolbar>
          </IonHeader>
          <IonContent fullscreen style={{ '--background': '#f8fafc' }}>
            <div className="profile-edit-hero animate__animated animate__fadeIn">
              <h2>Cambiar contraseña</h2>
              <p>Introduce tu contraseña actual y la nueva contraseña</p>
            </div>
            <div className="profile-edit-content profile-password-content">
            <div className="profile-edit-form animate__animated animate__fadeInUp">
              <div className="profile-edit-section">
                <IonLabel className="profile-edit-label">Contraseña actual</IonLabel>
                <div className="profile-edit-input" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={lockClosedOutline} style={{ flexShrink: 0, color: '#94a3b8' }} />
                  <IonInput
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onIonInput={e => setCurrentPassword(e.detail.value ?? '')}
                    placeholder="Tu contraseña actual"
                    clearOnEdit={false}
                    style={{ flex: 1 }}
                  />
                  <IonButton fill="clear" size="small" onClick={() => setShowCurrentPw(!showCurrentPw)} aria-label="Mostrar contraseña">
                    <IonIcon icon={showCurrentPw ? eyeOffOutline : eyeOutline} />
                  </IonButton>
                </div>
              </div>
              <div className="profile-edit-section">
                <IonLabel className="profile-edit-label">Nueva contraseña</IonLabel>
                <div className="profile-edit-input" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={lockClosedOutline} style={{ flexShrink: 0, color: '#94a3b8' }} />
                  <IonInput
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onIonInput={e => setNewPassword(e.detail.value ?? '')}
                    placeholder="Mínimo 6 caracteres"
                    clearOnEdit={false}
                    style={{ flex: 1 }}
                  />
                  <IonButton fill="clear" size="small" onClick={() => setShowNewPw(!showNewPw)} aria-label="Mostrar contraseña">
                    <IonIcon icon={showNewPw ? eyeOffOutline : eyeOutline} />
                  </IonButton>
                </div>
              </div>
              <div className="profile-edit-section">
                <IonLabel className="profile-edit-label">Repetir nueva contraseña</IonLabel>
                <div className="profile-edit-input">
                  <IonIcon icon={lockClosedOutline} style={{ color: '#94a3b8' }} />
                  <IonInput
                    type="password"
                    value={confirmPassword}
                    onIonInput={e => setConfirmPassword(e.detail.value ?? '')}
                    placeholder="Confirma la nueva contraseña"
                    clearOnEdit={false}
                  />
                </div>
              </div>
            </div>
            <div className="profile-edit-footer">
              <IonButton className="quira-main-btn profile-edit-save" onClick={handleChangePassword} disabled={passwordLoading}>
                {passwordLoading ? <IonSpinner name="crescent" /> : <><IonIcon slot="start" icon={saveOutline} /> CAMBIAR CONTRASEÑA</>}
              </IonButton>
            </div>
            </div>
          </IonContent>
        </IonModal>

        <IonToast isOpen={!!toast} message={toast || ''} duration={TOAST_DURATION_MS} onDidDismiss={() => setToast(null)} position="top" color="dark" style={{'--border-radius': '12px'}} />
      </IonContent>
    </IonPage>
  );
};

// Estilos del buscador de Google
const googleAutocompleteStyles = {
    container: (provided: any) => ({ ...provided, width: '100%', zIndex: 10001 }),
    control: (provided: any) => ({ 
        ...provided, 
        border: 'none', 
        boxShadow: 'none', 
        minHeight: '52px',
        backgroundColor: 'transparent'
    }),
    input: (provided: any) => ({ ...provided, color: '#1e293b', fontWeight: 600, paddingLeft: '10px' }),
    placeholder: (provided: any) => ({ ...provided, color: '#94a3b8', paddingLeft: '10px' }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: () => ({ display: 'none' }),
    menu: (provided: any) => ({ 
        ...provided, 
        zIndex: 10002, 
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
    })
};

export default Profile;