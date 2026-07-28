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
  test('renders emptyCta instead of passive emptyText', () => {
    const onClick = vi.fn();
    render(
      <ListingCardFooter
        emptyText="Sin profesional asignado"
        emptyCta={{ label: 'Buscar profesional', onClick }}
      />,
    );
    expect(screen.getByText('Buscar profesional')).toBeInTheDocument();
    expect(screen.queryByText('Sin profesional asignado')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Buscar profesional'));
    expect(onClick).toHaveBeenCalled();
  });

  test('keeps emptyText when there is no emptyCta', () => {
    render(<ListingCardFooter emptyText="Sin profesional asignado" />);
    expect(screen.getByText('Sin profesional asignado')).toBeInTheDocument();
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
