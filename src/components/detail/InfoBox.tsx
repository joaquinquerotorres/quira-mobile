import React from 'react';
import { IonIcon } from '@ionic/react';
import './Detail.css';

export type InfoBoxTone = 'peach' | 'lavender' | 'neutral' | 'success';

export const PRICE_RANGE_DISCLAIMER =
  'Orientativo para la zona; no incluye desplazamiento ni materiales.';

interface InfoBoxProps {
  icon: string;
  label: string;
  value: React.ReactNode;
  subtext?: React.ReactNode;
  tone?: InfoBoxTone;
  /** Valor más destacado (rango de precio). */
  emphasizeValue?: boolean;
  /** Mitad de ancho para agrupar 2 InfoBox en fila. */
  width?: 'full' | 'half';
  className?: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  icon,
  label,
  value,
  subtext,
  tone = 'neutral',
  emphasizeValue = false,
  width = 'full',
  className,
}) => (
  <div
    className={`detail-info-box detail-info-box--${tone} detail-info-box--${width}${className ? ` ${className}` : ''}`}
  >
    <div className="detail-info-box-icon">
      <IonIcon icon={icon} />
    </div>
    <div className="detail-info-box-copy">
      <div className="detail-info-box-label">{label}</div>
      <div
        className={`detail-info-box-value${emphasizeValue ? ' detail-info-box-value--emphasis' : ''}`}
      >
        {value}
      </div>
      {subtext != null && subtext !== '' && (
        <div className="detail-info-box-subtext">{subtext}</div>
      )}
    </div>
  </div>
);

/** Fila para agrupar InfoBox half-width (rango + disponibilidad). */
export const InfoBoxRow: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={`detail-info-box-row${className ? ` ${className}` : ''}`}>
    {children}
  </div>
);
