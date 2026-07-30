import React, { useEffect } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import Profile from './Profile';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() },
}));

vi.mock('react-google-places-autocomplete', () => ({
  __esModule: true,
  default: () => <div data-testid="google-places-autocomplete" />,
  geocodeByAddress: vi.fn(),
  getLatLng: vi.fn(),
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
    IonApp: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
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
  (api.get as ReturnType<typeof vi.fn>).mockReset();
  (api.patch as ReturnType<typeof vi.fn>).mockReset();
  (api.post as ReturnType<typeof vi.fn>).mockReset();
  (localStorage as any).clear?.();
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'test@test.com',
    roles: ['ROLE_CLIENT'],
    clientProfile: { id: 1, fullName: 'Test User', '@id': '/clients/1' },
  }));
  (localStorage as any).setItem?.('quira_active_mode', 'client');
  (sessionStorage as any).clear?.();
});

function setProUser(user: Record<string, unknown>) {
  (localStorage as any).setItem?.('user', JSON.stringify(user));
  (localStorage as any).setItem?.('quira_active_mode', 'pro');
}
test('Profile renders menu sections', () => {
  render(<Profile />, { wrapper });
  expect(screen.getByText('Datos Personales')).toBeInTheDocument();
  expect(screen.getByText('Cuenta')).toBeInTheDocument();
  expect(screen.getByText('CERRAR SESIÓN')).toBeInTheDocument();
});

test('Profile does not show paid-through-expired banner when paidThroughAt is null for CLIENT', () => {
  render(<Profile />, { wrapper });
  expect(screen.queryByText('Tu plan ha caducado')).not.toBeInTheDocument();
});

test('Profile shows paid-through-expired banner when ROLE_PRO and paidThroughAt is null', async () => {
  setProUser({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: null,
  });
  render(<Profile />, { wrapper });
  expect(await screen.findByText('Tu plan ha caducado')).toBeInTheDocument();
  expect(screen.queryByText('Mejorar mi plan')).not.toBeInTheDocument();
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

test('Profile shows Mejorar mi plan for SOLVER with suscripción activa (no caducada)', () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  setProUser({
    id: 1,
    email: 'solver@test.com',
    roles: ['ROLE_SOLVER'],
    professionalProfile: { id: 10, fullName: 'Solver User', '@id': '/professional_profiles/10' },
    paidThroughAt: futureDate.toISOString(),
  });
  render(<Profile />, { wrapper });
  expect(screen.getByText('Mejorar mi plan')).toBeInTheDocument();
  expect(screen.queryByText('Tu plan ha caducado')).not.toBeInTheDocument();
});

test('Profile does not show paid-through-expired banner for CLIENT mode even with past paidThroughAt', () => {
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'test@test.com',
    roles: ['ROLE_CLIENT'],
    clientProfile: { id: 1, fullName: 'Test User', '@id': '/clients/1' },
    paidThroughAt: pastDate.toISOString(),
  }));
  (localStorage as any).setItem?.('quira_active_mode', 'client');
  render(<Profile />, { wrapper });
  expect(screen.queryByText('Tu plan ha caducado')).not.toBeInTheDocument();
});

test('Profile shows paid-through-expired banner in pro mode when paidThroughAt is in the past', async () => {
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);
  setProUser({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: pastDate.toISOString(),
  });
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
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
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
  setProUser({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: futureDate.toISOString(),
  });

  render(<Profile />, { wrapper });

  expect(screen.queryByText('Mejorar mi plan')).not.toBeInTheDocument();
  expect(screen.getByText('Suscripción')).toBeInTheDocument();
  expect(screen.getByText('Plan actual')).toBeInTheDocument();
  expect(screen.getByText('PRO')).toBeInTheDocument();
  expect(screen.getByText('Cancelar suscripción')).toBeInTheDocument();
  expect(screen.queryByText('Reactivar suscripción')).not.toBeInTheDocument();
});

test('Profile shows cancelled subscription state and Reactivar button when cancellation requested', async () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  setProUser({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: futureDate.toISOString(),
  });

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
  setProUser({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_PRO'],
    professionalProfile: { id: 10, fullName: 'Pro User', '@id': '/professional_profiles/10' },
    paidThroughAt: futureDate.toISOString(),
  });
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
  setProUser(proUser);
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
  setProUser(proUser);
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

test('Profile auto-verifies client phone when matching an already verified professional phone', async () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_SOLVER'],
    clientProfile: {
      id: 101,
      fullName: 'Cliente',
      phoneNumber: '611 111 111',
      verifiedPhone: false,
      '@id': '/client_profiles/101',
    },
    professionalProfile: {
      id: 202,
      fullName: 'Profesional',
      phoneNumber: '+34 600 999 888',
      verifiedPhone: true,
      bio: 'Bio pro',
      address: 'Córdoba',
      skills: ['PLUMBING'],
      taxId: '',
      serviceRadiusKm: 30,
      '@id': '/professional_profiles/202',
    },
    paidThroughAt: futureDate.toISOString(),
  }));
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: JSON.parse((localStorage as any).getItem('user')) });
  (api.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

  render(<Profile />, { wrapper });
  fireEvent.click(screen.getByText('Datos Personales'));

  await waitFor(() => expect(screen.getByText('GUARDAR CAMBIOS')).toBeInTheDocument());
  const phoneInputs = screen.getAllByPlaceholderText('600 000 000');
  fireEvent(phoneInputs[0], new CustomEvent('ionInput', { detail: { value: '600999888' } }));
  fireEvent.click(screen.getByText('GUARDAR CAMBIOS'));

  await waitFor(() => {
    expect(api.patch).toHaveBeenCalledWith(
      '/client_profiles/101',
      expect.objectContaining({
        phoneNumber: '600999888',
        verifiedPhone: true,
      }),
      expect.any(Object),
    );
  });
});

test('Profile auto-verifies professional phone when matching an already verified client phone', async () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  setProUser({
    id: 1,
    email: 'pro@test.com',
    roles: ['ROLE_SOLVER'],
    clientProfile: {
      id: 101,
      fullName: 'Cliente',
      phoneNumber: '+34 600 111 222',
      verifiedPhone: true,
      '@id': '/client_profiles/101',
    },
    professionalProfile: {
      id: 202,
      fullName: 'Profesional',
      phoneNumber: '622 222 222',
      verifiedPhone: false,
      bio: 'Bio pro',
      address: 'Córdoba',
      skills: ['PLUMBING'],
      taxId: '',
      serviceRadiusKm: 30,
      '@id': '/professional_profiles/202',
    },
    paidThroughAt: futureDate.toISOString(),
  });
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: JSON.parse((localStorage as any).getItem('user')) });
  (api.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

  render(<Profile />, { wrapper });
  fireEvent.click(screen.getByText('Datos Personales'));

  await waitFor(() => expect(screen.getByText('GUARDAR CAMBIOS')).toBeInTheDocument());
  const phoneInputs = screen.getAllByPlaceholderText('600 000 000');
  phoneInputs.forEach((input) => {
    fireEvent(input, new CustomEvent('ionInput', { detail: { value: '600111222' } }));
  });
  fireEvent.click(screen.getByText('GUARDAR CAMBIOS'));

  await waitFor(() => {
    expect(api.patch).toHaveBeenCalledWith(
      '/professional_profiles/202',
      expect.objectContaining({
        phoneNumber: '600111222',
        verifiedPhone: true,
      }),
      expect.any(Object),
    );
  });
});

test('Profile calls verify/phone/send after save when client phone changes and SMS is required', async () => {
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  (localStorage as any).setItem?.('user', JSON.stringify({
    id: 1,
    email: 'client@test.com',
    roles: ['ROLE_CLIENT'],
    clientProfile: {
      id: 101,
      fullName: 'Cliente Solo',
      phoneNumber: '600000001',
      verifiedPhone: false,
      '@id': '/client_profiles/101',
    },
    paidThroughAt: futureDate.toISOString(),
  }));
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: JSON.parse((localStorage as any).getItem('user')) });
  (api.patch as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });
  (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { success: true } });

  render(<Profile />, { wrapper });
  fireEvent.click(screen.getByText('Datos Personales'));

  await waitFor(() => expect(screen.getByText('GUARDAR CAMBIOS')).toBeInTheDocument());
  const phoneInputs = screen.getAllByPlaceholderText('600 000 000');
  fireEvent(phoneInputs[0], new CustomEvent('ionInput', { detail: { value: '600999777' } }));
  fireEvent.click(screen.getByText('GUARDAR CAMBIOS'));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith(
      '/verify/phone/send',
      { profile: 'client' },
      expect.any(Object),
    );
  });

  await waitFor(() => {
    expect(screen.getByText('Reenviar SMS')).toBeInTheDocument();
  });
});

