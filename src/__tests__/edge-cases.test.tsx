/**
 * Tests para casos edge: loading, errores, estados vacíos
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { BecomeProForm } from '../components/becomepro';
import type { BecomeProFormData } from '../components/becomepro';

const emptyFormData: BecomeProFormData = {
  fullName: '',
  phoneNumber: '',
  taxId: '',
  bio: '',
  selectedSkills: [],
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <IonApp>{children}</IonApp>
);

describe('BecomeProForm loading state', () => {
  test('shows PROCESANDO when loading', () => {
    render(
      <BecomeProForm
        selectedTier="SOLVER"
        formData={emptyFormData}
        onFormChange={vi.fn()}
        onToggleSkill={vi.fn()}
        onSubmit={vi.fn()}
        loading={true}
        isUpgrading={false}
      />,
      { wrapper }
    );
    expect(screen.getByText('PROCESANDO...')).toBeInTheDocument();
  });

  test('shows loading text when loading', () => {
    render(
      <BecomeProForm
        selectedTier="SOLVER"
        formData={emptyFormData}
        onFormChange={vi.fn()}
        onToggleSkill={vi.fn()}
        onSubmit={vi.fn()}
        loading={true}
        isUpgrading={false}
      />,
      { wrapper }
    );
    expect(screen.getByText('PROCESANDO...')).toBeInTheDocument();
  });
});

describe('BecomeProForm empty state', () => {
  test('renders with empty form data', () => {
    render(
      <BecomeProForm
        selectedTier="SOLVER"
        formData={emptyFormData}
        onFormChange={vi.fn()}
        onToggleSkill={vi.fn()}
        onSubmit={vi.fn()}
        loading={false}
        isUpgrading={false}
      />,
      { wrapper }
    );
    expect(screen.getByPlaceholderText('Ej. Reformas García')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('600 000 000')).toBeInTheDocument();
  });

  test('shows ACTUALIZAR when isUpgrading', () => {
    render(
      <BecomeProForm
        selectedTier="PRO"
        formData={emptyFormData}
        onFormChange={vi.fn()}
        onToggleSkill={vi.fn()}
        onSubmit={vi.fn()}
        loading={false}
        isUpgrading={true}
      />,
      { wrapper }
    );
    expect(screen.getByText('ACTUALIZAR MI PLAN')).toBeInTheDocument();
  });
});
