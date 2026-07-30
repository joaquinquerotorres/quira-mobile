import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import DirectoryDetail from './DirectoryDetail';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
});

test('DirectoryDetail muestra perfil cuando el API responde', async () => {
  vi.mocked(api.get).mockResolvedValue({
    data: {
      id: 3,
      fullName: 'Carlos Electricista',
      skills: ['ELECTRICITY'],
      biography: 'Instalaciones certificadas.',
      user: { roles: ['ROLE_PRO'] },
      reviews: [],
      rating: 4.8,
      reviewCount: 3,
    },
  });
  render(
    <MemoryRouter initialEntries={['/directory/3']}>
      <IonApp>
        <Route path="/directory/:id" component={DirectoryDetail} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('Carlos Electricista')).toBeInTheDocument();
  });
  expect(screen.getByText('Instalaciones certificadas.')).toBeInTheDocument();
});

test('DirectoryDetail muestra En Quira desde con createdAt', async () => {
  vi.mocked(api.get).mockResolvedValue({
    data: {
      id: 3,
      fullName: 'Carlos Electricista',
      skills: ['ELECTRICITY'],
      biography: 'Instalaciones certificadas.',
      user: { roles: ['ROLE_PRO'] },
      reviews: [],
      rating: 4.8,
      reviewCount: 3,
      createdAt: '2026-05-12T12:00:00Z',
    },
  });
  render(
    <MemoryRouter initialEntries={['/directory/3']}>
      <IonApp>
        <Route path="/directory/:id" component={DirectoryDetail} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('En Quira desde mayo de 2026')).toBeInTheDocument();
  });
});

test('DirectoryDetail muestra No encontrado si el API no devuelve datos', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: null });
  render(
    <MemoryRouter initialEntries={['/directory/99']}>
      <IonApp>
        <Route path="/directory/:id" component={DirectoryDetail} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('No encontrado')).toBeInTheDocument();
  });
});
