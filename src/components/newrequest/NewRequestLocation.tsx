import React from 'react';
import { IonLabel } from '@ionic/react';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import {
  CORDOBA_APPROX_PLACEHOLDER,
  cordobaAutocompletionRequest,
} from '../../utils/cordobaPlaces';

interface NewRequestLocationProps {
  address: string;
  onAddressSelect: (value: { label: string; value: string } | null) => void;
  googleApiKey: string;
}

export const NewRequestLocation: React.FC<NewRequestLocationProps> = ({
  address,
  onAddressSelect,
  googleApiKey,
}) => (
  <div style={{ marginBottom: '30px' }}>
    <IonLabel className="section-label">Ubicación aproximada</IonLabel>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <div
        className="input-wrapper"
        style={{ flex: 1, padding: 0, overflow: 'visible', zIndex: 1000 }}
      >
        <GooglePlacesAutocomplete
          apiKey={googleApiKey}
          selectProps={{
            value: address ? { label: address, value: address } : null,
            onChange: onAddressSelect,
            isClearable: true,
            placeholder: CORDOBA_APPROX_PLACEHOLDER,
            styles: {
              container: (provided: any) => ({ ...provided, width: '100%' }),
              control: (provided: any) => ({
                ...provided,
                border: 'none',
                boxShadow: 'none',
                minHeight: '52px',
                paddingLeft: '15px',
                backgroundColor: 'transparent',
              }),
              input: (provided: any) => ({
                ...provided,
                color: '#1e293b',
                fontWeight: 600,
              }),
              placeholder: (provided: any) => ({
                ...provided,
                color: '#94a3b8',
              }),
              indicatorSeparator: () => ({ display: 'none' }),
              dropdownIndicator: () => ({ display: 'none' }),
              menu: (provided: any) => ({
                ...provided,
                width: '100%',
                left: 0,
                zIndex: 9999,
                borderRadius: '16px',
                marginTop: '8px',
                border: '1px solid #f1f5f9',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
              }),
              option: (provided: any, state: any) => ({
                ...provided,
                backgroundColor: state.isSelected ? '#f1f5f9' : 'white',
                color: '#1e293b',
                fontWeight: 500,
                padding: '12px 16px',
                cursor: 'pointer',
              }),
            },
          }}
          autocompletionRequest={cordobaAutocompletionRequest()}
        />
      </div>
    </div>
  </div>
);
