import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BecomeProTierSelector } from './BecomeProTierSelector';

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

test('BecomeProTierSelector renders all tier cards', () => {
  render(
    <BecomeProTierSelector
      selectedTier="SOLVER"
      onSelectTier={vi.fn()}
      onContinue={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Starter')).toBeInTheDocument();
  expect(screen.getByText('Solver')).toBeInTheDocument();
  expect(screen.getByText('Profesional')).toBeInTheDocument();
  expect(screen.getByText('RECOMENDADO')).toBeInTheDocument();
});

test('BecomeProTierSelector calls onSelectTier when tier card is clicked', () => {
  const onSelectTier = vi.fn();
  render(
    <BecomeProTierSelector
      selectedTier="FREE"
      onSelectTier={onSelectTier}
      onContinue={vi.fn()}
    />,
    { wrapper }
  );
  fireEvent.click(screen.getByText('Solver'));
  expect(onSelectTier).toHaveBeenCalledWith('SOLVER');
});

test('BecomeProTierSelector calls onContinue when button is clicked', () => {
  const onContinue = vi.fn();
  render(
    <BecomeProTierSelector
      selectedTier="PRO"
      onSelectTier={vi.fn()}
      onContinue={onContinue}
    />,
    { wrapper }
  );
  fireEvent.click(screen.getByText(/CONTINUAR COMO PRO/));
  expect(onContinue).toHaveBeenCalled();
});

test('BecomeProTierSelector shows correct prices for SOLVER and PRO', () => {
  render(
    <BecomeProTierSelector
      selectedTier="SOLVER"
      onSelectTier={vi.fn()}
      onContinue={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('4,99€/mes')).toBeInTheDocument();
  expect(screen.getByText('11,99€/mes')).toBeInTheDocument();
});
