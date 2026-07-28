import React from 'react';
import {
  getListingStatusTokens,
  type ListingStatusKey,
} from '../../utils/listingStatus';

interface StatusBadgeProps {
  status: ListingStatusKey;
  label: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className,
}) => {
  const { badgeClass } = getListingStatusTokens(status);
  return (
    <span
      className={`listing-status-badge ${badgeClass}${className ? ` ${className}` : ''}`}
    >
      {label}
    </span>
  );
};
