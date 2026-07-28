import React from 'react';
import { CategoryBadge } from '../listing/CategoryBadge';
import '../listing/ListingCard.css';
import './Detail.css';

interface JobDetailsSectionProps {
  /** "Descripción del problema" (cliente) o "Detalles del trabajo" (pro). */
  title: string;
  category: string | { code?: string; name?: string } | null | undefined;
  description?: string | null;
  clientOriginalDescription?: string | null;
  /** "Tu texto original" | "Texto del cliente" */
  originalLabel?: string;
  technicalLabel?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Descripción + CategoryBadge. La disponibilidad vive en InfoBox aparte
 * (mismo criterio en cliente y profesional).
 */
export const JobDetailsSection: React.FC<JobDetailsSectionProps> = ({
  title,
  category,
  description,
  clientOriginalDescription,
  originalLabel = 'Texto del cliente',
  technicalLabel = 'Valoración técnica (IA)',
  children,
  className,
}) => {
  const original = clientOriginalDescription?.trim();
  const hasBody = Boolean(original || description || children);
  if (!hasBody && !category) return null;

  return (
    <div className={`detail-job-section${className ? ` ${className}` : ''}`}>
      <div className="detail-job-section-header">{title}</div>
      <div className="detail-job-section-body">
        {original ? (
          <>
            <div className="detail-job-section-sublabel">{originalLabel}</div>
            <p style={{ marginBottom: 16 }}>{original}</p>
            <div className="detail-job-section-sublabel">{technicalLabel}</div>
          </>
        ) : null}

        {category != null && category !== '' && (
          <div className="detail-job-section-category">
            <CategoryBadge category={category} />
          </div>
        )}

        {description ? <p>{description}</p> : null}
        {children}
      </div>
    </div>
  );
};
