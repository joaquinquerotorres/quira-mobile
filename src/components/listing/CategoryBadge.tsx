import React from 'react';
import { IonIcon } from '@ionic/react';
import { getCategoryStyle } from '../../utils/categoryStyles';

interface CategoryBadgeProps {
  category: string | { code?: string; name?: string } | null | undefined;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const style = getCategoryStyle(category);
  return (
    <span
      className="listing-category-badge"
      style={{ color: style.color, background: style.bg }}
    >
      <IonIcon icon={style.icon} /> {style.label}
    </span>
  );
};
