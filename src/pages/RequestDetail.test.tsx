import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import RequestDetail from './RequestDetail';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

vi.mock('react-google-places-autocomplete', () => ({
  default: () => <div data-testid="google-places" />,
  geocodeByAddress: vi.fn(),
  getLatLng: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/request/1']}>
    <IonApp>
      <Route path="/request/:id" component={RequestDetail} />
      {children}
    </IonApp>
  </MemoryRouter>
);

beforeEach(() => {
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    clientProfile: { fullName: 'Test Client' },
  }));
});

test('RequestDetail shows Cancelar solicitud when PENDING and no assigned professional', async () => {
  const pendingRequest = {
    id: 1,
    title: 'Arreglo grifo',
    status: 'PENDING',
    assignedProfessional: null,
    address: 'Calle Test 1, Madrid',
    bids: [],
    client: { fullName: 'Cliente' },
    estimatedPriceMin: 7000,
    estimatedPriceMax: 9000,
    description: 'Grifo que gotea',
    riskLevel: 'LOW',
    category: 'PLUMBING',
    locationPoint: { type: 'Point', coordinates: [0, 0] },
    createdAt: '2024-01-01',
    questions: [],
  };
  vi.mocked(api.get).mockResolvedValue({ data: pendingRequest });

  render(<Route path="/request/:id" component={RequestDetail} />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={['/request/1']}>
        <IonApp>{children}</IonApp>
      </MemoryRouter>
    ),
  });

  await waitFor(() => {
    expect(screen.getAllByText('Cancelar solicitud').length).toBeGreaterThan(0);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });
});

test('RequestDetail shows Cancelada and does not show Cancelar solicitud when CANCELLED', async () => {
  const cancelledRequest = {
    id: 1,
    title: 'Trabajo cancelado',
    status: 'CANCELLED',
    assignedProfessional: null,
    address: 'Calle Test 1, Madrid',
    bids: [],
    client: { fullName: 'Cliente' },
    estimatedPriceMin: 4500,
    estimatedPriceMax: 5500,
    description: 'Desc',
    riskLevel: 'LOW',
    category: 'PLUMBING',
    locationPoint: { type: 'Point', coordinates: [0, 0] },
    createdAt: '2024-01-01',
    questions: [],
  };
  vi.mocked(api.get).mockResolvedValue({ data: cancelledRequest });

  render(<Route path="/request/:id" component={RequestDetail} />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={['/request/1']}>
        <IonApp>{children}</IonApp>
      </MemoryRouter>
    ),
  });

  await waitFor(() => {
    expect(screen.getByText('Cancelada')).toBeInTheDocument();
    expect(screen.queryAllByText('Cancelar solicitud')).toHaveLength(0);
    expect(screen.getByText('Esta solicitud ha sido cancelada.')).toBeInTheDocument();
  });
});

test('RequestDetail shows visit request and accept calls POST /visit-requests/{id}/accept', async () => {
  const requestWithVisit = {
    id: 1,
    title: 'Arreglo grifo',
    status: 'PENDING',
    assignedProfessional: null,
    address: 'Calle Test 1',
    bids: [],
    client: { fullName: 'Cliente' },
    estimatedPriceMin: 7000,
    estimatedPriceMax: 9000,
    description: 'Grifo que gotea',
    riskLevel: 'LOW',
    category: 'PLUMBING',
    locationPoint: { type: 'Point', coordinates: [0, 0] },
    createdAt: '2024-01-01',
    questions: [],
    visitRequests: [
      {
        id: 42,
        status: 'PENDING',
        professional: { fullName: 'Pro Visitante' },
      },
    ],
  };
  vi.mocked(api.get).mockResolvedValue({ data: requestWithVisit });

  render(<Route path="/request/:id" component={RequestDetail} />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={['/request/1']}>
        <IonApp>{children}</IonApp>
      </MemoryRouter>
    ),
  });

  await waitFor(() => {
    expect(screen.getByText('Aceptar visita')).toBeInTheDocument();
  });

  vi.mocked(api.post).mockResolvedValue({ data: {} });
  fireEvent.click(screen.getByText('Aceptar visita'));
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith('/visit-requests/42/accept');
  });
});
