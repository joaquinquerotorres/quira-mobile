import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import ProRequestDetail from './ProRequestDetail';

import api from '../api/axios';

vi.mock('../hooks/useUserVerification', () => ({
  getVerificationStatus: () => ({
    hasClientPhone: false,
    verifiedClientPhone: false,
    canCreateRequest: false,
    hasProPhone: true,
    verifiedProPhone: true,
    canBid: true,
  }),
}));

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonApp: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useIonRouter: () => ({ goBack: vi.fn(), push: vi.fn() }),
    IonModal: ({
      isOpen,
      children,
    }: {
      isOpen: boolean;
      children?: React.ReactNode;
    }) => (isOpen ? <div data-testid="ion-modal-mock">{children}</div> : null),
  };
});

const minimalRequest = {
  '@id': '/api/requests/1',
  id: 1,
  title: 'Reparar enchufe',
  description: 'Toma corta',
  estimatedPriceMin: 10000,
  estimatedPriceMax: 14000,
  status: 'PENDING' as const,
  riskLevel: 'LOW' as const,
  category: 'ELECTRICITY' as const,
  address: 'Calle Test 1',
  locationPoint: { type: 'Point' as const, coordinates: [0, 0] as [number, number] },
  createdAt: '2024-01-01',
  client: {
    '@id': '/api/client_profiles/2',
    id: 2,
    fullName: 'Cliente Demo',
    user: { '@id': '/api/users/10', id: 10, email: 'c@test.com', roles: ['ROLE_CLIENT'] },
  },
  bids: [],
  questions: [],
};

beforeEach(() => {
  (localStorage as any).setItem?.(
    'user',
    JSON.stringify({
      id: 99,
      roles: ['ROLE_PRO'],
      paidThroughAt: '2099-12-31T00:00:00.000Z',
      professionalProfile: { id: 5, '@id': '/api/professional_profiles/5' },
    })
  );
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url.startsWith('/requests/')) {
      return Promise.resolve({ data: minimalRequest });
    }
    return Promise.resolve({ data: { 'hydra:member': [] } });
  });
});

test('ProRequestDetail muestra el título del trabajo para un PRO', async () => {
  render(
    <MemoryRouter initialEntries={['/pro/request/1']}>
      <IonApp>
        <Route path="/pro/request/:id" component={ProRequestDetail} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('Reparar enchufe')).toBeInTheDocument();
    expect(screen.getAllByText('Rango estimado').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('100€ - 140€').length).toBeGreaterThanOrEqual(1);
  });
});
