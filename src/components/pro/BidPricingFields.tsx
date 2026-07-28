import React from 'react';
import { IonInput, IonLabel, IonSelect, IonSelectOption } from '@ionic/react';
import type { BidPricingType } from '../../utils/bidPricing';
import './BidPricingFields.css';

interface BidPricingFieldsProps {
  allowedTypes: BidPricingType[];
  pricingType: BidPricingType;
  onPricingTypeChange: (type: BidPricingType) => void;
  bidPrice: number | undefined;
  onBidPriceChange: (value: number | undefined) => void;
  bidPriceMin: number | undefined;
  onBidPriceMinChange: (value: number | undefined) => void;
  bidPriceMax: number | undefined;
  onBidPriceMaxChange: (value: number | undefined) => void;
}

function parseOptionalInt(raw: string | null | undefined): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Campos de precio de propuesta según el pricingType de la solicitud
 * (FIXED → fijo, RANGE → rango, VISIT_REQUIRED → selector).
 */
export const BidPricingFields: React.FC<BidPricingFieldsProps> = ({
  allowedTypes,
  pricingType,
  onPricingTypeChange,
  bidPrice,
  onBidPriceChange,
  bidPriceMin,
  onBidPriceMinChange,
  bidPriceMax,
  onBidPriceMaxChange,
}) => {
  const effectiveType = allowedTypes.includes(pricingType)
    ? pricingType
    : allowedTypes[0] ?? 'FIXED';

  return (
    <>
      {allowedTypes.length > 1 && (
        <>
          <IonLabel className="section-label">Tipo de propuesta</IonLabel>
          <div className="input-wrapper bid-pricing-select-wrap">
            <IonSelect
              interface="action-sheet"
              value={effectiveType}
              onIonChange={(e) =>
                onPricingTypeChange(e.detail.value as BidPricingType)
              }
            >
              {allowedTypes.includes('FIXED') && (
                <IonSelectOption value="FIXED">Precio fijo</IonSelectOption>
              )}
              {allowedTypes.includes('RANGE') && (
                <IonSelectOption value="RANGE">Rango de precio</IonSelectOption>
              )}
            </IonSelect>
          </div>
        </>
      )}

      {effectiveType === 'FIXED' ? (
        <>
          <IonLabel className="section-label">Tu Oferta Económica (€)</IonLabel>
          <div className="price-fixed-card">
            <div className="price-fixed-hint">
              Indica el precio cerrado que ofreces por el trabajo.
            </div>
            <div className="price-fixed-field">
              <div className="price-fixed-label">Precio fijo</div>
              <div className="price-fixed-input-wrap">
                <span className="price-fixed-currency">€</span>
                <IonInput
                  type="number"
                  inputMode="numeric"
                  value={bidPrice}
                  placeholder="100"
                  onIonInput={(e) =>
                    onBidPriceChange(parseOptionalInt(e.detail.value))
                  }
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <IonLabel className="section-label">Rango de precio (€)</IonLabel>
          <div className="price-range-card">
            <div className="price-range-hint">
              Define una horquilla realista para el cliente.
            </div>
            <div className="price-range-grid">
              <div className="price-range-field">
                <div className="price-range-label">Precio mínimo</div>
                <div className="price-range-input-wrap">
                  <span className="price-range-currency">€</span>
                  <IonInput
                    type="number"
                    inputMode="numeric"
                    value={bidPriceMin}
                    placeholder="80"
                    onIonInput={(e) =>
                      onBidPriceMinChange(parseOptionalInt(e.detail.value))
                    }
                  />
                </div>
              </div>
              <div className="price-range-field">
                <div className="price-range-label">Precio máximo</div>
                <div className="price-range-input-wrap">
                  <span className="price-range-currency">€</span>
                  <IonInput
                    type="number"
                    inputMode="numeric"
                    value={bidPriceMax}
                    placeholder="120"
                    onIonInput={(e) =>
                      onBidPriceMaxChange(parseOptionalInt(e.detail.value))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
