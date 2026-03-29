import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
/** Simula entorno no nativo (Vitest/jsdom); el producto solo distribuye Android e iOS. */
const capacitorMock = vi.hoisted(() => ({
  isNativePlatform: vi.fn(() => false),
  getPlatform: vi.fn(() => 'web' as const),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: capacitorMock,
}));

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
  capacitorMock.isNativePlatform.mockReturnValue(false);
  capacitorMock.getPlatform.mockReturnValue('web');
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

test('Login renders Entrar and Google; Apple solo en iOS nativo', () => {
  render(<Login />, { wrapper });
  expect(screen.getByText('Entrar')).toBeInTheDocument();
  expect(screen.getByText('Google')).toBeInTheDocument();
  expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  expect(screen.getByText('Regístrate con Email')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Privacidad y protección de datos' })).toHaveAttribute(
    'href',
    'https://quira.app/privacidad/index.html',
  );
});

test('Login muestra Apple cuando la plataforma es iOS nativa', () => {
  capacitorMock.isNativePlatform.mockReturnValue(true);
  capacitorMock.getPlatform.mockReturnValue('ios');
  render(<Login />, { wrapper });
  expect(screen.getByText('Apple')).toBeInTheDocument();
});

test('Login muestra error en IonAlert (sin duplicar toast) ante fallo de API', async () => {
  vi.mocked(api.post).mockRejectedValue(new Error('Network error'));
  render(<Login />, { wrapper });
  fireEvent.click(screen.getByText('Entrar'));
  await waitFor(() => {
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
  expect(
    screen.getByText('Credenciales incorrectas o error de conexión'),
  ).toBeInTheDocument();
  expect(screen.getByText('Entendido')).toBeInTheDocument();
});
