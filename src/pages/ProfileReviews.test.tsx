import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import ProfileReviews from './ProfileReviews';
import * as reviewsApi from '../utils/reviewsApi';

vi.mock('../utils/reviewsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/reviewsApi')>();
  return {
    ...actual,
    fetchReviewsByTarget: vi.fn(),
    fetchReviewsByAuthor: vi.fn(),
    fetchProProfileEmbeddedReviews: vi.fn(),
  };
});

vi.mock('../utils/activeMode', () => ({
  getEffectiveActiveMode: () => 'client',
}));

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonApp: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    useIonRouter: () => ({
      push: vi.fn(),
      goBack: vi.fn(),
      routeInfo: {},
    }),
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <IonApp>
    <MemoryRouter>{children}</MemoryRouter>
  </IonApp>
);

beforeEach(() => {
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: 10,
      clientProfile: { id: 1, rating: 4.5, reviewCount: 2, fullName: 'Cliente' },
      professionalProfile: null,
    })
  );
  vi.mocked(reviewsApi.fetchReviewsByTarget).mockResolvedValue([
    {
      id: 1,
      authorName: 'Pro Ana',
      targetName: 'Cliente',
      rating: 5,
      comment: 'Cliente genial',
      dateLabel: 'Hoy',
      authorIsProfessional: true,
    },
    {
      id: 2,
      authorName: 'Pro Luis',
      targetName: 'Cliente',
      rating: 4,
      comment: 'Todo ok',
      dateLabel: 'Ayer',
      authorIsProfessional: true,
    },
  ]);
  vi.mocked(reviewsApi.fetchReviewsByAuthor).mockResolvedValue([
    {
      id: 3,
      authorName: 'Cliente',
      targetName: 'Manolo Pro',
      rating: 5,
      comment: 'Excelente',
      dateLabel: 'Hace 2 días',
      requestTitle: 'Pintar salon',
    },
  ]);
});

test('shows average and received reviews', async () => {
  render(<ProfileReviews />, { wrapper });
  await waitFor(() => {
    expect(screen.getByTestId('reviews-average')).toHaveTextContent('4.5');
  });
  expect(screen.getByText('Pro Ana')).toBeInTheDocument();
  expect(screen.getByText(/Cliente genial/)).toBeInTheDocument();
});

test('switches to given reviews', async () => {
  render(<ProfileReviews />, { wrapper });
  await waitFor(() => expect(screen.getByText('Pro Ana')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Hechas'));
  await waitFor(() => {
    expect(screen.getByText('Manolo Pro')).toBeInTheDocument();
  });
  expect(screen.getByText('Pintar salon')).toBeInTheDocument();
  expect(screen.queryByTestId('reviews-average')).not.toBeInTheDocument();
});
