import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from '../api/axios';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <IonApp>{children}</IonApp>
  </MemoryRouter>
);

beforeEach(() => {
  vi.mocked(api.post).mockReset();
  vi.mocked(api.get).mockReset();
});

test('Login renders Quira logo and slogan', () => {
  render(<Login />, { wrapper });
  expect(screen.getByText('Qu')).toBeInTheDocument();
  expect(screen.getByText('Tú descansa, Quira se encarga.')).toBeInTheDocument();
});

test('Login renders email and password inputs', () => {
  render(<Login />, { wrapper });
  expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
});

test('Login renders Entrar and social login buttons', () => {
  render(<Login />, { wrapper });
  expect(screen.getByText('Entrar')).toBeInTheDocument();
  expect(screen.getByText('Google')).toBeInTheDocument();
  expect(screen.getByText('Apple')).toBeInTheDocument();
  expect(screen.getByText('Regístrate con Email')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Privacidad y protección de datos' })).toHaveAttribute(
    'href',
    'https://quira.app/privacidad/index.html',
  );
});

test('Login shows error on failed API call', async () => {
  vi.mocked(api.post).mockRejectedValue(new Error('Network error'));
  render(<Login />, { wrapper });
  fireEvent.click(screen.getByText('Entrar'));
  await screen.findByText(/Credenciales incorrectas|error/i);
});
