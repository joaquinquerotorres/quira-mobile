import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { lockClosedOutline } from 'ionicons/icons';
import { MarketOpportunityCard } from './MarketOpportunityCard';

vi.mock('@ionic/react', () => ({
  IonCard: ({ children, onClick }: any) => (
    <div data-testid="ion-card" onClick={onClick}>
      {children}
    </div>
  ),
  IonBadge: ({ children }: any) => <span>{children}</span>,
  IonButton: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  IonIcon: () => <span data-testid="ion-icon" />,
}));

vi.mock('../shared/RequestMediaModal', () => ({
  RequestMediaChip: ({ photoUrl, videoUrl, audioUrl }: any) =>
    photoUrl || videoUrl || audioUrl ? (
      <button type="button">Media</button>
    ) : null,
}));

describe('MarketOpportunityCard', () => {
  const baseRequest: any = {
    id: 1,
    title: 'Arreglo grifo',
    category: 'PLUMBING',
    estimatedPriceMin: 7000,
    estimatedPriceMax: 9000,
    desiredExecutionTime: 'Esta semana',
    client: { fullName: 'Cliente Uno', rating: null, reviewCount: 0 },
  };

  const commonProps = {
    addressInfo: { text: 'Zona: Madrid', icon: lockClosedOutline },
    renderScheduleInfo: () => null as React.ReactNode,
  };

  test('shows reserved title and disables card click when blurry', () => {
    const onCardClick = vi.fn();
    render(
      <MarketOpportunityCard
        request={baseRequest}
        isBidden={false}
        isHigh={false}
        isBlurry={true}
        isLocked={true}
        onCardClick={onCardClick}
        onBidClick={vi.fn()}
        {...commonProps}
      />,
    );

    expect(screen.getByText('Oportunidad Reservada')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ion-card'));
    expect(onCardClick).not.toHaveBeenCalled();
  });

  test('calls onCardClick when not blurry', () => {
    const onCardClick = vi.fn();
    render(
      <MarketOpportunityCard
        request={baseRequest}
        isBidden={false}
        isHigh={false}
        isBlurry={false}
        isLocked={false}
        onCardClick={onCardClick}
        onBidClick={vi.fn()}
        {...commonProps}
      />,
    );
    fireEvent.click(screen.getByTestId('ion-card'));
    expect(onCardClick).toHaveBeenCalled();
    expect(screen.getByText('Rango estimado')).toBeInTheDocument();
    expect(screen.getByText('70€ - 90€')).toBeInTheDocument();
  });

  test('shows bid button label depending on lock', () => {
    const onBidClick = vi.fn((e: any) => e?.stopPropagation?.());
    const { rerender } = render(
      <MarketOpportunityCard
        request={baseRequest}
        isBidden={false}
        isHigh={false}
        isBlurry={false}
        isLocked={true}
        onCardClick={vi.fn()}
        onBidClick={onBidClick}
        {...commonProps}
      />,
    );
    expect(screen.getByText('SOLO PRO')).toBeInTheDocument();

    rerender(
      <MarketOpportunityCard
        request={baseRequest}
        isBidden={false}
        isHigh={false}
        isBlurry={false}
        isLocked={false}
        onCardClick={vi.fn()}
        onBidClick={onBidClick}
        {...commonProps}
      />,
    );
    expect(screen.getByText('ME INTERESA')).toBeInTheDocument();
  });

  test('passes desiredExecutionTime to renderScheduleInfo', () => {
    const renderScheduleInfo = vi.fn(() => <span>DISPONIBILIDAD</span>);
    render(
      <MarketOpportunityCard
        request={baseRequest}
        isBidden={false}
        isHigh={false}
        isBlurry={false}
        isLocked={false}
        addressInfo={{ text: 'Zona: Madrid', icon: lockClosedOutline }}
        onCardClick={vi.fn()}
        onBidClick={vi.fn()}
        renderScheduleInfo={renderScheduleInfo}
      />,
    );

    expect(renderScheduleInfo).toHaveBeenCalledWith('Esta semana');
    expect(screen.getByText('DISPONIBILIDAD')).toBeInTheDocument();
  });

  test('shows Media chip only when request has media', () => {
    const { rerender } = render(
      <MarketOpportunityCard
        request={baseRequest}
        isBidden={false}
        isHigh={false}
        isBlurry={false}
        isLocked={false}
        onCardClick={vi.fn()}
        onBidClick={vi.fn()}
        {...commonProps}
      />,
    );
    expect(screen.queryByText('Media')).not.toBeInTheDocument();

    rerender(
      <MarketOpportunityCard
        request={{ ...baseRequest, photoUrl: '/p.jpg' }}
        isBidden={false}
        isHigh={false}
        isBlurry={false}
        isLocked={false}
        onCardClick={vi.fn()}
        onBidClick={vi.fn()}
        {...commonProps}
      />,
    );
    expect(screen.getByText('Media')).toBeInTheDocument();
  });
});
