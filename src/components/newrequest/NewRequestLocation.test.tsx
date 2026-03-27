import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRequestLocation } from './NewRequestLocation';

vi.mock('react-google-places-autocomplete', () => ({
  default: ({ selectProps }: any) => (
    <div data-testid="google-places-autocomplete">
      <input
        data-testid="places-input"
        placeholder={selectProps.placeholder}
        value={selectProps.value?.label ?? ''}
        onChange={(e: any) => selectProps.onChange?.({ label: e.target.value, value: e.target.value })}
      />
    </div>
  ),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

test('NewRequestLocation renders label and autocomplete input', () => {
  render(
    <NewRequestLocation
      address=""
      onAddressSelect={vi.fn()}
      googleApiKey="test-key"
    />,
    { wrapper }
  );
  expect(screen.getByText('Ubicación aproximada')).toBeInTheDocument();
  expect(screen.getByTestId('google-places-autocomplete')).toBeInTheDocument();
});

test('NewRequestLocation calls onAddressSelect when typing', () => {
  const onAddressSelect = vi.fn();
  render(
    <NewRequestLocation
      address=""
      onAddressSelect={onAddressSelect}
      googleApiKey="test"
    />,
    { wrapper }
  );
  const input = screen.getByTestId('places-input');
  fireEvent.change(input, { target: { value: 'Santa Rosa, Córdoba, España' } });
  expect(onAddressSelect).toHaveBeenCalledWith({
    label: 'Santa Rosa, Córdoba, España',
    value: 'Santa Rosa, Córdoba, España',
  });
});
