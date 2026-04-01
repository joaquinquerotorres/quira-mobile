import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { BecomeProForm, type BecomeProFormData } from './BecomeProForm';

const defaultFormData: BecomeProFormData = {
  fullName: '',
  phoneNumber: '',
  address: '',
  taxId: '',
  bio: '',
  selectedSkills: [],
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <IonApp>{children}</IonApp>
);

const baseProps = {
  onAddressSelect: vi.fn(),
  onUseCurrentLocation: vi.fn(),
  mapRef: React.createRef<HTMLDivElement>(),
  googleAutocompleteStyles: {},
  googleApiKey: '',
};

test('BecomeProForm renders all fields', () => {
  render(
    <BecomeProForm
      selectedTier="SOLVER"
      formData={defaultFormData}
      onFormChange={vi.fn()}
      onToggleSkill={vi.fn()}
      onSubmit={vi.fn()}
      {...baseProps}
      loading={false}
      isUpgrading={false}
    />,
    { wrapper }
  );
  expect(screen.getByPlaceholderText('Ej. Reformas García')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('600 000 000')).toBeInTheDocument();
  expect(screen.getByText('Dirección base *')).toBeInTheDocument();
  expect(screen.getByTestId('google-places-autocomplete')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('B12345678')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Cuéntanos tu experiencia...')).toBeInTheDocument();
  expect(screen.getByText('Habilidades')).toBeInTheDocument();
  expect(screen.getByText('Albañilería')).toBeInTheDocument();
});

test('BecomeProForm shows CIF required error when PRO tier and no taxId', () => {
  render(
    <BecomeProForm
      selectedTier="PRO"
      formData={{ ...defaultFormData, taxId: '' }}
      onFormChange={vi.fn()}
      onToggleSkill={vi.fn()}
      onSubmit={vi.fn()}
      {...baseProps}
      loading={false}
      isUpgrading={false}
    />,
    { wrapper }
  );
  expect(screen.getByText('Necesario para cuenta PRO')).toBeInTheDocument();
});

test('BecomeProForm calls onToggleSkill when skill chip is clicked', () => {
  const onToggleSkill = vi.fn();
  render(
    <BecomeProForm
      selectedTier="SOLVER"
      formData={defaultFormData}
      onFormChange={vi.fn()}
      onToggleSkill={onToggleSkill}
      onSubmit={vi.fn()}
      {...baseProps}
      loading={false}
      isUpgrading={false}
    />,
    { wrapper }
  );
  fireEvent.click(screen.getByText('Albañilería'));
  expect(onToggleSkill).toHaveBeenCalledWith('MASONRY');
});

test('BecomeProForm has submit button', () => {
  render(
    <BecomeProForm
      selectedTier="SOLVER"
      formData={defaultFormData}
      onFormChange={vi.fn()}
      onToggleSkill={vi.fn()}
      onSubmit={vi.fn()}
      {...baseProps}
      loading={false}
      isUpgrading={false}
    />,
    { wrapper }
  );
  expect(screen.getByText('FINALIZAR REGISTRO')).toBeInTheDocument();
});
