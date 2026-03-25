import './FilterModal.css';
import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent
} from '@ionic/react';
import { closeOutline, trashOutline } from 'ionicons/icons';

interface Props {
  isOpen: boolean;
  onDismiss: () => void;
  title: string;
  resultsCount: number;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode;
  initialBreakpoint?: number;
  breakpoints?: number[];
}

export const FilterModal: React.FC<Props> = ({
  isOpen,
  onDismiss,
  title,
  resultsCount,
  onApply,
  onClear,
  children,
  initialBreakpoint = 0.55,
  breakpoints = [0, 0.55, 0.8]
}) => {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      initialBreakpoint={initialBreakpoint}
      breakpoints={breakpoints}
    >
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle style={{ fontWeight: 900 }}>{title}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss} color="medium">
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {children}

        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <IonButton
            expand="block"
            onClick={onApply}
          >
            VER {resultsCount} RESULTADOS
          </IonButton>

          <IonButton
            expand="block"
            fill="clear"
            color="medium"
            onClick={onClear}
          >
            <IonIcon slot="start" icon={trashOutline} />
            LIMPIAR FILTROS
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};
