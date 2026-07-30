import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationSettingsPanel } from './NotificationSettings';

import api from '../api/axios';
import { refreshCurrentUserInStorage } from '../utils/refreshCurrentUser';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

vi.mock('../utils/refreshCurrentUser', () => ({
  refreshCurrentUserInStorage: vi.fn().mockResolvedValue(true),
}));

vi.mock('@ionic/react', () => {
  return {
    IonPage: ({ children }: any) => React.createElement('div', null, children),
    IonContent: ({ children }: any) => React.createElement('div', null, children),
    IonHeader: ({ children }: any) => React.createElement('div', null, children),
    IonToolbar: ({ children }: any) => React.createElement('div', null, children),
    IonTitle: ({ children }: any) => React.createElement('h1', null, children),
    IonButtons: ({ children }: any) => React.createElement('div', null, children),
    IonButton: ({ children, disabled, onClick }: any) =>
      React.createElement('button', { disabled, onClick }, children),
    IonIcon: () => null,
    IonList: ({ children }: any) => React.createElement('div', null, children),
    IonItem: ({ children }: any) => React.createElement('div', null, children),
    IonLabel: ({ children }: any) => React.createElement('label', null, children),
    IonToggle: ({ checked }: any) =>
      React.createElement('input', { type: 'checkbox', checked, readOnly: true }),
    IonSpinner: () => null,
    IonToast: ({ isOpen, message }: any) =>
      isOpen ? React.createElement('div', null, message) : null,
    useIonRouter: () => ({ goBack: vi.fn(), push: vi.fn() }),
  };
});

vi.mock('../utils/activeMode', () => ({
  getEffectiveActiveMode: vi.fn(() => 'client'),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const clientUser = {
  id: 1,
  email: 'client@test.com',
  roles: ['ROLE_CLIENT'],
  clientProfile: {
    id: 1,
    fullName: 'Client',
    '@id': '/client_profiles/1',
    notifyRequestActivity: true,
    notifyBidActivity: true,
    notifyReviews: true,
  },
};

const proUser = {
  id: 2,
  email: 'pro@test.com',
  roles: ['ROLE_PRO'],
  professionalProfile: {
    id: 10,
    fullName: 'Pro',
    '@id': '/professional_profiles/10',
    notifyRequestActivity: true,
    notifyBidActivity: true,
    notifyReviews: true,
  },
};

beforeEach(() => {
  (api.patch as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (refreshCurrentUserInStorage as ReturnType<typeof vi.fn>).mockResolvedValue(true);
});

test('NotificationSettingsPanel renders client prefs without role label', async () => {
  localStorage.setItem('user', JSON.stringify(clientUser));
  const { getEffectiveActiveMode } = await import('../utils/activeMode');
  vi.mocked(getEffectiveActiveMode).mockReturnValue('client');
  render(<NotificationSettingsPanel />, { wrapper });
  await waitFor(() => {
    expect(screen.getByText('Dudas sobre mis solicitudes')).toBeInTheDocument();
  });
  expect(screen.queryByText('Como cliente')).not.toBeInTheDocument();
  expect(screen.queryByText('Como profesional')).not.toBeInTheDocument();
});

test('NotificationSettingsPanel renders pro prefs without role label', async () => {
  localStorage.setItem('user', JSON.stringify(proUser));
  const { getEffectiveActiveMode } = await import('../utils/activeMode');
  vi.mocked(getEffectiveActiveMode).mockReturnValue('pro');
  render(<NotificationSettingsPanel />, { wrapper });
  await waitFor(() => {
    expect(screen.getByText('Cuando aceptan mis ofertas')).toBeInTheDocument();
  });
  expect(screen.queryByText('Como profesional')).not.toBeInTheDocument();
  expect(screen.queryByText('Como cliente')).not.toBeInTheDocument();
});
