import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MyWorkBidCard, MyWorkJobCard } from './MyWorkCards';
import { Bid, ServiceRequest } from '../../types';

vi.mock('../shared/RequestMediaModal', () => ({
  RequestMediaChip: ({ photoUrl, videoUrl, audioUrl }: any) =>
    photoUrl || videoUrl || audioUrl ? (
      <button type="button">Media</button>
    ) : null,
}));

const mockRequest: ServiceRequest = {
  '@id': '/requests/1',
  id: 1,
  title: 'Reparar grifo',
  description: 'Grifo que gotea',
  estimatedPriceMin: 7000,
  estimatedPriceMax: 9000,
  status: 'PENDING',
  riskLevel: 'LOW',
  category: 'PLUMBING',
  address: 'Calle Mayor 1, Madrid',
  desiredExecutionTime: 'Esta semana',
  locationPoint: { type: 'Point', coordinates: [0, 0] },
  createdAt: '2024-01-15T10:00:00Z',
  client: { '@id': '/clients/1', id: 1, fullName: 'Juan García', user: { '@id': '/users/1', id: 1, email: 'j@t.com', roles: [] } },
  bids: [],
};

const mockBid: Bid = {
  '@id': '/bids/1',
  id: 1,
  priceQuote: 60,
  status: 'PENDING',
  createdAt: '2024-01-15T11:00:00Z',
  professional: {} as any,
  request: mockRequest,
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

test('MyWorkBidCard renders request title and bid price', () => {
  render(
    <MyWorkBidCard
      bid={mockBid}
      request={mockRequest}
      status="pending"
      statusLabel="Pendiente"
      onClick={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Reparar grifo')).toBeInTheDocument();
  expect(screen.getByText('60€')).toBeInTheDocument();
  expect(screen.getByText('TU PROPUESTA')).toBeInTheDocument();
  expect(screen.getByText('Calle Mayor 1')).toBeInTheDocument();
  expect(screen.getByText('Esta semana')).toBeInTheDocument();
  expect(screen.getByText(/Fontanería/)).toBeInTheDocument();
});

test('MyWorkBidCard calls onClick when card is clicked', () => {
  const onClick = vi.fn();
  render(
    <MyWorkBidCard
      bid={mockBid}
      request={mockRequest}
      status="pending"
      statusLabel="Pendiente"
      onClick={onClick}
    />,
    { wrapper }
  );
  fireEvent.click(screen.getByText('Reparar grifo'));
  expect(onClick).toHaveBeenCalled();
});

test('MyWorkJobCard renders job and price', () => {
  render(
    <MyWorkJobCard
      job={{ ...mockRequest, status: 'COMPLETED' }}
      status="completed"
      statusLabel="Completado"
      dateToShow="2024-01-20"
      onClick={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Reparar grifo')).toBeInTheDocument();
  expect(screen.getByText('70€ - 90€')).toBeInTheDocument();
  expect(screen.getByText('GANADO')).toBeInTheDocument();
});

test('MyWorkBidCard renders accepted bid with custom badge', () => {
  const acceptedBid = { ...mockBid, status: 'ACCEPTED' as const };
  render(
    <MyWorkBidCard
      bid={acceptedBid}
      request={mockRequest}
      status="completed"
      statusLabel="CERRADA"
      onClick={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Reparar grifo')).toBeInTheDocument();
  expect(screen.getByText('60€')).toBeInTheDocument();
  expect(screen.getByText('CERRADA')).toBeInTheDocument();
});

test('MyWorkBidCard shows Media chip when request has media', () => {
  render(
    <MyWorkBidCard
      bid={mockBid}
      request={{ ...mockRequest, audioUrl: '/a.mp3' }}
      status="pending"
      statusLabel="Pendiente"
      onClick={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Media')).toBeInTheDocument();
});
