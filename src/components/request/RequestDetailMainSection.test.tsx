import React from 'react';
import { render, screen } from '@testing-library/react';
import { RequestDetailMainSection } from './RequestDetailMainSection';
import { Bid, ServiceRequest } from '../../types';

const mockRequest: ServiceRequest = {
  '@id': '/requests/1',
  id: 1,
  title: 'Arreglo grifo',
  description: 'Grifo que gotea',
  priceAmount: 80,
  status: 'PENDING',
  riskLevel: 'LOW',
  category: 'PLUMBING',
  address: 'Calle Test 1, Madrid',
  locationPoint: { type: 'Point', coordinates: [0, 0] },
  createdAt: '2024-01-01',
  client: { '@id': '/clients/1', id: 1, fullName: 'Cliente', user: {} as any },
  bids: [],
};

const addressDisplay = { text: 'Zona: Madrid', icon: 'lock', label: 'Ubicación' };
const noop = () => {};

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

test('RequestDetailMainSection renders request title', () => {
  render(
    <RequestDetailMainSection
      request={mockRequest}
      addressDisplay={addressDisplay}
      serverUrl=""
      questionsCount={0}
      pendingAnswers={0}
      hasReviewed={false}
      onCallProfessional={noop}
      onOpenReviewModal={noop}
      onOpenQAModal={noop}
      onOpenAcceptModal={noop}
    />,
    { wrapper }
  );
  expect(screen.getByText('Arreglo grifo')).toBeInTheDocument();
});

test('RequestDetailMainSection shows PRO and SOLVER tier badges on bids', () => {
  const proBid: Bid = {
    id: 1,
    '@id': '/bids/1',
    priceQuote: 60,
    status: 'PENDING',
    createdAt: '2024-01-01',
    professional: { roles: ['ROLE_PRO'], professionalProfile: { id: 1, fullName: 'Pro User', '@id': '/pro/1' } } as any,
    request: mockRequest,
  };
  const solverBid: Bid = {
    id: 2,
    '@id': '/bids/2',
    priceQuote: 70,
    status: 'PENDING',
    createdAt: '2024-01-01',
    professional: { roles: ['ROLE_SOLVER'], user: { roles: ['ROLE_SOLVER'] }, professionalProfile: { id: 2, fullName: 'Solver User', '@id': '/pro/2' } } as any,
    request: mockRequest,
  };
  const requestWithBids = { ...mockRequest, status: 'PENDING' as const, bids: [solverBid, proBid] };

  render(
    <RequestDetailMainSection
      request={requestWithBids}
      addressDisplay={addressDisplay}
      serverUrl=""
      questionsCount={0}
      pendingAnswers={0}
      hasReviewed={false}
      onCallProfessional={noop}
      onOpenReviewModal={noop}
      onOpenQAModal={noop}
      onOpenAcceptModal={noop}
    />,
    { wrapper }
  );
  expect(screen.getByText('PRO')).toBeInTheDocument();
  expect(screen.getByText('SOLVER')).toBeInTheDocument();
  expect(screen.getByText('Pro User')).toBeInTheDocument();
  expect(screen.getByText('Solver User')).toBeInTheDocument();
});

test('RequestDetailMainSection shows assigned professional tier badge', () => {
  const requestWithAssigned = {
    ...mockRequest,
    status: 'ACCEPTED' as const,
    assignedProfessional: { id: 1, fullName: 'Pro Asignado', user: { roles: ['ROLE_PRO'] } } as any,
    bids: [],
  };

  render(
    <RequestDetailMainSection
      request={requestWithAssigned}
      addressDisplay={addressDisplay}
      serverUrl=""
      questionsCount={0}
      pendingAnswers={0}
      hasReviewed={false}
      onCallProfessional={noop}
      onOpenReviewModal={noop}
      onOpenQAModal={noop}
      onOpenAcceptModal={noop}
    />,
    { wrapper }
  );
  expect(screen.getByText('Profesional asignado')).toBeInTheDocument();
  expect(screen.getByText('PRO')).toBeInTheDocument();
});

test('RequestDetailMainSection shows rating and reviewCount for assigned professional', () => {
  const requestWithAssigned = {
    ...mockRequest,
    status: 'ACCEPTED' as const,
    assignedProfessional: {
      id: 1,
      fullName: 'Pro Asignado',
      user: { roles: ['ROLE_PRO'] },
      rating: 4.5,
      reviewCount: 12,
    } as any,
    bids: [],
  };

  render(
    <RequestDetailMainSection
      request={requestWithAssigned}
      addressDisplay={addressDisplay}
      serverUrl=""
      questionsCount={0}
      pendingAnswers={0}
      hasReviewed={false}
      onCallProfessional={noop}
      onOpenReviewModal={noop}
      onOpenQAModal={noop}
      onOpenAcceptModal={noop}
    />,
    { wrapper }
  );
  expect(screen.getByText('Pro Asignado')).toBeInTheDocument();
  expect(screen.getByText('4.5')).toBeInTheDocument();
  expect(screen.getByText('(12)')).toBeInTheDocument();
});

test('RequestDetailMainSection shows visit request PENDING with accept/reject actions', () => {
  const requestWithVisit = {
    ...mockRequest,
    status: 'PENDING' as const,
    visitRequests: [
      {
        id: 1,
        status: 'PENDING' as const,
        professional: { fullName: 'Pro Visitante', id: 1 } as any,
      },
    ],
  };
  const onAcceptVisit = vi.fn();
  const onRejectVisit = vi.fn();

  render(
    <RequestDetailMainSection
      request={requestWithVisit}
      addressDisplay={addressDisplay}
      serverUrl=""
      questionsCount={0}
      pendingAnswers={0}
      hasReviewed={false}
      onCallProfessional={noop}
      onOpenReviewModal={noop}
      onOpenQAModal={noop}
      onOpenAcceptModal={noop}
      visitRequest={requestWithVisit.visitRequests![0]}
      onAcceptVisit={onAcceptVisit}
      onRejectVisit={onRejectVisit}
    />,
    { wrapper }
  );
  expect(screen.getByText(/ha solicitado una visita para valorar/)).toBeInTheDocument();
  expect(screen.getByText('Aceptar visita')).toBeInTheDocument();
  expect(screen.getByText('Rechazar')).toBeInTheDocument();
});

test('RequestDetailMainSection shows category label (e.g. Manitas for DIY)', () => {
  const requestDIY = { ...mockRequest, category: 'DIY' as const };
  render(
    <RequestDetailMainSection
      request={requestDIY}
      addressDisplay={addressDisplay}
      serverUrl=""
      questionsCount={0}
      pendingAnswers={0}
      hasReviewed={false}
      onCallProfessional={noop}
      onOpenReviewModal={noop}
      onOpenQAModal={noop}
      onOpenAcceptModal={noop}
    />,
    { wrapper }
  );
  expect(screen.getByText('Manitas')).toBeInTheDocument();
});
