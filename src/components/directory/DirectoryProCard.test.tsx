import React from 'react';
import { render, screen } from '@testing-library/react';
import { DirectoryProCard } from './DirectoryProCard';

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

const basePro = {
  id: 1,
  fullName: 'Pro Test',
  avatar: undefined,
  user: { roles: ['ROLE_PRO'] },
};

test('DirectoryProCard shows — when rating is undefined (uses API rating only)', () => {
  const proWithReviewCountOnly = {
    ...basePro,
    rating: undefined,
    reviewCount: 2,
  };

  render(
    <DirectoryProCard
      pro={proWithReviewCountOnly as any}
      serverUrl="https://example.test"
      isPro={true}
      isSolver={false}
      onClick={() => {}}
    />,
    { wrapper }
  );

  expect(screen.getByText('—')).toBeInTheDocument();
  expect(screen.getByText('(2)')).toBeInTheDocument();
});

test('DirectoryProCard falls back to pro.rating when no reviews array', () => {
  const proWithRating = {
    ...basePro,
    rating: 4.3,
    reviewCount: 5,
    reviews: undefined,
  };

  render(
    <DirectoryProCard
      pro={proWithRating as any}
      serverUrl="https://example.test"
      isPro={true}
      isSolver={false}
      onClick={() => {}}
    />,
    { wrapper }
  );

  expect(screen.getByText('4.3')).toBeInTheDocument();
  expect(screen.getByText('(5)')).toBeInTheDocument();
});

test('DirectoryProCard shows skill labels in Spanish (not raw codes)', () => {
  const proWithSkills = {
    ...basePro,
    skills: ['PLUMBING', 'HVAC'],
    rating: 4,
    reviewCount: 1,
  };

  render(
    <DirectoryProCard
      pro={proWithSkills as any}
      serverUrl="https://example.test"
      isPro={true}
      isSolver={false}
      onClick={() => {}}
    />,
    { wrapper }
  );

  expect(screen.getByText('Fontanería • Climatización')).toBeInTheDocument();
});

test('DirectoryProCard does not show En Quira desde in listing', () => {
  render(
    <DirectoryProCard
      pro={{ ...basePro, createdAt: '2026-05-12T12:00:00Z', rating: 4, reviewCount: 1 } as any}
      serverUrl="https://example.test"
      isPro={true}
      isSolver={false}
      onClick={() => {}}
    />,
    { wrapper }
  );

  expect(screen.queryByText(/En Quira desde/)).not.toBeInTheDocument();
});

