import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonToast,
  IonLoading,
  IonButtons,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useIonRouter } from '@ionic/react';
import { useLocation } from 'react-router-dom';
import { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';
import { Geolocation } from '@capacitor/geolocation';
import api from '../api/axios';
import { env } from '../config/env';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import { refreshCurrentUserInStorage } from '../utils/refreshCurrentUser';
import { streetLineFromGeocode } from '../utils/streetLineFromGeocode';
import { createCheckoutSession, syncSubscriptionFromStripe } from '../services/stripeService';
import { setActiveMode } from '../utils/activeMode';
import { BecomeProHero, BecomeProTierSelector, BecomeProForm, type BecomeProFormData } from '../components/becomepro';
import '../components/layout/LogoHeader.css';
import './BecomePro.css';

const PAID_TIERS = ['SOLVER', 'PRO'];
const GOOGLE_API_KEY = env.googleMapsKey;

function comparablePhone(raw: string | undefined | null): string {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

function shouldAutoVerifyProfessionalPhone(
  user: { clientProfile?: { phoneNumber?: string; verifiedPhone?: boolean } } | null,
  professionalPhone: string,
): boolean {
  if (!user?.clientProfile?.verifiedPhone) return false;
  const clientPhone = comparablePhone(user.clientProfile.phoneNumber);
  const proPhone = comparablePhone(professionalPhone);
  return clientPhone.length > 0 && clientPhone === proPhone;
}

const BecomePro: React.FC = () => {
  const router = useIonRouter();
  const location = useLocation();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTier, setSelectedTier] = useState<string>('SOLVER');

  const [formData, setFormData] = useState<BecomeProFormData>({
    fullName: '',
    phoneNumber: '',
    address: '',
    serviceRadiusKm: 30,
    taxId: '',
    bio: '',
    selectedSkills: [],
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMap = useRef<google.maps.Map | null>(null);
  const serviceCircle = useRef<google.maps.Circle | null>(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [existingProId, setExistingProId] = useState<number | null>(null);

  // Detectar retorno exitoso desde Stripe Checkout: refrescar usuario para paidThroughAt al día.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('success') === '1') {
      void (async () => {
        try {
          await syncSubscriptionFromStripe();
        } catch {
          /* sync opcional si red falla; el GET siguiente puede bastar tras webhook */
        }
        await refreshCurrentUserInStorage();
        setToast('¡Pago completado! Tu suscripción está activa.');
        setTimeout(() => {
          window.history.replaceState({}, '', '/become-pro');
          setActiveMode('pro');
          window.location.href = '/my-work';
        }, 2000);
      })();
    } else if (params.get('canceled') === '1') {
      setToast('El pago fue cancelado. Puedes intentarlo de nuevo cuando quieras.');
      window.history.replaceState({}, '', '/become-pro');
    }
  }, [location.search]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);

      if (user.professionalProfile) {
        setIsUpgrading(true);
        const pro = user.professionalProfile;

        let extractedId: number | null = null;
        if (pro && typeof pro === 'object' && pro.id) {
          extractedId = pro.id;
        } else if (typeof pro === 'string') {
          const parts = pro.split('/');
          const lastPart = parts.pop();
          if (lastPart) extractedId = parseInt(lastPart, 10);
        }

        setExistingProId(extractedId);
        setFormData({
          fullName: pro.fullName || '',
          phoneNumber: pro.phoneNumber || user.clientProfile?.phoneNumber || '',
          address: pro.address || '',
          serviceRadiusKm: pro.serviceRadiusKm || 30,
          taxId: pro.taxId || '',
          bio: pro.bio || '',
          selectedSkills: pro.skills || [],
        });
        if (pro.locationPoint?.coordinates) {
          setCoords({ lat: pro.locationPoint.coordinates[1], lng: pro.locationPoint.coordinates[0] });
        }

        if (user.roles.includes('ROLE_SOLVER')) {
          setSelectedTier('PRO');
        }
      } else if (user.clientProfile) {
        setFormData((prev) => ({
          ...prev,
          fullName: user.clientProfile.fullName || '',
          phoneNumber: user.clientProfile.phoneNumber || '',
          address: user.clientProfile.address || '',
        }));
      }
    }
  }, []);

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

  useEffect(() => {
    if (step !== 2 || !mapRef.current) return;
    if (typeof google === 'undefined' || !google.maps) return;

    const initialPos = coords || { lat: 37.888, lng: -4.779 };
    if (!googleMap.current) {
      googleMap.current = new google.maps.Map(mapRef.current, {
        center: initialPos,
        zoom: getZoomForRadius(formData.serviceRadiusKm),
        disableDefaultUI: true,
        gestureHandling: 'none',
        styles: [],
      });
      serviceCircle.current = new google.maps.Circle({
        strokeColor: '#4f46e5',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#4f46e5',
        fillOpacity: 0.2,
        map: googleMap.current,
        center: initialPos,
        radius: formData.serviceRadiusKm * 1000,
      });
      return;
    }

    google.maps.event.trigger(googleMap.current, 'resize');
    googleMap.current.setCenter(initialPos);
    googleMap.current.setZoom(getZoomForRadius(formData.serviceRadiusKm));
    if (serviceCircle.current) {
      serviceCircle.current.setCenter(initialPos);
      serviceCircle.current.setRadius(formData.serviceRadiusKm * 1000);
    }
  }, [step, coords, formData.serviceRadiusKm]);

  const handleAddressSelect = async (value: any) => {
    if (!value) {
      setFormData((prev) => ({ ...prev, address: '' }));
      setCoords(null);
      return;
    }
    try {
      const results = await geocodeByAddress(value.label);
      const result = results[0];
      const comps = (result as any).address_components;
      const get = (type: string) =>
        comps.find((c: any) => c.types?.includes(type))?.long_name as string | undefined;
      const province = get('administrative_area_level_2') || get('administrative_area_level_1');
      const country = get('country');
      const isSpain = country === 'España' || country === 'Spain';
      const isCordoba = province === 'Córdoba' || province === 'Cordoba';
      if (!(isSpain && isCordoba)) {
        setToast('Por ahora solo aceptamos direcciones en Córdoba (Andalucía).');
        setFormData((prev) => ({ ...prev, address: '' }));
        setCoords(null);
        return;
      }
      setFormData((prev) => ({
        ...prev,
        address: streetLineFromGeocode(value.label, result as any),
      }));
      const { lat, lng } = await getLatLng(result);
      setCoords({ lat, lng });
    } catch {
      setFormData((prev) => ({ ...prev, address: value.label }));
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
          const province = get('administrative_area_level_2') || get('administrative_area_level_1');
          const country = get('country');
          const isSpain = country === 'España' || country === 'Spain';
          const isCordoba = province === 'Córdoba' || province === 'Cordoba';
          if (!(isSpain && isCordoba)) {
            setToast('Por ahora solo aceptamos direcciones en Córdoba (Andalucía).');
            setFormData((prev) => ({ ...prev, address: '' }));
            setCoords(null);
            return;
          }
          setFormData((prev) => ({
            ...prev,
            address: streetLineFromGeocode(result.formatted_address, result),
          }));
          return;
        }
      }

      const fallback = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setFormData((prev) => ({ ...prev, address: fallback }));
    } catch {
      setToast('Error al obtener ubicación.');
    }
  };

  const handleFormChange = (data: Partial<BecomeProFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const toggleSkill = (skillValue: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.includes(skillValue)
        ? prev.selectedSkills.filter((s) => s !== skillValue)
        : [...prev.selectedSkills, skillValue],
    }));
  };

  const handleBecomePro = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, phoneNumber, address, taxId, bio, selectedSkills } = formData;

    if (!fullName || !phoneNumber || !address || !bio || selectedSkills.length === 0) {
      setToast('Por favor, completa los campos obligatorios.');
      return;
    }

    if (selectedTier === 'PRO' && !taxId) {
      setToast('El CIF/NIF es obligatorio para cuentas Profesionales.');
      return;
    }

    setLoading(true);
    try {
      const currentUser = (() => {
        const raw = localStorage.getItem('user');
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })();
      const autoVerifyProfessionalPhone = shouldAutoVerifyProfessionalPhone(currentUser, phoneNumber);

      const payload = {
        fullName,
        phoneNumber,
        address,
        taxId: taxId || null,
        bio,
        skills: selectedSkills,
        serviceRadiusKm: Number(formData.serviceRadiusKm),
        locationPoint: coords ? { type: 'Point', coordinates: [coords.lng, coords.lat] } : null,
        tierRequested: selectedTier,
        ...(autoVerifyProfessionalPhone ? { verifiedPhone: true } : {}),
      };

      const response = isUpgrading && existingProId
        ? await api.patch(`/professional_profiles/${existingProId}`, payload, {
            headers: { 'Content-Type': 'application/merge-patch+json' },
          })
        : await api.post('/professional_profiles', payload);

      const proProfile = response.data;
      const proId = typeof proProfile?.id === 'number' ? proProfile.id : parseInt(String(proProfile?.id || proProfile?.['@id']?.split('/').pop()), 10);

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.professionalProfile = proProfile;
        if (autoVerifyProfessionalPhone && user.professionalProfile && typeof user.professionalProfile === 'object') {
          user.professionalProfile.verifiedPhone = true;
        }
        if (!user.roles.includes('ROLE_PROFESSIONAL')) user.roles.push('ROLE_PROFESSIONAL');
        user.roles = user.roles.filter((r: string) => r !== 'ROLE_FREE' && r !== 'ROLE_SOLVER' && r !== 'ROLE_PRO');
        if (selectedTier === 'PRO') user.roles.push('ROLE_PRO');
        else if (selectedTier === 'SOLVER') user.roles.push('ROLE_SOLVER');
        else user.roles.push('ROLE_FREE');
        localStorage.setItem('user', JSON.stringify(user));
      }

      if (PAID_TIERS.includes(selectedTier) && proId) {
        const { url } = await createCheckoutSession({
          tier: selectedTier as 'SOLVER' | 'PRO',
          professionalProfileId: proId,
        });
        window.location.href = url;
        return;
      }

      setToast(isUpgrading ? `¡Plan actualizado a ${selectedTier}!` : `¡Bienvenido al plan ${selectedTier}!`);
      setTimeout(() => {
        setActiveMode('pro');
        window.location.href = '/my-work';
      }, 1500);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { 'hydra:description'?: string; message?: string } } })?.response?.data?.['hydra:description']
        || (error as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Error al procesar la solicitud.';
      setToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar color="primary" style={{ '--padding-top': '10px' }}>
          <IonButtons slot="start">
            <IonButton
              onClick={() => (step === 2 ? setStep(1) : router.goBack())}
              style={{ color: 'white' }}
            >
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
        {step === 1 ? (
          <>
            <BecomeProHero
              title={isUpgrading ? 'Mejora tu Plan' : 'Elige tu Nivel'}
              subtitle={
                isUpgrading
                  ? 'Sube de nivel para conseguir más trabajos.'
                  : 'Empieza gratis o desbloquea todo el potencial.'
              }
            />
            <div className="become-pro-content-container">
              <BecomeProTierSelector
                selectedTier={selectedTier}
                onSelectTier={setSelectedTier}
                onContinue={() => setStep(2)}
              />
            </div>
          </>
        ) : (
          <>
            <BecomeProHero
              title="Tus Datos"
              subtitle={`Información para validar tu perfil ${selectedTier}.`}
            />
            <div className="become-pro-content-container">
              <BecomeProForm
                selectedTier={selectedTier}
                formData={formData}
                onFormChange={handleFormChange}
                onToggleSkill={toggleSkill}
                onSubmit={handleBecomePro}
                onAddressSelect={handleAddressSelect}
                onUseCurrentLocation={getCurrentLocation}
                mapRef={mapRef}
                googleAutocompleteStyles={googleAutocompleteStyles}
                googleApiKey={GOOGLE_API_KEY}
                loading={loading}
                isUpgrading={isUpgrading}
              />
            </div>
          </>
        )}

        <IonLoading
          isOpen={loading}
          message={isUpgrading ? 'Actualizando plan...' : 'Configurando tu perfil...'}
        />
        <IonToast
          isOpen={!!toast}
          message={toast!}
          duration={TOAST_DURATION_MS}
          onDidDismiss={() => setToast(null)}
          position="top"
          className="custom-toast"
        />
      </IonContent>
    </IonPage>
  );
};

export default BecomePro;

const googleAutocompleteStyles = {
  container: (provided: any) => ({ ...provided, width: '100%', zIndex: 10001 }),
  control: (provided: any) => ({
    ...provided,
    border: 'none',
    boxShadow: 'none',
    minHeight: '52px',
    backgroundColor: 'transparent',
  }),
  input: (provided: any) => ({ ...provided, color: '#1e293b', fontWeight: 600, paddingLeft: '10px' }),
  placeholder: (provided: any) => ({ ...provided, color: '#94a3b8', paddingLeft: '10px' }),
  indicatorSeparator: () => ({ display: 'none' }),
  dropdownIndicator: () => ({ display: 'none' }),
  menu: (provided: any) => ({
    ...provided,
    zIndex: 10002,
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  }),
};
