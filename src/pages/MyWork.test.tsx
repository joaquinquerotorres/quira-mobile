import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter, Route } from 'react-router-dom';
import MyWork from './MyWork';

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
    useIonRouter: () => ({ push: vi.fn(), goBack: vi.fn() }),
    useIonViewWillEnter: (cb: () => void) => useEffect(() => { cb(); }, []),
  };
});

beforeEach(() => {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url.includes('/bids')) {
      return Promise.resolve({ data: { 'hydra:member': [] } });
    }
    if (url.includes('/requests')) {
      return Promise.resolve({ data: { 'hydra:member': [] } });
    }
    return Promise.resolve({ data: {} });
  });
});

test('MyWork muestra cabecera y estado vacío de propuestas', async () => {
  render(
    <MemoryRouter initialEntries={['/my-work']}>
      <IonApp>
        <Route path="/my-work" component={MyWork} />
      </IonApp>
    </MemoryRouter>
  );
  await waitFor(() => {
    expect(screen.getByText('Mi Trabajo')).toBeInTheDocument();
  });
  expect(
    screen.getByText('Gestiona tus propuestas y trabajos en curso.')
  ).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText('No has enviado propuestas aún')).toBeInTheDocument();
  });
});
