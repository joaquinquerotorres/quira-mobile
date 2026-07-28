import React from 'react';
import { IonBadge, IonIcon } from '@ionic/react';
import { chatboxEllipsesOutline, chevronForwardOutline } from 'ionicons/icons';
import './Detail.css';

interface QuestionsRowProps {
  questionsCount: number;
  /**
   * Subtítulo cuando no hay preguntas.
   * Cliente: "Nadie ha preguntado aún" | Pro: "No hay preguntas todavía"
   */
  emptySubtitle?: string;
  /**
   * Formato con preguntas: `count` → "N pregunta(s)" | `resolved` → "N pregunta(s) resuelta(s)"
   */
  countFormat?: 'count' | 'resolved';
  pendingAnswers?: number;
  onClick: () => void;
  className?: string;
}

export const QuestionsRow: React.FC<QuestionsRowProps> = ({
  questionsCount,
  emptySubtitle = 'No hay preguntas todavía',
  countFormat = 'resolved',
  pendingAnswers = 0,
  onClick,
  className,
}) => {
  let subtitle: string;
  if (questionsCount === 0) {
    subtitle = emptySubtitle;
  } else if (countFormat === 'resolved') {
    subtitle = `${questionsCount} pregunta${questionsCount > 1 ? 's' : ''} resuelta${
      questionsCount > 1 ? 's' : ''
    }`;
  } else {
    subtitle = `${questionsCount} pregunta${questionsCount > 1 ? 's' : ''}`;
  }

  return (
    <div
      className={`detail-questions-row${className ? ` ${className}` : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick();
      }}
    >
      <div className="detail-questions-icon">
        <IonIcon icon={chatboxEllipsesOutline} />
      </div>
      <div className="detail-questions-copy">
        <div className="detail-questions-title">Preguntas y Dudas</div>
        <div className="detail-questions-subtitle">
          <span>{subtitle}</span>
          {pendingAnswers > 0 && (
            <IonBadge color="danger" style={{ fontSize: '0.7rem' }}>
              Requiere atención
            </IonBadge>
          )}
        </div>
      </div>
      <IonIcon icon={chevronForwardOutline} color="medium" />
    </div>
  );
};
