import React, { useState, useEffect } from 'react';
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
import api from '../api/axios';
import { TOAST_DURATION_MS } from '../config/uiTiming';
import { refreshCurrentUserInStorage } from '../utils/refreshCurrentUser';
import { createCheckoutSession, syncSubscriptionFromStripe } from '../services/stripeService';
import { BecomeProHero, BecomeProTierSelector, BecomeProForm, type BecomeProFormData } from '../components/becomepro';
import '../components/layout/LogoHeader.css';
import './BecomePro.css';

const PAID_TIERS = ['SOLVER', 'PRO'];

const BecomePro: React.FC = () => {
  const router = useIonRouter();
  const location = useLocation();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTier, setSelectedTier] = useState<string>('SOLVER');

  const [formData, setFormData] = useState<BecomeProFormData>({
    fullName: '',
    phoneNumber: '',
    taxId: '',
    bio: '',
    selectedSkills: [],
  });

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
          window.location.href = '/market';
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
          taxId: pro.taxId || '',
          bio: pro.bio || '',
          selectedSkills: pro.skills || [],
        });

        if (user.roles.includes('ROLE_SOLVER')) {
          setSelectedTier('PRO');
        }
      } else if (user.clientProfile) {
        setFormData((prev) => ({
          ...prev,
          fullName: user.clientProfile.fullName || '',
          phoneNumber: user.clientProfile.phoneNumber || '',
        }));
      }
    }
  }, []);

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
    const { fullName, phoneNumber, taxId, bio, selectedSkills } = formData;

    if (!fullName || !phoneNumber || !bio || selectedSkills.length === 0) {
      setToast('Por favor, completa los campos obligatorios.');
      return;
    }

    if (selectedTier === 'PRO' && !taxId) {
      setToast('El CIF/NIF es obligatorio para cuentas Profesionales.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fullName,
        phoneNumber,
        taxId: taxId || null,
        bio,
        skills: selectedSkills,
        tierRequested: selectedTier,
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
      setTimeout(() => { window.location.href = '/market'; }, 1500);
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
              <div className="brand-dot-container">
                <span className="brand-text-main">i</span>
                <div className="brand-smart-dot"></div>
              </div>
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
