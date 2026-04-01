import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { waterOutline } from 'ionicons/icons';
import { MyWorkBidCard, MyWorkJobCard } from './MyWorkCards';
import { Bid, ServiceRequest } from '../../types';

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

const catStyle = { label: 'Fontanería', icon: waterOutline, color: '#3b82f6', bg: '#dbeafe' };
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

test('MyWorkBidCard renders request title and bid price', () => {
  render(
    <MyWorkBidCard
      bid={mockBid}
      request={mockRequest}
      requestId={1}
      borderClass=""
      statusLabel="Pendiente"
      badgeClass=""
      catStyle={catStyle}
      serverUrl="http://api.test"
      playingAudioId={null}
      onToggleAudio={vi.fn()}
      onClick={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Reparar grifo')).toBeInTheDocument();
  expect(screen.getByText('60€')).toBeInTheDocument();
  expect(screen.getByText('TU PROPUESTA')).toBeInTheDocument();
  expect(screen.getByText('Calle Mayor 1')).toBeInTheDocument();
  expect(screen.getByText('Esta semana')).toBeInTheDocument();
});

test('MyWorkBidCard calls onClick when card is clicked', () => {
  const onClick = vi.fn();
  render(
    <MyWorkBidCard
      bid={mockBid}
      request={mockRequest}
      requestId={1}
      borderClass=""
      statusLabel="Pendiente"
      badgeClass=""
      catStyle={catStyle}
      serverUrl=""
      playingAudioId={null}
      onToggleAudio={vi.fn()}
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
      jobId={1}
      borderClass=""
      statusLabel="Completado"
      badgeClass=""
      catStyle={catStyle}
      serverUrl=""
      dateToShow="2024-01-20"
      playingAudioId={null}
      onToggleAudio={vi.fn()}
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
      requestId={1}
      borderClass="mw-card-closed"
      statusLabel="CERRADA"
      badgeClass="mw-status-closed"
      catStyle={catStyle}
      serverUrl="http://api.test"
      playingAudioId={null}
      onToggleAudio={vi.fn()}
      onClick={vi.fn()}
    />,
    { wrapper }
  );
  expect(screen.getByText('Reparar grifo')).toBeInTheDocument();
  expect(screen.getByText('60€')).toBeInTheDocument();
  expect(screen.getByText('CERRADA')).toBeInTheDocument();
});
