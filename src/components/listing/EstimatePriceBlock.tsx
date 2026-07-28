import React from 'react';

export type EstimatePriceVariant = 'range' | 'text' | 'ownBid';

interface EstimatePriceBlockProps {
  variant: EstimatePriceVariant;
  /** Importe o texto libre (p. ej. "Requiere visita" / "??? €"). */
  value: string;
  /** Etiqueta inferior opcional: "TU PROPUESTA", "GANADO". */
  caption?: string;
  tone?: 'default' | 'success';
}

export const EstimatePriceBlock: React.FC<EstimatePriceBlockProps> = ({
  variant,
  value,
  caption,
  tone = 'default',
}) => {
  const priceClass =
    tone === 'success' ? 'listing-price success' : 'listing-price';

  if (variant === 'text') {
    return (
      <div className="listing-price-block">
        <span className={`${priceClass} listing-price-text`}>{value}</span>
        {caption && <span className="listing-price-caption">{caption}</span>}
      </div>
    );
  }

  if (variant === 'ownBid') {
    return (
      <div className="listing-price-block">
        <span className={priceClass}>{value}</span>
        <span className="listing-price-caption">{caption || 'TU PROPUESTA'}</span>
      </div>
    );
  }

  // range
  return (
    <div className="listing-price-block">
      <span className="listing-price-sublabel">Rango estimado</span>
      <span className={priceClass}>{value}</span>
      {caption && <span className="listing-price-caption">{caption}</span>}
    </div>
  );
};
