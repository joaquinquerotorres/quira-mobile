import React from 'react';
import {
  IonBadge,
  IonButton,
  IonIcon,
  IonInput,
  IonLabel,
  IonRange,
  IonTextarea,
} from '@ionic/react';
import {
  briefcaseOutline,
  documentTextOutline,
  hammerOutline,
  checkmarkCircle,
  logoWhatsapp,
  navigateOutline,
  optionsOutline,
  trendingUpOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import './BecomeProForm.css';
import { CATEGORY_OPTIONS } from '../../utils/categoryLabels';

export interface BecomeProFormData {
  fullName: string;
  phoneNumber: string;
  address: string;
  serviceRadiusKm: number;
  taxId: string;
  bio: string;
  selectedSkills: string[];
}

interface BecomeProFormProps {
  selectedTier: string;
  formData: BecomeProFormData;
  onFormChange: (data: Partial<BecomeProFormData>) => void;
  onToggleSkill: (skillValue: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAddressSelect: (value: any) => void;
  onUseCurrentLocation: () => void;
  mapRef: React.RefObject<HTMLDivElement | null>;
  googleAutocompleteStyles: any;
  googleApiKey: string;
  loading: boolean;
  isUpgrading: boolean;
}

export const BecomeProForm: React.FC<BecomeProFormProps> = ({
  selectedTier,
  formData,
  onFormChange,
  onToggleSkill,
  onSubmit,
  onAddressSelect,
  onUseCurrentLocation,
  mapRef,
  googleAutocompleteStyles,
  googleApiKey,
  loading,
  isUpgrading,
}) => (
  <form onSubmit={onSubmit} className="become-pro-form animate__animated animate__fadeInRight">
    <div className="become-pro-input-group">
      <IonLabel>Nombre Comercial / Completo *</IonLabel>
      <div className="become-pro-input-wrapper">
        <IonIcon icon={briefcaseOutline} />
        <IonInput
          value={formData.fullName}
          placeholder="Ej. Reformas García"
          onIonInput={(e) => onFormChange({ fullName: e.detail.value! })}
        />
      </div>
    </div>

    <div className="become-pro-input-group">
      <IonLabel>Teléfono móvil profesional *</IonLabel>
      <div className="become-pro-input-wrapper">
        <IonIcon icon={logoWhatsapp} />
        <IonInput
          value={formData.phoneNumber}
          type="tel"
          placeholder="600 000 000"
          onIonInput={(e) => onFormChange({ phoneNumber: e.detail.value! })}
        />
      </div>
    </div>

    <div className="become-pro-input-group">
      <IonLabel>
        CIF / NIF
        {selectedTier === 'PRO' ? ' *' : ''}
      </IonLabel>
      <div className="become-pro-input-wrapper">
        <IonIcon icon={documentTextOutline} />
        <IonInput
          value={formData.taxId}
          placeholder="B12345678"
          onIonInput={(e) => onFormChange({ taxId: e.detail.value! })}
        />
      </div>
      {selectedTier === 'PRO' && !formData.taxId && (
        <div className="become-pro-field-error">Necesario para cuenta PRO</div>
      )}
    </div>

    <div className="become-pro-input-group">
      <IonLabel>Bio / Experiencia *</IonLabel>
      <div className="become-pro-input-wrapper become-pro-textarea-wrapper">
        <IonTextarea
          rows={3}
          value={formData.bio}
          placeholder="Cuéntanos tu experiencia..."
          onIonInput={(e) => onFormChange({ bio: e.detail.value! })}
        />
      </div>
    </div>

    <IonLabel className="become-pro-coverage-title">Zona de Cobertura</IonLabel>
    <div className="become-pro-input-group">
      <IonLabel>Dirección base *</IonLabel>
      <div className="become-pro-address-row">
        <div className="become-pro-input-wrapper become-pro-autocomplete-wrapper">
          <GooglePlacesAutocomplete
            apiKey={googleApiKey}
            selectProps={{
              value: formData.address ? { label: formData.address, value: formData.address } : null,
              onChange: onAddressSelect,
              placeholder: 'Buscar dirección...',
              styles: googleAutocompleteStyles,
            }}
            autocompletionRequest={{ componentRestrictions: { country: ['es'] } }}
          />
        </div>
        <IonButton className="become-pro-gps-btn" onClick={onUseCurrentLocation} aria-label="Usar mi ubicación actual">
          <IonIcon slot="icon-only" icon={navigateOutline} />
        </IonButton>
      </div>
    </div>

    <div className="become-pro-service-zone-card">
      <div className="become-pro-map-wrapper">
        <div ref={mapRef} style={{ width: '100%', height: '230px' }} />
      </div>
      <div className="become-pro-radius-control-box">
        <div className="become-pro-radius-header">
          <IonLabel>
            Radio de servicio: <strong>{formData.serviceRadiusKm} km</strong>
          </IonLabel>
          <IonBadge color="primary" mode="ios">{formData.serviceRadiusKm} km</IonBadge>
        </div>
        <IonRange
          min={5}
          max={100}
          step={5}
          value={formData.serviceRadiusKm}
          onIonChange={(e) => onFormChange({ serviceRadiusKm: Number(e.detail.value) })}
          className="become-pro-custom-range"
        >
          <IonIcon slot="start" icon={optionsOutline} />
          <IonIcon slot="end" icon={trendingUpOutline} />
        </IonRange>
      </div>
      <div className="become-pro-privacy-note">
        <IonIcon icon={informationCircleOutline} />
        <p>Tu ubicación no es pública, solo se usa para calcular el rango de servicio.</p>
      </div>
    </div>

    <div className="become-pro-section-title">
      Habilidades <span className="become-pro-subtitle-small">Selecciona al menos una</span>
    </div>

    <div className="become-pro-skills-grid">
      {CATEGORY_OPTIONS.map((skill) => {
        const isSelected = formData.selectedSkills.includes(skill.value);
        return (
          <div
            key={skill.value}
            className={`become-pro-skill-chip ${isSelected ? 'chip-selected' : ''}`}
            onClick={() => onToggleSkill(skill.value)}
          >
            <IonIcon icon={isSelected ? checkmarkCircle : hammerOutline} />
            <span>{skill.label}</span>
          </div>
        );
      })}
    </div>

    <IonButton
      expand="block"
      type="submit"
      className="become-pro-submit-btn"
      disabled={loading}
    >
      {loading
        ? 'PROCESANDO...'
        : isUpgrading
          ? 'ACTUALIZAR MI PLAN'
          : 'FINALIZAR REGISTRO'}
    </IonButton>
  </form>
);
