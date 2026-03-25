import React, { useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  const ionRouterStub = {
    push: vi.fn(),
    goBack: vi.fn(),
    routeInfo: {} as Record<string, unknown>,
  };
  return {
    ...actual,
    useIonViewWillEnter: (cb: () => void) => useEffect(() => { cb(); }, []),
    useIonRouter: () => ionRouterStub,
    /** El contenido real de IonModal queda en shadow DOM; en tests exponemos hijos en light DOM. */
    IonModal: ({
      isOpen,
      children,
    }: {
      isOpen: boolean;
      children?: React.ReactNode;
    }) => (isOpen ? <div data-testid="ion-modal-mock">{children}</div> : null),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <IonApp>{children}</IonApp>
  </MemoryRouter>
);

beforeEach(() => {
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'test@test.com',
    roles: ['ROLE_CLIENT'],
    clientProfile: { id: 1, fullName: 'Test User', '@id': '/clients/1' },
  }));
  (sessionStorage as any).clear?.();
});

test('Profile renders menu sections', () => {
  render(<Profile />, { wrapper });
  expect(screen.getByText('Datos Personales')).toBeInTheDocument();
  expect(screen.getByText('Cuenta')).toBeInTheDocument();
  expect(screen.getByText('CERRAR SESIÓN')).toBeInTheDocument();
});

test('Profile does not show paid-through-expired banner when paidThroughAt is null', () => {
  render(<Profile />, { wrapper });
  expect(screen.queryByText('Tu plan ha caducado')).not.toBeInTheDocument();
});

test('Profile does not show paid-through-expired banner when paidThroughAt is in the future', () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'test@test.com',
    roles: ['ROLE_CLIENT'],
    clientProfile: { id: 1, fullName: 'Test User', '@id': '/clients/1' },
    paidThroughAt: futureDate.toISOString(),
  }));
  render(<Profile />, { wrapper });
  expect(screen.queryByText('Tu plan ha caducado')).not.toBeInTheDocument();
});

test('Profile shows paid-through-expired banner when paidThroughAt is in the past', async () => {
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'test@test.com',
    roles: ['ROLE_CLIENT'],
    clientProfile: { id: 1, fullName: 'Test User', '@id': '/clients/1' },
    paidThroughAt: pastDate.toISOString(),
  }));
  render(<Profile />, { wrapper });
  expect(await screen.findByText('Tu plan ha caducado')).toBeInTheDocument();
  expect(screen.getByText(/Renueva tu suscripción para mantener tu perfil profesional/i)).toBeInTheDocument();
});

test('Profile shows Seguridad y Contraseña menu item', () => {
  render(<Profile />, { wrapper });
  expect(screen.getByText('Seguridad y Contraseña')).toBeInTheDocument();
});

test('Profile opens password change modal when Seguridad y Contraseña is clicked', async () => {
  render(<Profile />, { wrapper });
  fireEvent.click(screen.getByText('Seguridad y Contraseña'));
  await waitFor(() => {
    expect(screen.getByText('Cambiar contraseña')).toBeInTheDocument();
    expect(screen.getByText('CAMBIAR CONTRASEÑA')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tu contraseña actual')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument();
  });
});

test('Profile does not call API when submitting password change without current password', async () => {
  render(<Profile />, { wrapper });
  fireEvent.click(screen.getByText('Seguridad y Contraseña'));
  await waitFor(() => expect(screen.getByText('CAMBIAR CONTRASEÑA')).toBeInTheDocument());
  fireEvent.click(screen.getByText('CAMBIAR CONTRASEÑA'));
  await waitFor(() => {
    expect(api.patch).not.toHaveBeenCalled();
  });
});

test('Profile password modal has all form fields', async () => {
  render(<Profile />, { wrapper });
  fireEvent.click(screen.getByText('Seguridad y Contraseña'));
  await waitFor(() => {
    expect(screen.getByPlaceholderText('Tu contraseña actual')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mínimo 6 caracteres')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirma la nueva contraseña')).toBeInTheDocument();
  });
});

test('Profile shows subscription section for PRO with future paidThroughAt and no cancellation', () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: futureDate.toISOString(),
  }));

  render(<Profile />, { wrapper });

  expect(screen.getByText('Suscripción')).toBeInTheDocument();
  expect(screen.getByText('Plan actual')).toBeInTheDocument();
  expect(screen.getByText('PRO')).toBeInTheDocument();
  expect(screen.getByText('Cancelar suscripción')).toBeInTheDocument();
  expect(screen.queryByText('Reactivar suscripción')).not.toBeInTheDocument();
});

test('Profile shows cancelled subscription state and Reactivar button when cancellation requested', async () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: futureDate.toISOString(),
  }));

  render(<Profile />, { wrapper });

  // Al cancelar la suscripción se marca el estado cancelado y se muestra el botón de reactivación
  fireEvent.click(screen.getByText('Cancelar suscripción'));

  await waitFor(() => {
    expect(screen.getByText(/Tu suscripción está cancelada\./i)).toBeInTheDocument();
    expect(screen.getByText('Reactivar suscripción')).toBeInTheDocument();
  });
});

test('Profile still shows Reactivar suscripción after clicking it and returning without renewing', () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: futureDate.toISOString(),
  }));
  (sessionStorage as any).setItem?.('quira_subscription_cancel_requested', '1');

  const { unmount } = render(<Profile />, { wrapper });
  expect(screen.getByText('Reactivar suscripción')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Reactivar suscripción'));
  unmount();
  render(<Profile />, { wrapper });

  expect(screen.getByText('Reactivar suscripción')).toBeInTheDocument();
  expect(screen.queryByText('Cancelar suscripción')).not.toBeInTheDocument();
});

test('Profile calls GET /users/{id} on enter to refresh user data', async () => {
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { id: 1, email: 'test@test.com', roles: ['ROLE_CLIENT'], clientProfile: { id: 1, fullName: 'Test User', '@id': '/clients/1' } } });
  render(<Profile />, { wrapper });
  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith('/users/1');
  });
});

test('Profile shows Reactivar when refetch returns subscriptionCancelAtPeriodEnd true', async () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const proUser = {
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: futureDate.toISOString(),
  };
  (localStorage as any).setItem?.('user', JSON.stringify(proUser));
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { ...proUser, subscriptionCancelAtPeriodEnd: true },
  });
  render(<Profile />, { wrapper });
  await waitFor(() => {
    expect(screen.getByText('Reactivar suscripción')).toBeInTheDocument();
  }, { timeout: 2000 });
  expect(screen.queryByText('Cancelar suscripción')).not.toBeInTheDocument();
});

test('Profile updates localStorage with subscriptionCancelAtPeriodEnd after successful cancel', async () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const proUser = {
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: futureDate.toISOString(),
  };
  (localStorage as any).setItem?.('user', JSON.stringify(proUser));
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: proUser });
  (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({});
  render(<Profile />, { wrapper });
  fireEvent.click(screen.getByText('Cancelar suscripción'));
  await waitFor(() => {
    const stored = JSON.parse((localStorage as any).getItem?.('user') ?? '{}');
    expect(stored.subscriptionCancelAtPeriodEnd).toBe(true);
  });
});

test('Profile keeps showing from localStorage when refetch fails', async () => {
  (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));
  render(<Profile />, { wrapper });
  await waitFor(() => {
    expect(api.get).toHaveBeenCalled();
  });
  expect(screen.getByText('Datos Personales')).toBeInTheDocument();
  expect(screen.getByText('Cuenta')).toBeInTheDocument();
});

/** Desactivado: IonToast + modal de mapa requieren entorno Ionic más completo; cubrir en E2E. */
test.skip('Profile shows validation error when saving pro profile without required professional fields', async () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: {
      id: 10,
      fullName: 'Pro User',
      '@id': '/professional_profiles/10',
      bio: '',
      address: '',
      skills: [],
      phoneNumber: '+34000000000',
    },
    paidThroughAt: futureDate.toISOString(),
  }));

  render(<Profile />, { wrapper });

  fireEvent.click(screen.getByText('Datos Personales'));

  await waitFor(() => expect(screen.getByText('GUARDAR CAMBIOS')).toBeInTheDocument());
  fireEvent.click(screen.getByText('GUARDAR CAMBIOS'));

  await waitFor(() => {
    expect(screen.getByText('La biografía es obligatoria para perfil profesional.')).toBeInTheDocument();
    expect(api.patch).not.toHaveBeenCalled();
  });
});

