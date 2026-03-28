import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import {
  checkmarkCircle,
  arrowForwardOutline,
  mailOutline,
  flashOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import './BecomeProTierSelector.css';

const TIERS = [
  {
    id: 'FREE',
    name: 'Starter',
    price: 'Gratis',
    icon: mailOutline,
    features: ['3 Propuestas al mes', 'Acceso a trabajos de dificultad baja y media', 'Alertas por Email'],
    color: 'medium',
  },
  {
    id: 'SOLVER',
    name: 'Solver',
    price: '4,99€/mes',
    trial: '3 Meses Gratis',
    icon: flashOutline,
    features: ['Propuestas ILIMITADAS', 'Acceso a trabajos de dificultad baja y media', 'Alertas PUSH (Rápido)'],
    color: 'tertiary',
    recommended: true,
  },
  {
    id: 'PRO',
    name: 'Profesional',
    price: '11,99€/mes',
    trial: '3 Meses Gratis',
    icon: shieldCheckmarkOutline,
    features: ['Acceso TOTAL (incluye trabajos de alta dificultad)', 'Prioridad en listados', 'Alertas push en tiempo real'],
    color: 'secondary',
  },
];

interface BecomeProTierSelectorProps {
  selectedTier: string;
  onSelectTier: (tierId: string) => void;
  onContinue: () => void;
}

export const BecomeProTierSelector: React.FC<BecomeProTierSelectorProps> = ({
  selectedTier,
  onSelectTier,
  onContinue,
}) => (
  <div className="become-pro-tier-selector animate__animated animate__fadeIn">
    <div className="become-pro-tiers-container">
      {TIERS.map((tier) => (
        <div
          key={tier.id}
          className={`become-pro-tier-card ${selectedTier === tier.id ? 'selected' : ''}`}
          onClick={() => onSelectTier(tier.id)}
        >
          {tier.recommended && <div className="become-pro-tier-badge">RECOMENDADO</div>}
          <div className="become-pro-tier-header">
            <div className={`become-pro-tier-icon-box ${tier.color}`}>
              <IonIcon icon={tier.icon} />
            </div>
            <div>
              <div className="become-pro-tier-name">{tier.name}</div>
              <div className="become-pro-tier-price">{tier.price}</div>
            </div>
          </div>
          {tier.trial && <div className="become-pro-tier-trial">{tier.trial}</div>}
          <ul className="become-pro-tier-features">
            {tier.features.map((feat, i) => (
              <li key={i}>
                <IonIcon icon={checkmarkCircle} /> {feat}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>

    <IonButton
      expand="block"
      className="become-pro-submit-btn"
      onClick={onContinue}
    >
      CONTINUAR COMO {selectedTier}
      <IonIcon slot="end" icon={arrowForwardOutline} />
    </IonButton>
  </div>
);
