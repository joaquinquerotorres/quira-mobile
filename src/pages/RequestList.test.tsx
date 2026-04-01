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
  expect(screen.getByText('Finalizadas')).toBeInTheDocument();
  await waitFor(() => expect(api.get).toHaveBeenCalled());
});

test('RequestList shows COMPLETED request with Finalizado badge', async () => {
  const completedRequest = {
    id: 1,
    title: 'Trabajo finalizado',
    estimatedPriceMin: 4500,
    estimatedPriceMax: 5500,
    status: 'COMPLETED',
    category: 'PLUMBING',
    address: 'Calle Test 1, Madrid',
    desiredExecutionTime: 'Esta semana',
    client: { fullName: 'Cliente' },
  };
  vi.mocked(api.get).mockResolvedValue({
    data: { 'hydra:member': [completedRequest], 'member': [completedRequest] },
  });

  render(<RequestList />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('FINALIZADO')).toBeInTheDocument();
    expect(screen.getByText('Trabajo finalizado')).toBeInTheDocument();
    expect(screen.getByText('Rango estimado')).toBeInTheDocument();
    expect(screen.getByText('45€ - 55€')).toBeInTheDocument();
    expect(screen.getByText('Esta semana')).toBeInTheDocument();
  });
});
