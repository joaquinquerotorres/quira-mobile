import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';
import { ROLE_ADMIN } from '../../utils/adminAccess';

const fetchAdminStatsOverview = vi.fn();

vi.mock('../../api/adminApi', async () => {
  const actual = await vi.importActual<typeof import('../../api/adminApi')>(
    '../../api/adminApi',
  );
  return {
    ...actual,
    fetchAdminStatsOverview: (...args: unknown[]) =>
      fetchAdminStatsOverview(...args),
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
  };
});

const overview = {
  period: {
    from: '2026-07-01',
    to: '2026-07-31',
    previousFrom: '2026-06-01',
    previousTo: '2026-06-30',
  },
  kpis: {
    newUsers: { value: 10, previous: 8 },
    newPros: { value: 3, previous: 2 },
    newRequests: { value: 20, previous: 15 },
    newBids: { value: 40, previous: 30 },
    acceptedBids: { value: 5, previous: 4 },
    completedRequests: { value: 2, previous: 1 },
    activePaidSubscriptions: { value: 7, previous: 6 },
    cancelAtPeriodEnd: { value: 1 },
  },
  funnel: {
    registered: 10,
    phoneVerified: 8,
    firstRequest: 5,
    firstBid: 4,
    acceptedJob: 2,
    completedJob: 1,
    reviewed: 1,
  },
  queues: { pendingApproval: 2, pendingVisitRequests: 1 },
  timeseries: {
    grain: 'day' as const,
    points: [
      {
        date: '2026-07-01',
        newUsers: 1,
        newRequests: 2,
        newBids: 3,
        acceptedBids: 0,
      },
      {
        date: '2026-07-02',
        newUsers: 2,
        newRequests: 1,
        newBids: 4,
        acceptedBids: 1,
      },
    ],
  },
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    fetchAdminStatsOverview.mockReset();
  });

  test('blocks non-admin users', () => {
    localStorage.setItem('user', JSON.stringify({ roles: ['ROLE_CLIENT'] }));
    render(<AdminDashboard />);
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
    expect(fetchAdminStatsOverview).not.toHaveBeenCalled();
  });

  test('loads overview for ROLE_ADMIN', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ roles: ['ROLE_CLIENT', ROLE_ADMIN] }),
    );
    fetchAdminStatsOverview.mockResolvedValue(overview);
    render(<AdminDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Moderación (PENDING_APPROVAL)')).toBeInTheDocument();
    });
    expect(screen.getByText('Usuarios nuevos')).toBeInTheDocument();
    expect(screen.getByText('Embudo')).toBeInTheDocument();
    expect(fetchAdminStatsOverview).toHaveBeenCalledWith('30d');
  });

  test('changes range', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ roles: [ROLE_ADMIN] }),
    );
    fetchAdminStatsOverview.mockResolvedValue(overview);
    render(<AdminDashboard />);
    await waitFor(() => expect(fetchAdminStatsOverview).toHaveBeenCalled());
    fireEvent.click(screen.getByText('7 días'));
    await waitFor(() => {
      expect(fetchAdminStatsOverview).toHaveBeenLastCalledWith('7d');
    });
  });
});
