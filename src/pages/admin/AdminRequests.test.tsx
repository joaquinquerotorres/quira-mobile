import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AdminRequests from './AdminRequests';
import { ROLE_ADMIN } from '../../utils/adminAccess';

const fetchAdminRequests = vi.fn();

vi.mock('../../api/adminApi', async () => {
  const actual = await vi.importActual<typeof import('../../api/adminApi')>(
    '../../api/adminApi',
  );
  return {
    ...actual,
    fetchAdminRequests: (...args: unknown[]) => fetchAdminRequests(...args),
  };
});

vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual<typeof import('@ionic/react')>(
    '@ionic/react',
  );
  return {
    ...actual,
    useIonRouter: () => ({ push: vi.fn() }),
    IonPage: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    IonHeader: ({ children }: any) => <div>{children}</div>,
    IonToolbar: ({ children }: any) => <div>{children}</div>,
    IonTitle: ({ children }: any) => <h1>{children}</h1>,
    IonButtons: ({ children }: any) => <div>{children}</div>,
    IonButton: ({ children, onClick, ...props }: any) => (
      <button type="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
    IonContent: ({ children }: any) => <div>{children}</div>,
    IonIcon: () => null,
    IonSpinner: () => <span>loading</span>,
    IonRefresher: () => null,
    IonRefresherContent: () => null,
    IonInfiniteScroll: ({ children }: any) => <div>{children}</div>,
    IonInfiniteScrollContent: () => null,
  };
});

describe('AdminRequests', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchAdminRequests.mockReset();
  });

  test('blocks non-admin', () => {
    localStorage.setItem('user', JSON.stringify({ roles: ['ROLE_CLIENT'] }));
    render(<AdminRequests />);
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
    expect(fetchAdminRequests).not.toHaveBeenCalled();
  });

  test('lists requests for admin', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ roles: [ROLE_ADMIN] }),
    );
    fetchAdminRequests.mockResolvedValue({
      items: [
        {
          id: 12,
          title: 'Fuga en cocina',
          status: 'PENDING_APPROVAL',
          category: 'PLUMBING',
          riskLevel: 'LOW',
          bidCount: 0,
          estimatedPriceMin: 4500,
          estimatedPriceMax: 7500,
          createdAt: '2026-07-31T10:00:00Z',
          clientName: 'Ana',
          clientEmail: 'ana@example.com',
          aiSafe: false,
          aiInScope: true,
        },
      ],
      total: 1,
      page: 1,
      itemsPerPage: 20,
    });
    render(<AdminRequests />);
    await waitFor(() => {
      expect(screen.getByText('Fuga en cocina')).toBeInTheDocument();
    });
    expect(screen.getByText(/IA: safe=false/)).toBeInTheDocument();
    expect(screen.getByText('#12')).toBeInTheDocument();
    expect(fetchAdminRequests).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ALL', page: 1 }),
    );
  });

  test('changes status filter', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ roles: [ROLE_ADMIN] }),
    );
    fetchAdminRequests.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      itemsPerPage: 20,
    });
    render(<AdminRequests />);
    await waitFor(() => expect(fetchAdminRequests).toHaveBeenCalled());
    fireEvent.click(screen.getAllByRole('button', { name: 'Moderación' })[0]);
    await waitFor(() => {
      expect(fetchAdminRequests).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'PENDING_APPROVAL' }),
      );
    });
  });
});
