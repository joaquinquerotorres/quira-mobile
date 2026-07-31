import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import Market from './Market';

import api from '../api/axios';

vi.mock('../utils/refreshCurrentUser', () => ({
  refreshCurrentUserInStorage: vi.fn().mockResolvedValue(false),
}));

const mockOpportunity = {
  id: 1,
  title: 'Arreglo grifo',
  description: 'Grifo que gotea',
  estimatedPriceMin: 4500,
  estimatedPriceMax: 5500,
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
      return Promise.resolve({ data: { canBidThisMonth: true, remainingBidsThisMonth: 3 } });
    }
    if (typeof url === 'string' && url.includes('/users/')) {
      // Si el test no mockea refreshCurrentUserInStorage, devolvemos data mínima compatible.
      return Promise.resolve({ data: { id: 1 } });
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
      return Promise.resolve({ data: { canBidThisMonth: false, remainingBidsThisMonth: 0 } });
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
    expect(screen.getByText('Propuestas gratuitas: 0 restantes')).toBeInTheDocument();
  });
});

test('FREE user sees HIGH job clearly when they already have a bid (ex PRO)', async () => {
  const highWithMyBid = {
    ...mockOpportunity,
    id: 99,
    title: 'Reforma integral alta',
    riskLevel: 'HIGH',
    bids: [
      {
        id: 1,
        status: 'PENDING',
        professional: { id: 1, '@id': '/professionals/1' },
      },
    ],
  };

  vi.mocked(api.get).mockImplementation((url: string) => {
    return Promise.resolve({
      data: { 'hydra:member': [highWithMyBid], member: [highWithMyBid] },
    });
  });

  (localStorage as any).setItem?.(
    'user',
    JSON.stringify({
      id: 1,
      roles: ['ROLE_PRO'],
      paidThroughAt: '2020-01-01T00:00:00.000Z',
      professionalProfile: {
        id: 1,
        phoneNumber: '+34600000000',
        verifiedPhone: true,
        fullName: 'Ex Pro',
        '@id': '/professionals/1',
      },
    }),
  );

  render(<Market />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('Reforma integral alta')).toBeInTheDocument();
  });
  expect(screen.queryByText('Oportunidad Reservada')).not.toBeInTheDocument();
});

test('ex-PRO effective FREE without bid sees HIGH job blurred', async () => {
  const highWithoutBid = {
    ...mockOpportunity,
    id: 77,
    title: 'Reforma integral alta',
    riskLevel: 'HIGH',
    bids: [],
  };

  vi.mocked(api.get).mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/professionals/me/can-bid')) {
      return Promise.resolve({ data: { canBidThisMonth: true, remainingBidsThisMonth: 3 } });
    }
    if (typeof url === 'string' && url.includes('/users/')) {
      return Promise.resolve({ data: { id: 1 } });
    }
    return Promise.resolve({
      data: { 'hydra:member': [highWithoutBid], member: [highWithoutBid] },
    });
  });

  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    roles: ['ROLE_PRO'],
    paidThroughAt: null,
    '@id': '/users/1',
    professionalProfile: {
      id: 1,
      phoneNumber: '+34600000000',
      verifiedPhone: true,
      fullName: 'Ex Pro',
      '@id': '/professionals/1',
    },
  }));

  render(<Market />, { wrapper });

  // Si está blur, el título se reemplaza por el overlay
  await waitFor(() => {
    expect(screen.getByText('Oportunidad Reservada')).toBeInTheDocument();
  });
});

test('ex-PRO effective FREE (paidThroughAt null) calls can-bid like ROLE_FREE', async () => {
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    roles: ['ROLE_PRO'],
    paidThroughAt: null,
    '@id': '/users/1',
    professionalProfile: { id: 1, phoneNumber: '+34600000000', verifiedPhone: true, fullName: 'Ex Pro', '@id': '/professionals/1' },
  }));

  render(<Market />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('ME INTERESA')).toBeInTheDocument();
  });

  await userEvent.click(screen.getByText('ME INTERESA'));

  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith('/professionals/me/can-bid');
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
    expect(screen.getByText('Propuestas gratuitas: 3 restantes')).toBeInTheDocument();
  });
});

test('RANGE request opens bid modal defaulting to min/max with type choice', async () => {
  const rangeOpportunity = {
    ...mockOpportunity,
    pricingType: 'RANGE',
  };
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (typeof url === 'string' && url.includes('/professionals/me/can-bid')) {
      return Promise.resolve({ data: { canBidThisMonth: true, remainingBidsThisMonth: 3 } });
    }
    return Promise.resolve({
      data: { 'hydra:member': [rangeOpportunity], member: [rangeOpportunity] },
    });
  });

  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    roles: ['ROLE_SOLVER'],
    '@id': '/users/1',
    professionalProfile: {
      id: 1,
      phoneNumber: '+34600000000',
      verifiedPhone: true,
      fullName: 'Solver',
      '@id': '/professionals/1',
    },
  }));

  render(<Market />, { wrapper });

  await waitFor(() => {
    expect(screen.getByText('ME INTERESA')).toBeInTheDocument();
  });
  await userEvent.click(screen.getByText('ME INTERESA'));

  await waitFor(() => {
    // Estimación IA RANGE → se abre en modo rango, pero el pro puede cambiar a fijo.
    expect(screen.getByText('Tipo de propuesta')).toBeInTheDocument();
    expect(screen.getByText('Rango de precio (€)')).toBeInTheDocument();
    expect(screen.getByText('Precio mínimo')).toBeInTheDocument();
    expect(screen.getByText('Precio máximo')).toBeInTheDocument();
    expect(screen.getByText('Por qué este rango de precio')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Precio fijo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Rango de precio' })).toBeInTheDocument();
  });
});
