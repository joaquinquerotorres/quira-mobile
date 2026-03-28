import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DowngradeBanner, SESSION_KEY_DOWNGADE_DISMISSED } from './DowngradeBanner';

vi.mock('@ionic/react', () => ({
  IonAlert: ({ isOpen, header, message }: any) =>
    isOpen ? (
      <div>
        <div>{header}</div>
        <div>{message}</div>
      </div>
    ) : null,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

test('DowngradeBanner shows alert when user is downgraded due to expired payment', async () => {
  const user = {
    id: 1,
    paidThroughAt: '2020-01-01T00:00:00Z',
    roles: ['ROLE_PRO'],
  };
  localStorage.setItem('user', JSON.stringify(user));

  render(<DowngradeBanner />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('Cuota no renovada')).toBeInTheDocument();
    expect(screen.getByText(/Tu suscripción ha caducado/)).toBeInTheDocument();
  });
});

test('DowngradeBanner shows when ROLE_PRO and paidThroughAt is null (sin pago vigente)', async () => {
  const user = {
    id: 1,
    paidThroughAt: null,
    roles: ['ROLE_PRO'],
    professionalProfile: {},
  };
  localStorage.setItem('user', JSON.stringify(user));

  render(<DowngradeBanner />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('Cuota no renovada')).toBeInTheDocument();
  });
});

test('DowngradeBanner does not show when user is not downgraded', async () => {
  const user = {
    id: 1,
    paidThroughAt: '2030-01-01T00:00:00Z',
    roles: ['ROLE_PRO'],
  };
  localStorage.setItem('user', JSON.stringify(user));

  render(<DowngradeBanner />, { wrapper });

  await waitFor(() => {
    expect(screen.queryByText('Cuota no renovada')).not.toBeInTheDocument();
  });
});

test('DowngradeBanner does not show when session already dismissed', async () => {
  sessionStorage.setItem(SESSION_KEY_DOWNGADE_DISMISSED, '1');
  const user = {
    id: 1,
    paidThroughAt: '2020-01-01T00:00:00Z',
    roles: ['ROLE_PRO'],
  };
  localStorage.setItem('user', JSON.stringify(user));

  render(<DowngradeBanner />, { wrapper });

  await waitFor(() => {
    expect(screen.queryByText('Cuota no renovada')).not.toBeInTheDocument();
  });
});
