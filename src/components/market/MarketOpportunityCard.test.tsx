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

vi.mock('../shared/RequestMediaThumb', () => ({
  RequestMediaThumb: () => <div data-testid="thumb" />,
}));

describe('MarketOpportunityCard', () => {
  const baseRequest: any = {
    id: 1,
    title: 'Arreglo grifo',
    category: 'PLUMBING',
    estimatedPriceMin: 7000,
    estimatedPriceMax: 9000,
    client: { fullName: 'Cliente Uno', rating: null, reviewCount: 0 },
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
        addressInfo={{ text: 'Zona: Madrid', icon: lockClosedOutline }}
        playingAudioId={null}
        onToggleAudio={vi.fn()}
        onCardClick={onCardClick}
        onBidClick={vi.fn()}
        serverUrl=""
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
        addressInfo={{ text: 'Zona: Madrid', icon: lockClosedOutline }}
        playingAudioId={null}
        onToggleAudio={vi.fn()}
        onCardClick={onCardClick}
        onBidClick={vi.fn()}
        serverUrl=""
      />,
    );
    fireEvent.click(screen.getByTestId('ion-card'));
    expect(onCardClick).toHaveBeenCalled();
    expect(screen.getByText('Rango IA')).toBeInTheDocument();
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
        addressInfo={{ text: 'Zona: Madrid', icon: lockClosedOutline }}
        playingAudioId={null}
        onToggleAudio={vi.fn()}
        onCardClick={vi.fn()}
        onBidClick={onBidClick}
        serverUrl=""
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
        addressInfo={{ text: 'Zona: Madrid', icon: lockClosedOutline }}
        playingAudioId={null}
        onToggleAudio={vi.fn()}
        onCardClick={vi.fn()}
        onBidClick={onBidClick}
        serverUrl=""
      />,
    );
    expect(screen.getByText('ME INTERESA')).toBeInTheDocument();
  });
});

