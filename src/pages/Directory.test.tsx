import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import Directory from './Directory';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
});

test('Directory muestra título y lista vacía cuando no hay profesionales', async () => {
  vi.mocked(api.get).mockResolvedValue({
    data: { 'hydra:member': [] },
  });
  render(
    <MemoryRouter initialEntries={['/directory']}>
      <IonApp>
        <Route path="/directory" component={Directory} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('Directorio')).toBeInTheDocument();
  });
  expect(screen.getByText('Tenemos 0 profesionales listos')).toBeInTheDocument();
});

test('Directory muestra tarjetas cuando el API devuelve perfiles', async () => {
  vi.mocked(api.get).mockResolvedValue({
    data: {
      'hydra:member': [
        {
          id: 7,
          fullName: 'Ana Fontanera',
          skills: ['PLUMBING'],
          user: { roles: ['ROLE_PRO'] },
        },
      ],
    },
  });
  render(
    <MemoryRouter initialEntries={['/directory']}>
      <IonApp>
        <Route path="/directory" component={Directory} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('Ana Fontanera')).toBeInTheDocument();
  });
  expect(screen.getByText('Tenemos 1 profesionales listos')).toBeInTheDocument();
});
