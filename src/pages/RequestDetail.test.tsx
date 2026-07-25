import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import RequestDetail from './RequestDetail';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonAlert: ({
      isOpen,
      buttons,
    }: {
      isOpen: boolean;
      buttons?: Array<string | { text?: string; handler?: () => void }>;
    }) =>
      isOpen ? (
        <div data-testid="ion-alert-mock">
          {(buttons || []).map((button, idx) => {
            if (typeof button === 'string') {
              return <button key={idx}>{button}</button>;
            }
            return (
              <button key={idx} onClick={() => button.handler?.()}>
                {button.text || `button-${idx}`}
              </button>
            );
          })}
        </div>
      ) : null,
  };
});

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

test('RequestDetail shows unavailable message when request returns 404', async () => {
  vi.mocked(api.get).mockRejectedValue({ response: { status: 404 } });

  render(<Route path="/request/:id" component={RequestDetail} />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={['/request/1']}>
        <IonApp>{children}</IonApp>
      </MemoryRouter>
    ),
  });

  await waitFor(() => {
    expect(screen.getByText('Esta solicitud ya no está disponible.')).toBeInTheDocument();
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

test('RequestDetail cancels request with DELETE /requests/{id}/cancel', async () => {
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
  vi.mocked(api.delete).mockResolvedValue({ data: {} });

  render(<Route path="/request/:id" component={RequestDetail} />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={['/request/1']}>
        <IonApp>{children}</IonApp>
      </MemoryRouter>
    ),
  });

  await waitFor(() => {
    expect(screen.getAllByText('Cancelar solicitud').length).toBeGreaterThan(0);
  });

  const cancelButtons = screen.getAllByText('Cancelar solicitud');
  await userEvent.click(cancelButtons[cancelButtons.length - 1]);
  await userEvent.click(screen.getByText('Sí, cancelar'));

  await waitFor(() => {
    expect(api.delete).toHaveBeenCalledWith('/requests/1/cancel');
  });
});

test('RequestDetail hire confirms address first then accepts bid without setting ACCEPTED early', async () => {
  const pendingWithBid = {
    id: 1,
    title: 'Arreglo grifo',
    status: 'PENDING',
    assignedProfessional: null,
    address: 'Calle Test 1, Córdoba',
    bids: [
      {
        id: 7,
        status: 'PENDING',
        priceQuote: 8000,
        professional: {
          '@id': '/api/users/2',
          professionalProfile: {
            id: 3,
            '@id': '/api/professional_profiles/3',
            fullName: 'Pro Test',
          },
        },
      },
    ],
    client: { fullName: 'Cliente' },
    estimatedPriceMin: 7000,
    estimatedPriceMax: 9000,
    description: 'Grifo que gotea',
    riskLevel: 'LOW',
    category: 'PLUMBING',
    locationPoint: { type: 'Point', coordinates: [-4.77, 37.88] },
    createdAt: '2024-01-01',
    questions: [],
  };
  vi.mocked(api.get).mockResolvedValue({ data: pendingWithBid });
  vi.mocked(api.patch).mockResolvedValue({ data: {} });

  render(<Route path="/request/:id" component={RequestDetail} />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={['/request/1']}>
        <IonApp>{children}</IonApp>
      </MemoryRouter>
    ),
  });

  await waitFor(() => {
    expect(screen.getByText('ACEPTAR PRESUPUESTO')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('ACEPTAR PRESUPUESTO'));

  await waitFor(() => {
    expect(screen.getByText('CONFIRMAR Y CONTRATAR')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('CONFIRMAR Y CONTRATAR'));

  await waitFor(() => {
    expect(api.patch).toHaveBeenCalled();
  });

  const patchCalls = vi.mocked(api.patch).mock.calls;
  expect(patchCalls[0][0]).toBe('/requests/1');
  expect(patchCalls[0][1]).toEqual(
    expect.objectContaining({ preciseAddress: expect.any(String) }),
  );
  expect(patchCalls[0][1]).not.toHaveProperty('status');
  expect(patchCalls[0][1]).not.toHaveProperty('assignedProfessional');
  expect(patchCalls[1][0]).toBe('/bids/7/accept');
});
