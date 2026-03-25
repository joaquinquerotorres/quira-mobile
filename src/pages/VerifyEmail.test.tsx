import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import VerifyEmail from './VerifyEmail';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.post).mockReset();
});

test('VerifyEmail sin token muestra error', async () => {
  render(
    <MemoryRouter initialEntries={['/verify-email']}>
      <IonApp>
        <Route path="/verify-email" component={VerifyEmail} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('Verificación fallida')).toBeInTheDocument();
  });
  expect(screen.getByText('No se ha encontrado un token de verificación.')).toBeInTheDocument();
  expect(screen.getByText('Volver al inicio')).toBeInTheDocument();
});

test('VerifyEmail con token válido muestra éxito', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  render(
    <MemoryRouter initialEntries={['/verify-email?token=abc123']}>
      <IonApp>
        <Route path="/verify-email" component={VerifyEmail} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('¡Correo verificado!')).toBeInTheDocument();
  });
  expect(screen.getByText('Email verificado correctamente.')).toBeInTheDocument();
  expect(screen.getByText('Ir a iniciar sesión')).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith(
    '/verify/email',
    { token: 'abc123' },
    expect.objectContaining({ skipAuthRedirect: true })
  );
});

test('VerifyEmail con token inválido muestra mensaje del servidor o genérico', async () => {
  vi.mocked(api.post).mockRejectedValue({
    response: { data: { message: 'Token caducado' } },
  });
  render(
    <MemoryRouter initialEntries={['/verify-email?token=expired']}>
      <IonApp>
        <Route path="/verify-email" component={VerifyEmail} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('Verificación fallida')).toBeInTheDocument();
  });
  expect(screen.getByText('Token caducado')).toBeInTheDocument();
});
