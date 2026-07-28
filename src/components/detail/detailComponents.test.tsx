import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { InfoBox, InfoBoxRow, PRICE_RANGE_DISCLAIMER } from './InfoBox';
import { QuestionsRow } from './QuestionsRow';
import { DetailHeroHeader } from './DetailHeroHeader';
import { PersonCard } from './PersonCard';

vi.mock('@ionic/react', () => ({
  IonIcon: ({ icon }: any) => <span data-testid="ion-icon">{String(icon)}</span>,
  IonBadge: ({ children }: any) => <span data-testid="ion-badge">{children}</span>,
  IonButton: ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  IonAvatar: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../utils/mediaUrl', () => ({
  resolveMediaUrl: (u: string) => u,
}));

describe('InfoBox', () => {
  test('renders label, value and optional subtext', () => {
    render(
      <InfoBox
        icon="cash"
        label="Rango estimado"
        value="70€ - 90€"
        subtext={PRICE_RANGE_DISCLAIMER}
        tone="peach"
      />,
    );
    expect(screen.getByText('Rango estimado')).toBeInTheDocument();
    expect(screen.getByText('70€ - 90€')).toBeInTheDocument();
    expect(screen.getByText(PRICE_RANGE_DISCLAIMER)).toBeInTheDocument();
  });

  test('supports half width mode in a row', () => {
    const { container } = render(
      <InfoBoxRow>
        <InfoBox width="half" icon="cash" label="Rango" value="70€" />
        <InfoBox width="half" icon="cal" label="Disponibilidad" value="Ya" />
      </InfoBoxRow>,
    );
    expect(container.querySelectorAll('.detail-info-box--half')).toHaveLength(2);
    expect(container.querySelector('.detail-info-box-row')).toBeInTheDocument();
  });
});

describe('PersonCard', () => {
  test('shows empty ratings copy instead of star dash zero', () => {
    render(<PersonCard name="Ana" rating={null} reviewCount={0} />);
    expect(screen.getByText('Sin valoraciones todavía')).toBeInTheDocument();
    expect(screen.queryByText('(0)')).not.toBeInTheDocument();
  });

  test('shows star rating when there are reviews', () => {
    render(<PersonCard name="Luis" rating={4.5} reviewCount={3} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
    expect(screen.queryByText('Sin valoraciones todavía')).not.toBeInTheDocument();
  });
});

describe('QuestionsRow', () => {
  test('shows empty subtitle and fires onClick', () => {
    const onClick = vi.fn();
    render(
      <QuestionsRow
        questionsCount={0}
        emptySubtitle="Nadie ha preguntado aún"
        countFormat="count"
        onClick={onClick}
      />,
    );
    expect(screen.getByText('Preguntas y Dudas')).toBeInTheDocument();
    expect(screen.getByText('Nadie ha preguntado aún')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Preguntas y Dudas'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('DetailHeroHeader', () => {
  test('renders StatusBadge and title', () => {
    render(
      <DetailHeroHeader status="available" statusLabel="Disponible" title="Arreglo grifo" />,
    );
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('Arreglo grifo')).toBeInTheDocument();
  });
});
