import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import BecomePro from './BecomePro';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

const createCheckoutSessionMock = vi.fn();
const syncSubscriptionFromStripeMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../services/stripeService', () => ({
  createCheckoutSession: (...args: unknown[]) => createCheckoutSessionMock(...args),
  syncSubscriptionFromStripe: () => syncSubscriptionFromStripeMock(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <IonApp>{children}</IonApp>
  </MemoryRouter>
);

const wrapperWithSearch = (search: string) =>
  ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[`/become-pro${search}`]}>
      <IonApp>{children}</IonApp>
    </MemoryRouter>
  );

beforeEach(() => {
  (localStorage as any).clear?.();
  createCheckoutSessionMock.mockReset();
  syncSubscriptionFromStripeMock.mockClear();
  syncSubscriptionFromStripeMock.mockResolvedValue(undefined);
  (api.get as ReturnType<typeof vi.fn>).mockReset();
  Object.defineProperty(window, 'location', {
    value: { href: '', replace: vi.fn() },
    writable: true,
  });
});

test('BecomePro renders step 1 with tier selector', () => {
  render(<BecomePro />, { wrapper });
  expect(screen.getByText('Elige tu Nivel')).toBeInTheDocument();
  expect(screen.getByText('Starter')).toBeInTheDocument();
  expect(screen.getByText('Solver')).toBeInTheDocument();
  expect(screen.getByText('Profesional')).toBeInTheDocument();
});

test('BecomePro moves to step 2 when Continue clicked', () => {
  render(<BecomePro />, { wrapper });
  fireEvent.click(screen.getByText(/CONTINUAR COMO SOLVER/));
  expect(screen.getByText('Tus Datos')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Ej. Reformas García')).toBeInTheDocument();
});

test('BecomePro step 2 shows form when FREE selected', () => {
  render(<BecomePro />, { wrapper });
  fireEvent.click(screen.getByText('Starter'));
  fireEvent.click(screen.getByText(/CONTINUAR COMO FREE/));
  expect(screen.getByText('FINALIZAR REGISTRO')).toBeInTheDocument();
  expect(screen.getByText(/Información para validar tu perfil FREE/)).toBeInTheDocument();
});

test('BecomePro SOLVER tier is selected by default', () => {
  render(<BecomePro />, { wrapper });
  expect(screen.getByText(/CONTINUAR COMO SOLVER/)).toBeInTheDocument();
});

test('BecomePro PRO step 2 shows CIF required message', () => {
  render(<BecomePro />, { wrapper });
  fireEvent.click(screen.getByText('Profesional'));
  fireEvent.click(screen.getByText(/CONTINUAR COMO PRO/));
  expect(screen.getByText('Necesario para cuenta PRO')).toBeInTheDocument();
});

test('BecomePro handles return from Stripe with success=1 and refetches user', async () => {
  (localStorage as any).setItem?.('user', JSON.stringify({ id: 42 }));
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { id: 42, email: 'pro@test.com', roles: ['ROLE_PRO'], paidThroughAt: '2030-01-01T00:00:00Z' },
  });
  const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  render(<BecomePro />, { wrapper: wrapperWithSearch('?success=1') });
  await waitFor(() => {
    expect(syncSubscriptionFromStripeMock).toHaveBeenCalled();
  });
  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith('/users/42');
  });
  await waitFor(
    () => {
      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/become-pro');
    },
    { timeout: 4000 },
  );
  replaceStateSpy.mockRestore();
});

test('BecomePro handles return from Stripe with canceled=1 and clears URL', async () => {
  const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  render(<BecomePro />, { wrapper: wrapperWithSearch('?canceled=1') });
  await waitFor(() => {
    expect(replaceStateSpy).toHaveBeenCalledWith({}, '', '/become-pro');
  });
  replaceStateSpy.mockRestore();
});
