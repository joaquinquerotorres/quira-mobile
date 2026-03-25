import React from 'react';
import { render, screen } from '@testing-library/react';
import { RegisterHeader } from './RegisterHeader';

test('RegisterHeader renders Quira logo', () => {
  render(<RegisterHeader />);
  expect(screen.getByText('Qu')).toBeInTheDocument();
});

test('RegisterHeader renders title and subtitle', () => {
  render(<RegisterHeader />);
  expect(screen.getByText('Crea tu cuenta')).toBeInTheDocument();
  expect(screen.getByText('Empieza a gestionar tu hogar hoy mismo.')).toBeInTheDocument();
});
