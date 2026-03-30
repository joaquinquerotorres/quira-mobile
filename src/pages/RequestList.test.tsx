import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import RequestList from './RequestList';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}));

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonApp: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useIonViewWillEnter: (cb: () => void) => useEffect(() => { cb(); }, []),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <IonApp>{children}</IonApp>
  </MemoryRouter>
);

beforeEach(() => {
  vi.mocked(api.get).mockResolvedValue({
    data: { 'hydra:member': [], 'member': [] },
  });
  (localStorage as any).setItem?.('user', JSON.stringify({
    clientProfile: { fullName: 'Test User' },
  }));
});

test('RequestList renders header and tabs', async () => {
  render(<RequestList />, { wrapper });
  expect(screen.getByText('Mis solicitudes')).toBeInTheDocument();
  expect(screen.getByText('Todas')).toBeInTheDocument();
  expect(screen.getByText('Canceladas')).toBeInTheDocument();
  await waitFor(() => expect(api.get).toHaveBeenCalled());
});

test('RequestList shows CANCELLED request with Cancelada badge', async () => {
  const cancelledRequest = {
    id: 1,
    title: 'Trabajo cancelado',
    estimatedPriceMin: 45,
    estimatedPriceMax: 55,
    status: 'CANCELLED',
    category: 'PLUMBING',
    address: 'Calle Test 1, Madrid',
    scheduledAt: null,
    client: { fullName: 'Cliente' },
  };
  vi.mocked(api.get).mockResolvedValue({
    data: { 'hydra:member': [cancelledRequest], 'member': [cancelledRequest] },
  });

  render(<RequestList />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('CANCELADA')).toBeInTheDocument();
    expect(screen.getByText('Trabajo cancelado')).toBeInTheDocument();
    expect(screen.getByText('Rango IA')).toBeInTheDocument();
    expect(screen.getByText('45€ - 55€')).toBeInTheDocument();
  });
});
