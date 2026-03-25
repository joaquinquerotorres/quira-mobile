import React from 'react';
import { IonIcon } from '@ionic/react';
import { searchOutline, closeOutline } from 'ionicons/icons';

interface DirectorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const DirectorySearchBar: React.FC<DirectorySearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Buscar por nombre...',
}) => (
  <div
    className="search-card-style real-search-wrapper"
    style={{ marginBottom: '20px' }}
  >
    <IonIcon icon={searchOutline} style={{ color: 'var(--ion-color-primary)' }} />
    <input
      type="text"
      className="real-search-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {value && (
      <IonIcon
        icon={closeOutline}
        onClick={() => onChange('')}
        style={{ color: '#94a3b8', fontSize: '1.2rem' }}
      />
    )}
  </div>
);
