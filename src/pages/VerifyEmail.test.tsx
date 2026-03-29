import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import VerifyEmail from './VerifyEmail';
import { confirmEmailWithToken } from '../api/verifyEmailApi';
import { refreshCurrentUserInStorage } from '../utils/refreshCurrentUser';
import { clearStorage } from '../setupTests';

vi.mock('../api/verifyEmailApi', () => ({
  confirmEmailWithToken: vi.fn(),
}));

vi.mock('../utils/refreshCurrentUser', () => ({
  refreshCurrentUserInStorage: vi.fn(() => Promise.resolve(false)),
}));

beforeEach(() => {
  clearStorage();
  vi.mocked(confirmEmailWithToken).mockReset();
  vi.mocked(refreshCurrentUserInStorage).mockReset();
  vi.mocked(refreshCurrentUserInStorage).mockResolvedValue(false);
});

test('VerifyEmail sin token muestra error y enlaces', async () => {
  render(
    <MemoryRouter initialEntries={['/verify-email']}>
      <IonApp>
        <Route path="/verify-email" component={VerifyEmail} />
      </IonApp>
    </MemoryRouter>,
  );
  await waitFor(() => {
    expect(screen.getByText('Verificación fallida')).toBeInTheDocument();
  });
  expect(
    screen.getByText(
      'Falta el enlace de verificación. Abre el correo y pulsa el botón, o pide un nuevo correo desde Perfil.',
    ),
  ).toBeInTheDocument();
  const reenviar = screen.getByText('Reenviar correo de verificación');
  expect(reenviar.closest('ion-button')).toHaveAttribute(
    'router-link',
    '/verify-email-pending',
  );
  const volverLogin = screen.getByText('Volver al inicio de sesión');
  expect(volverLogin.closest('ion-button')).toHaveAttribute(
    'router-link',
    '/login',
  );
});

test('VerifyEmail con token y éxito muestra mensaje y enlace a login', async () => {
  vi.mocked(confirmEmailWithToken).mockResolvedValue({
    success: true,
    message: '',
  });
  render(
    <MemoryRouter initialEntries={['/verify-email?token=abc123']}>
      <IonApp>
        <Route path="/verify-email" component={VerifyEmail} />
      </IonApp>
    </MemoryRouter>,
  );
  await waitFor(() => {
    expect(screen.getByText('¡Correo verificado!')).toBeInTheDocument();
  });
  expect(
    screen.getByText('Tu correo quedó verificado correctamente.'),
  ).toBeInTheDocument();
  expect(
    screen.getByText('Ir a iniciar sesión').closest('ion-button'),
  ).toHaveAttribute('router-link', '/login');
  expect(confirmEmailWithToken).toHaveBeenCalledWith('abc123');
});

test('VerifyEmail con sesión y refresh OK ofrece Ir al inicio', async () => {
  localStorage.setItem('quira_token', 'jwt');
  localStorage.setItem('user', JSON.stringify({ id: 1 }));
  vi.mocked(confirmEmailWithToken).mockResolvedValue({
    success: true,
    message: 'Listo',
  });
  vi.mocked(refreshCurrentUserInStorage).mockResolvedValue(true);

  render(
    <MemoryRouter initialEntries={['/verify-email?token=tok']}>
      <IonApp>
        <Route path="/verify-email" component={VerifyEmail} />
      </IonApp>
    </MemoryRouter>,
  );

  await waitFor(() => {
    expect(screen.getByText('¡Correo verificado!')).toBeInTheDocument();
  });
  expect(screen.getByText('Listo')).toBeInTheDocument();
  expect(
    screen.getByText('Ir al inicio').closest('ion-button'),
  ).toHaveAttribute('router-link', '/request-list');
});

test('VerifyEmail respuesta success false muestra message', async () => {
  vi.mocked(confirmEmailWithToken).mockResolvedValue({
    success: false,
    message: 'Enlace caducado',
  });
  render(
    <MemoryRouter initialEntries={['/verify-email?token=old']}>
      <IonApp>
        <Route path="/verify-email" component={VerifyEmail} />
      </IonApp>
    </MemoryRouter>,
  );
  await waitFor(() => {
    expect(screen.getByText('Enlace caducado')).toBeInTheDocument();
  });
});

test('VerifyEmail error HTTP muestra mensaje del backend', async () => {
  vi.mocked(confirmEmailWithToken).mockRejectedValue({
    isAxiosError: true,
    response: { data: { message: 'Token caducado' } },
  });
  render(
    <MemoryRouter initialEntries={['/verify-email?token=expired']}>
      <IonApp>
        <Route path="/verify-email" component={VerifyEmail} />
      </IonApp>
    </MemoryRouter>,
  );
  await waitFor(() => {
    expect(screen.getByText('Verificación fallida')).toBeInTheDocument();
  });
  expect(screen.getByText('Token caducado')).toBeInTheDocument();
});
