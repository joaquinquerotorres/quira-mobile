import React from 'react';
import { render, screen } from '@testing-library/react';
import { DirectoryDetailReviews } from './DirectoryDetailReviews';

const mockReviews = [
  { id: 1, author: 'Juan P.', rating: 5, text: 'Excelente trabajo', date: '2024-01-15' },
  { id: 2, author: 'María G.', rating: 4, comment: 'Muy profesional', date: '2024-01-10' },
];

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

test('DirectoryDetailReviews renders Opiniones header with count', () => {
  render(<DirectoryDetailReviews reviews={mockReviews} />, { wrapper });
  expect(screen.getByText('Opiniones')).toBeInTheDocument();
  expect(screen.getByText('(2)')).toBeInTheDocument();
});

test('DirectoryDetailReviews renders all reviews', () => {
  render(<DirectoryDetailReviews reviews={mockReviews} />, { wrapper });
  expect(screen.getByText('Juan P.')).toBeInTheDocument();
  expect(screen.getByText('María G.')).toBeInTheDocument();
  expect(screen.getByText(/Excelente trabajo/)).toBeInTheDocument();
  expect(screen.getByText(/Muy profesional/)).toBeInTheDocument();
});

test('DirectoryDetailReviews renders empty state when no reviews', () => {
  render(<DirectoryDetailReviews reviews={[]} />, { wrapper });
  expect(screen.getByText('Opiniones')).toBeInTheDocument();
  expect(screen.getByText('(0)')).toBeInTheDocument();
});

test('DirectoryDetailReviews omits quote when review has no comment', () => {
  render(
    <DirectoryDetailReviews
      reviews={[{ id: 3, author: 'Ana L.', rating: 5, date: '2024-02-01' }]}
    />,
    { wrapper },
  );
  expect(screen.getByText('Ana L.')).toBeInTheDocument();
  expect(screen.queryByText(/"/)).not.toBeInTheDocument();
  expect(screen.queryByText('""')).not.toBeInTheDocument();
});
