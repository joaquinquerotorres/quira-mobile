import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import ResetPassword from './ResetPassword';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() },
}));

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonApp: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useIonRouter: () => ({ goBack: vi.fn(), push: vi.fn() }),
  };
});

beforeEach(() => {
  vi.mocked(api.post).mockReset();
});

test('ResetPassword sin token muestra mensaje de enlace inválido', () => {
  render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <IonApp>
        <Route path="/reset-password" component={ResetPassword} />
      </IonApp>
    </MemoryRouter>
  );
  expect(
    screen.getByText(/Enlace inválido o incompleto/i)
  ).toBeInTheDocument();
  expect(screen.getByText('Ir a iniciar sesión')).toBeInTheDocument();
});

test('ResetPassword con token muestra formulario', () => {
  render(
    <MemoryRouter initialEntries={['/reset-password?token=xyz']}>
      <IonApp>
        <Route path="/reset-password" component={ResetPassword} />
      </IonApp>
    </MemoryRouter>
  );
  expect(screen.getByText('Nueva contraseña')).toBeInTheDocument();
  expect(screen.getByText('Elige una nueva contraseña')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Nueva contraseña')).toBeInTheDocument();
  expect(screen.getByText('Restablecer contraseña')).toBeInTheDocument();
});

test('ResetPassword con token muestra toast si envía vacío', async () => {
  render(
    <MemoryRouter initialEntries={['/reset-password?token=xyz']}>
      <IonApp>
        <Route path="/reset-password" component={ResetPassword} />
      </IonApp>
    </MemoryRouter>
  );
  const form = screen.getByText('Restablecer contraseña').closest('form');
  fireEvent.submit(form!);
  await waitFor(() => {
    const toast = document.querySelector('ion-toast');
    expect(toast?.getAttribute('message')).toBe('Introduce una contraseña.');
  });
});

test('ResetPassword envía nueva contraseña al API', async () => {
  vi.mocked(api.post).mockResolvedValue({ data: {} });
  render(
    <MemoryRouter initialEntries={['/reset-password?token=good']}>
      <IonApp>
        <Route path="/reset-password" component={ResetPassword} />
      </IonApp>
    </MemoryRouter>
  );
  const fireIonInput = (el: HTMLElement, value: string) => {
    fireEvent(el, new CustomEvent('ionInput', { detail: { value }, bubbles: true }));
  };
  fireIonInput(screen.getByPlaceholderText('Nueva contraseña'), 'secret12');
  fireIonInput(screen.getByPlaceholderText('Repetir contraseña'), 'secret12');
  const form = screen.getByText('Restablecer contraseña').closest('form');
  fireEvent.submit(form!);
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith(
      '/users/reset-password',
      { token: 'good', password: 'secret12' },
      expect.objectContaining({ skipAuthRedirect: true })
    );
  });
  await waitFor(() => {
    expect(screen.getByText('Contraseña actualizada')).toBeInTheDocument();
  });
});
