import React from 'react';
import { render, screen } from '@testing-library/react';
import { LogoHeader } from './LogoHeader';

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

test('LogoHeader renders Quira brand text', () => {
  render(<LogoHeader />, { wrapper });
  expect(screen.getByText('Qu')).toBeInTheDocument();
  expect(screen.getByText('i')).toBeInTheDocument();
  expect(screen.getByText('r')).toBeInTheDocument();
  expect(screen.getByText('a')).toBeInTheDocument();
});

test('LogoHeader has brand container class', () => {
  const { container } = render(<LogoHeader />, { wrapper });
  const brandContainer = container.querySelector('.brand-container');
  expect(brandContainer).toBeInTheDocument();
});
