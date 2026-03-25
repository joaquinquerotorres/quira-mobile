import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import Market from './Market';

import api from '../api/axios';

const mockOpportunity = {
  id: 1,
  title: 'Arreglo grifo',
  description: 'Grifo que gotea',
  priceAmount: 50,
  status: 'PENDING',
  riskLevel: 'LOW',
  category: 'PLUMBING',
  address: 'Calle Test 1, Madrid',
  locationPoint: { type: 'Point', coordinates: [-3.7, 40.4] },
  bids: [],
  client: { id: 1, fullName: 'Cliente', '@id': '/clients/1' },
};

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <IonApp>{children}</IonApp>
  </MemoryRouter>
);

beforeEach(() => {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/professionals/me/can-bid')) {
      return Promise.resolve({ data: { canBidThisMonth: true } });
    }
    return Promise.resolve({
      data: { 'hydra:member': [mockOpportunity], 'member': [mockOpportunity] },
    });
  });
});

test('Market renders header', async () => {
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    roles: ['ROLE_SOLVER'],
    '@id': '/users/1',
  }));
  render(<Market />, { wrapper });
  expect(screen.getByText('Mercado')).toBeInTheDocument();
  expect(screen.getByText(/Encuentra nuevas oportunidades/i)).toBeInTheDocument();
  await waitFor(() => expect(api.get).toHaveBeenCalled());
});

test('FREE user sees can-bid limit alert when canBidThisMonth is false', async () => {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/professionals/me/can-bid')) {
      return Promise.resolve({ data: { canBidThisMonth: false } });
    }
    return Promise.resolve({
      data: { 'hydra:member': [mockOpportunity], 'member': [mockOpportunity] },
    });
  });

  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    roles: ['ROLE_FREE'],
    '@id': '/users/1',
    professionalProfile: { id: 1, phoneNumber: '+34600000000', verifiedPhone: true, fullName: 'Pro Free', '@id': '/professionals/1' },
  }));

  render(<Market />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('ME INTERESA')).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText('ME INTERESA'));

  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith('/professionals/me/can-bid');
    expect(screen.getByText('Límite de propuestas alcanzado')).toBeInTheDocument();
    expect(screen.getByText(/No puedes enviar más propuestas este mes/i)).toBeInTheDocument();
  });
});

test('FREE user opens bid modal when canBidThisMonth is true', async () => {
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    roles: ['ROLE_FREE'],
    '@id': '/users/1',
    professionalProfile: { id: 1, phoneNumber: '+34600000000', verifiedPhone: true, fullName: 'Pro Free', '@id': '/professionals/1' },
  }));

  render(<Market />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('ME INTERESA')).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText('ME INTERESA'));

  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith('/professionals/me/can-bid');
    expect(screen.getByText('Me Interesa')).toBeInTheDocument();
    expect(screen.getByText('ENVIAR PROPUESTA')).toBeInTheDocument();
  });
});
