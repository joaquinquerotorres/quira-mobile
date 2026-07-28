import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ListingCardFooter } from './ListingCardFooter';
import { FilterChipRow } from './FilterChipRow';

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
}));

describe('ListingCardFooter', () => {
  test('shows waiting copy when there is no professional', () => {
    render(<ListingCardFooter emptyText="Esperando propuestas" />);
    expect(screen.getByText('Esperando propuestas')).toBeInTheDocument();
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
