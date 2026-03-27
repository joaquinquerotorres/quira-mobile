import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

import api from '../api/axios';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <IonApp>{children}</IonApp>
  </MemoryRouter>
);

beforeEach(() => {
  vi.mocked(api.post).mockReset();
});

test('Register renders Quira logo and title', () => {
  render(<Register />, { wrapper });
  expect(screen.getByText('Qu')).toBeInTheDocument();
  expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument();
});

test('Register renders form inputs', () => {
  render(<Register />, { wrapper });
  expect(screen.getByPlaceholderText('Ej. Juan Pérez')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('tu@email.com')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument();
});

test('Register renders submit and login link', () => {
  render(<Register />, { wrapper });
  expect(screen.getByText('COMENZAR AHORA')).toBeInTheDocument();
  expect(screen.getByText('Inicia Sesión')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /información sobre privacidad y datos personales/i })).toHaveAttribute(
    'href',
    'https://quira.app/privacidad/index.html',
  );
});

test('Register does not call API when fields are empty', async () => {
  render(<Register />, { wrapper });
  await act(async () => {
    fireEvent.submit(screen.getByTestId('register-form'));
  });
  expect(api.post).not.toHaveBeenCalled();
});

test('Register calls API on valid submit', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  render(<Register />, { wrapper });

  const fireIonInput = (el: HTMLElement, value: string) => {
    fireEvent(el, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
  };
  fireIonInput(screen.getByPlaceholderText('Ej. Juan Pérez'), 'Juan Pérez');
  fireIonInput(screen.getByPlaceholderText('tu@email.com'), 'juan@test.com');
  fireIonInput(screen.getByPlaceholderText('Mínimo 6 caracteres'), 'password123');

  fireEvent.submit(screen.getByTestId('register-form'));

  await screen.findByText(/CREANDO|Registrando/i);
  expect(api.post).toHaveBeenCalledWith('/users', {
    email: 'juan@test.com',
    password: 'password123',
    clientProfile: { fullName: 'Juan Pérez' },
  });
});
