import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from './RegisterForm';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <IonApp>{children}</IonApp>
  </MemoryRouter>
);

const defaultProps = {
  fullName: '',
  email: '',
  password: '',
  loading: false,
  onFullNameChange: vi.fn(),
  onEmailChange: vi.fn(),
  onPasswordChange: vi.fn(),
  onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
};

test('RegisterForm renders all inputs', () => {
  render(<RegisterForm {...defaultProps} />, { wrapper });
  expect(screen.getByPlaceholderText('Ej. Juan Pérez')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument();
});

test('RegisterForm calls handlers on input', () => {
  const onFullNameChange = vi.fn();
  const onEmailChange = vi.fn();
  const onPasswordChange = vi.fn();
  render(
    <RegisterForm
      {...defaultProps}
      onFullNameChange={onFullNameChange}
      onEmailChange={onEmailChange}
      onPasswordChange={onPasswordChange}
    />,
    { wrapper }
  );

  const fireIonInput = (el: HTMLElement, value: string) => {
    fireEvent(el, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
  };
  fireIonInput(screen.getByPlaceholderText('Ej. Juan Pérez'), 'María');
  fireIonInput(screen.getByPlaceholderText('tu@email.com'), 'maria@test.com');
  fireIonInput(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'secret');

  expect(onFullNameChange).toHaveBeenCalledWith('María');
  expect(onEmailChange).toHaveBeenCalledWith('maria@test.com');
  expect(onPasswordChange).toHaveBeenCalledWith('secret');
});

test('RegisterForm calls onSubmit on submit', () => {
  const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
  render(<RegisterForm {...defaultProps} onSubmit={onSubmit} />, { wrapper });
  fireEvent.submit(screen.getByTestId('register-form'));
  expect(onSubmit).toHaveBeenCalled();
});

test('RegisterForm shows CREANDO when loading', () => {
  render(<RegisterForm {...defaultProps} loading />, { wrapper });
  expect(screen.getByText('CREANDO...')).toBeInTheDocument();
});
