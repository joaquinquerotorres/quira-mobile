import { IonIcon } from '@ionic/react';
import { searchOutline, filterOutline, closeOutline } from 'ionicons/icons';
import './SearchText.css';

interface Props {
  value: string;
  onChange: (val: string) => void;
  onFilterClick: () => void;
  onSearch: () => void;
  placeholder: string;
  isFilterActive?: boolean;
}

export const SearchText: React.FC<Props> = ({ value, onChange, onFilterClick, onSearch, placeholder, isFilterActive }) => (
  <div className="search-text-container">
    <div className="search-card-style real-search-wrapper">
      <IonIcon icon={searchOutline} />
      <input 
        className="real-search-input" 
        placeholder={placeholder} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
      />
      {value && <IonIcon icon={closeOutline} onClick={() => onChange('')} className="clear-icon" />}
    </div>
    <div className="filter-btn-square" onClick={onFilterClick}>
      <IonIcon icon={filterOutline} style={{ color: isFilterActive ? 'var(--ion-color-primary)' : '#1e293b' }} />
    </div>
  </div>
);