import React from 'react';
import { IonLabel, IonTextarea, IonIcon, IonButton } from '@ionic/react';
import { cameraOutline, trashOutline } from 'ionicons/icons';

interface NewRequestInputTextProps {
  photoBase64: string | null;
  userDescription: string;
  onOpenPhotoOptions: () => void;
  onDescriptionChange: (value: string) => void;
  onDeletePhoto: () => void;
}

export const NewRequestInputText: React.FC<NewRequestInputTextProps> = ({
  photoBase64,
  userDescription,
  onOpenPhotoOptions,
  onDeletePhoto,
  onDescriptionChange,
}) => (
  <div className="animate__animated animate__fadeIn">
    <div className="photo-upload-container compact" onClick={!photoBase64 ? onOpenPhotoOptions : undefined}>
      {photoBase64 ? (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <img
            src={photoBase64}
            alt="Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <IonButton
            fill="clear"
            size="small"
            className="delete-media-btn-overlay"
            onClick={(e) => {
              e.stopPropagation();
              onDeletePhoto();
            }}
            aria-label="Eliminar foto"
          >
            <IonIcon slot="icon-only" icon={trashOutline} />
          </IonButton>
        </div>
      ) : (
        <div className="photo-upload-label">
          <IonIcon
            icon={cameraOutline}
            style={{
              fontSize: '28px',
              color: 'var(--ion-color-primary)',
              marginBottom: '5px',
            }}
          />
          <p
            style={{
              fontWeight: 700,
              margin: 0,
              color: '#1e293b',
              fontSize: '0.9rem',
            }}
          >
            Añadir foto (Opcional)
          </p>
        </div>
      )}
    </div>

    <div style={{ marginBottom: '24px' }}>
      <IonLabel className="section-label">Descripción</IonLabel>
      <div className="input-wrapper textarea-wrapper">
        <IonTextarea
          rows={4}
          placeholder="Escribe aquí qué necesitas..."
          value={userDescription}
          onIonInput={(e) => onDescriptionChange(e.detail.value || '')}
        />
      </div>
    </div>
  </div>
);
