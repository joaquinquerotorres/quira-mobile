import React from 'react';
import { render, screen } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { RequestAvailabilityRow } from './RequestAvailabilityRow';
import { ServiceRequest } from '../../types';

const baseRequest = {
  '@id': '/api/requests/1',
  id: 1,
  title: 'Test',
  description: 'D',
  estimatedPriceMin: 1000,
  estimatedPriceMax: 2000,
  status: 'PENDING' as const,
  riskLevel: 'LOW' as const,
  category: 'DIY' as const,
  address: 'Calle 1',
  locationPoint: { type: 'Point' as const, coordinates: [0, 0] as [number, number] },
  createdAt: '2024-01-01',
  client: { '@id': '/c/1', id: 1, fullName: 'C', user: {} as any },
  bids: [],
} satisfies ServiceRequest;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <IonApp>{children}</IonApp>
);

test('variant list: sin desiredExecutionTime muestra Lo antes posible', () => {
  render(<RequestAvailabilityRow request={{ ...baseRequest, desiredExecutionTime: null }} />, {
    wrapper,
  });
  expect(screen.getByText('Lo antes posible')).toBeInTheDocument();
});

test('variant list: muestra desiredExecutionTime del backend', () => {
  render(
    <RequestAvailabilityRow
      request={{ ...baseRequest, desiredExecutionTime: 'La próxima semana' }}
    />,
    { wrapper },
  );
  expect(screen.getByText('La próxima semana')).toBeInTheDocument();
});

test('variant market: sin desiredExecutionTime muestra Lo antes posible', () => {
  render(
    <RequestAvailabilityRow request={{ ...baseRequest, desiredExecutionTime: undefined }} variant="market" />,
    { wrapper },
  );
  expect(screen.getByText('Lo antes posible')).toBeInTheDocument();
});

test('variant market: muestra texto de disponibilidad', () => {
  render(
    <RequestAvailabilityRow
      request={{ ...baseRequest, desiredExecutionTime: 'A convenir al aceptar la oferta' }}
      variant="market"
    />,
    { wrapper },
  );
  expect(screen.getByText('A convenir al aceptar la oferta')).toBeInTheDocument();
});
