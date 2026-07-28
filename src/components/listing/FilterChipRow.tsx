import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IonChip, IonLabel } from '@ionic/react';

export interface FilterChipOption {
  value: string;
  label: string;
}

interface FilterChipRowProps {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * Chips de filtro horizontal. Solo se usan en Mis solicitudes (cliente);
 * Mercado y Mi Trabajo filtran por modal (icono) a propósito — no duplicar chips ahí.
 * Fade derecho solo si el contenido desborda y hay más scroll a la derecha.
 */
export const FilterChipRow: React.FC<FilterChipRowProps> = ({
  options,
  value,
  onChange,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showEndFade, setShowEndFade] = useState(false);

  const updateFade = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setShowEndFade(false);
      return;
    }
    const overflows = el.scrollWidth > el.clientWidth + 1;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setShowEndFade(overflows && !atEnd);
  }, []);

  useEffect(() => {
    updateFade();
    const el = scrollerRef.current;
    if (!el) return undefined;

    el.addEventListener('scroll', updateFade, { passive: true });
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateFade())
        : null;
    ro?.observe(el);
    window.addEventListener('resize', updateFade);

    return () => {
      el.removeEventListener('scroll', updateFade);
      ro?.disconnect();
      window.removeEventListener('resize', updateFade);
    };
  }, [options, updateFade]);

  return (
    <div className={`listing-filter-chips-wrap${showEndFade ? ' has-end-fade' : ''}`}>
      <div ref={scrollerRef} className="listing-filter-chips">
        {options.map((opt) => (
          <IonChip
            key={opt.value}
            className={value === opt.value ? 'active-chip' : 'inactive-chip'}
            onClick={() => onChange(opt.value)}
          >
            <IonLabel>{opt.label}</IonLabel>
          </IonChip>
        ))}
      </div>
    </div>
  );
};
