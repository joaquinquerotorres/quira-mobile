import React from 'react';
import {
  IonButton,
  IonIcon,
  IonInput,
  IonLabel,
  IonTextarea,
} from '@ionic/react';
import {
  briefcaseOutline,
  documentTextOutline,
  hammerOutline,
  checkmarkCircle,
  logoWhatsapp,
} from 'ionicons/icons';
import './BecomeProForm.css';

const SKILL_OPTIONS = [
  { value: 'MASONRY', label: 'Albañilería' },
  { value: 'PLUMBING', label: 'Fontanería' },
  { value: 'ELECTRICITY', label: 'Electricidad' },
  { value: 'HVAC', label: 'Climatización' },
  { value: 'DIY', label: 'Manitas / Bricolaje' },
  { value: 'CLEANING', label: 'Limpieza' },
  { value: 'PAINTING', label: 'Pintura' },
  { value: 'GARDENING', label: 'Jardinería' },
];

export interface BecomeProFormData {
  fullName: string;
  phoneNumber: string;
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
  loading: boolean;
  isUpgrading: boolean;
}

export const BecomeProForm: React.FC<BecomeProFormProps> = ({
  selectedTier,
  formData,
  onFormChange,
  onToggleSkill,
  onSubmit,
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

    <div className="become-pro-section-title">
      Habilidades <span className="become-pro-subtitle-small">Selecciona al menos una</span>
    </div>

    <div className="become-pro-skills-grid">
      {SKILL_OPTIONS.map((skill) => {
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
