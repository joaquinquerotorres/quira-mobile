import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ListingCardFooter } from './ListingCardFooter';
import { FilterChipRow } from './FilterChipRow';
import { ListingCard } from './ListingCard';
import { RequestBidsChip } from './RequestBidsChip';

vi.mock('@ionic/react', () => ({
  IonIcon: ({ icon }: any) => <span data-testid="ion-icon">{String(icon)}</span>,
  IonBadge: ({ children }: any) => <span>{children}</span>,
  IonButton: ({ children, onClick, className }: any) => (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
  IonChip: ({ children, onClick, className }: any) => (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  ),
  IonLabel: ({ children }: any) => <span>{children}</span>,
  IonCard: ({ children, className, onClick }: any) => (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  ),
}));

vi.mock('../shared/RequestMediaModal', () => ({
  RequestMediaChip: ({ photoUrl }: any) =>
    photoUrl ? (
      <button type="button" className="request-media-chip">
        Media
      </button>
    ) : null,
}));

describe('ListingCardFooter', () => {
  test('renders nothing when there is no professional and no action', () => {
    const { container } = render(<ListingCardFooter />);
    expect(container.firstChild).toBeNull();
  });

  test('shows person when assigned', () => {
    render(
      <ListingCardFooter
        personPrefix="Pro:"
        personName="Ana"
        rating={4.8}
      />,
    );
    expect(screen.getByText(/Ana/)).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });
});

describe('FilterChipRow', () => {
  test('renders chip options', () => {
    const onChange = vi.fn();
    render(
      <FilterChipRow
        options={[
          { value: 'ALL', label: 'Todas' },
          { value: 'COMPLETED', label: 'Finalizadas' },
        ]}
        value="ALL"
        onChange={onChange}
      />,
    );
    expect(screen.getByText('Finalizadas')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Finalizadas'));
    expect(onChange).toHaveBeenCalledWith('COMPLETED');
  });
});

describe('RequestBidsChip / ListingCard bids', () => {
  test('RequestBidsChip shows count including zero', () => {
    const { rerender } = render(<RequestBidsChip count={0} />);
    expect(screen.getByText('Propuestas')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    rerender(<RequestBidsChip count={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('ListingCard shows Propuestas left of Media and even without media', () => {
    const { rerender } = render(
      <ListingCard
        status="pending"
        category="PLUMBING"
        title="Grifo"
        bidsCount={2}
        media={{ photoUrl: '/p.jpg' }}
        price={{ variant: 'range', value: '50–80 €' }}
        footer={{}}
      />,
    );
    const propuestas = screen.getByText('Propuestas');
    const media = screen.getByText('Media');
    expect(
      propuestas.compareDocumentPosition(media) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    rerender(
      <ListingCard
        status="pending"
        category="PLUMBING"
        title="Grifo"
        bidsCount={0}
        media={{}}
        price={{ variant: 'range', value: '50–80 €' }}
        footer={{}}
      />,
    );
    expect(screen.getByText('Propuestas')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('Media')).not.toBeInTheDocument();
  });
});
