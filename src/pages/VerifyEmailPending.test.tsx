import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import VerifyEmailPending from './VerifyEmailPending';
import { resendVerificationEmail } from '../api/verifyEmailApi';
import { clearStorage } from '../setupTests';

vi.mock('../api/verifyEmailApi', () => ({
  resendVerificationEmail: vi.fn(),
}));

beforeEach(() => {
  clearStorage();
  vi.mocked(resendVerificationEmail).mockReset();
});

test('sin JWT muestra aviso al pulsar Reenviar', async () => {
  const user = userEvent.setup();
  vi.mocked(resendVerificationEmail).mockResolvedValue({
    success: true,
    message: 'ok',
  });

  render(
    <MemoryRouter initialEntries={['/verify-email-pending']}>
      <IonApp>
        <Route path="/verify-email-pending" component={VerifyEmailPending} />
      </IonApp>
    </MemoryRouter>,
  );

  await user.click(screen.getByText('Reenviar correo de verificación'));

  await waitFor(() => {
    const msgs = [...document.querySelectorAll('ion-toast')].map((t) =>
      t.getAttribute('message'),
    );
    expect(
      msgs.some((m) =>
        m?.includes('Inicia sesión para poder reenviar el correo'),
      ),
    ).toBe(true);
  });
  expect(resendVerificationEmail).not.toHaveBeenCalled();
});

test('con JWT llama a resendVerificationEmail', async () => {
  const user = userEvent.setup();
  localStorage.setItem('quira_token', 'jwt');
  vi.mocked(resendVerificationEmail).mockResolvedValue({
    success: true,
    message: 'Te hemos enviado un correo.',
  });

  render(
    <MemoryRouter initialEntries={['/verify-email-pending']}>
      <IonApp>
        <Route path="/verify-email-pending" component={VerifyEmailPending} />
      </IonApp>
    </MemoryRouter>,
  );

  await user.click(screen.getByText('Reenviar correo de verificación'));

  await waitFor(() => {
    expect(resendVerificationEmail).toHaveBeenCalledTimes(1);
  });
  await waitFor(() => {
    const msgs = [...document.querySelectorAll('ion-toast')].map((t) =>
      t.getAttribute('message'),
    );
    expect(msgs.some((m) => m?.includes('Te hemos enviado un correo'))).toBe(
      true,
    );
  });
});
