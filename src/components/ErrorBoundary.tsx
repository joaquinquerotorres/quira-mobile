import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IonPage, IonContent, IonButton } from '@ionic/react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <IonPage>
          <IonContent className="ion-padding">
            <div className="error-boundary">
              <h1>Algo ha ido mal</h1>
              <p>Se ha producido un error inesperado. Por favor, intenta recargar la aplicación.</p>
              <IonButton expand="block" onClick={this.handleReload}>
                Recargar aplicación
              </IonButton>
            </div>
          </IonContent>
        </IonPage>
      );
    }
    return this.props.children;
  }
}
