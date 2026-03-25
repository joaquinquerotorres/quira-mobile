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

test('NewRequestLocation renders label and GPS button', () => {
  render(
    <NewRequestLocation
      address=""
      onAddressSelect={vi.fn()}
      onGetCurrentLocation={vi.fn()}
      googleApiKey="test-key"
    />,
    { wrapper }
  );
  expect(screen.getByText('Ubicación aproximada')).toBeInTheDocument();
  expect(screen.getByTestId('google-places-autocomplete')).toBeInTheDocument();
});

test('NewRequestLocation calls onGetCurrentLocation when GPS button clicked', () => {
  const onGetCurrentLocation = vi.fn();
  const { container } = render(
    <NewRequestLocation
      address=""
      onAddressSelect={vi.fn()}
      onGetCurrentLocation={onGetCurrentLocation}
      googleApiKey="test"
    />,
    { wrapper }
  );
  const gpsBtn = container.querySelector('ion-button.gps-btn');
  expect(gpsBtn).toBeInTheDocument();
  if (gpsBtn) fireEvent.click(gpsBtn);
  expect(onGetCurrentLocation).toHaveBeenCalled();
});
