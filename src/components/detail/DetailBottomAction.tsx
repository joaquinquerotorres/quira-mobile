import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import {
  chatbubbleEllipsesOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons';
import './Detail.css';

type SendBidProps = {
  variant: 'send-bid';
  onSend: () => void;
  children?: React.ReactNode;
};

type SentBidProps = {
  variant: 'sent-bid';
  priceLabel: string;
  availability?: string | null;
  comment?: string | null;
  createdAt: string;
  canWithdraw?: boolean;
  onWithdraw?: () => void;
  withdrawing?: boolean;
  children?: React.ReactNode;
};

type CustomProps = {
  variant: 'custom';
  children: React.ReactNode;
};

type DetailBottomActionProps = SendBidProps | SentBidProps | CustomProps;

/**
 * Acciones finales del detalle.
 * - Cliente: las CTAs viven en cada PersonCard de ofertas (`variant` no aplica).
 * - Pro sin propuesta: `send-bid`.
 * - Pro con propuesta: `sent-bid` (resumen + retirar).
 * - Otras acciones (calendario, finalizar…): `custom` o `children`.
 */
export const DetailBottomAction: React.FC<DetailBottomActionProps> = (props) => {
  if (props.variant === 'send-bid') {
    return (
      <div className="detail-bottom-action">
        <IonButton expand="block" className="pro-main-btn" onClick={props.onSend}>
          <IonIcon slot="start" icon={walletOutline} /> ENVIAR PROPUESTA
        </IonButton>
        {props.children}
      </div>
    );
  }

  if (props.variant === 'sent-bid') {
    return (
      <div className="detail-bottom-action">
        <div className="detail-sent-bid-card animate__animated animate__fadeIn">
          <div className="detail-sent-bid-header">
            <IonIcon icon={walletOutline} /> TU PROPUESTA
          </div>
          <div className="detail-sent-bid-row">
            <span>Tu Precio:</span>
            <strong>{props.priceLabel}</strong>
          </div>
          {props.availability && (
            <div className="detail-sent-bid-availability">
              <IonIcon icon={timeOutline} style={{ fontSize: '0.9rem' }} />
              <span>
                Disponibilidad: <strong>{props.availability}</strong>
              </span>
            </div>
          )}
          {props.comment && (
            <div className="detail-sent-bid-comment">
              <IonIcon icon={chatbubbleEllipsesOutline} /> "{props.comment}"
            </div>
          )}
          <div className="detail-sent-bid-footer">
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <IonIcon icon={timeOutline} style={{ marginRight: '4px' }} />
              Enviada el {new Date(props.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {/* Acción destructiva fuera de la caja de éxito (confirmación vía alert en página). */}
        {props.canWithdraw && props.onWithdraw && (
          <div className="detail-sent-bid-withdraw">
            <IonButton
              className="cancel-bid-btn"
              fill="outline"
              color="danger"
              expand="block"
              onClick={() => props.onWithdraw?.()}
              disabled={props.withdrawing}
            >
              {props.withdrawing ? 'Retirando...' : 'Retirar propuesta'}
            </IonButton>
          </div>
        )}
        {props.children}
      </div>
    );
  }

  return <div className="detail-bottom-action">{props.children}</div>;
};
