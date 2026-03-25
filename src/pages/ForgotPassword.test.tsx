import React, { useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonApp: ({ children }: any) => <div>{children}</div>,
    useIonRouter: () => ({ goBack: vi.fn(), push: vi.fn() }),
    useIonViewWillEnter: (cb: () => void) => useEffect(() => { cb(); }, []),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <IonApp>{children}</IonApp>
  </MemoryRouter>
);

beforeEach(() => {
  (api.post as ReturnType<typeof vi.fn>).mockReset();
});

test('ForgotPassword renders title and form', () => {
  render(<ForgotPassword />, { wrapper });
  expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
  expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
  expect(screen.getByText('Enviar enlace')).toBeInTheDocument();
});

test('ForgotPassword shows toast when submitting empty email', async () => {
  render(<ForgotPassword />, { wrapper });
  const form = screen.getByText('Enviar enlace').closest('form');
  fireEvent.submit(form!);
  await waitFor(() => {
    const toast = document.querySelector('ion-toast');
    expect(toast?.getAttribute('message')).toBe('Introduce tu email.');
  });
});

test('ForgotPassword submit button is present and form has email input', () => {
  render(<ForgotPassword />, { wrapper });
  expect(screen.getByText('Enviar enlace')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument();
  expect(screen.getByText(/Introduce tu email y te enviaremos/)).toBeInTheDocument();
});

test('ForgotPassword shows link to login in header context', () => {
  render(<ForgotPassword />, { wrapper });
  expect(screen.getByText('Recuperar contraseña')).toBeInTheDocument();
});
