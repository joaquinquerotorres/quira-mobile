import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRequestLocation } from './NewRequestLocation';
import {
  CORDOBA_APPROX_PLACEHOLDER,
  CORDOBA_PROVINCE_BOUNDS,
} from '../../utils/cordobaPlaces';

const mockPlacesProps = vi.fn();

vi.mock('react-google-places-autocomplete', () => ({
  default: (props: any) => {
    mockPlacesProps(props);
    return (
      <div data-testid="google-places-autocomplete">
        <input
          data-testid="places-input"
          placeholder={props.selectProps.placeholder}
          value={props.selectProps.value?.label ?? ''}
          onChange={(e: any) =>
            props.selectProps.onChange?.({
              label: e.target.value,
              value: e.target.value,
            })
          }
        />
      </div>
    );
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

beforeEach(() => {
  mockPlacesProps.mockClear();
});

test('NewRequestLocation renders label and Córdoba-oriented placeholder', () => {
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
  expect(screen.getByPlaceholderText(CORDOBA_APPROX_PLACEHOLDER)).toBeInTheDocument();
});

test('NewRequestLocation passes Córdoba bounds + strictBounds to Places', () => {
  render(
    <NewRequestLocation
      address=""
      onAddressSelect={vi.fn()}
      googleApiKey="test-key"
    />,
    { wrapper }
  );
  expect(mockPlacesProps).toHaveBeenCalled();
  const req = mockPlacesProps.mock.calls[0][0].autocompletionRequest;
  expect(req.componentRestrictions).toEqual({ country: ['es'] });
  expect(req.strictBounds).toBe(true);
  expect(req.bounds).toEqual(CORDOBA_PROVINCE_BOUNDS);
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
