import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthLogo } from './AuthLogo';

test('AuthLogo renders Quira branding', () => {
  render(<AuthLogo />);
  expect(screen.getByText('Qu')).toBeInTheDocument();
  expect(screen.getByText('r')).toBeInTheDocument();
  expect(screen.getByText('a')).toBeInTheDocument();
});

test('AuthLogo supports size variants', () => {
  const { rerender } = render(<AuthLogo size="big" />);
  const container = screen.getByText('Qu').parentElement;
  expect(container).toHaveClass('auth-logo--big');

  rerender(<AuthLogo size="compact" />);
  expect(container).toHaveClass('auth-logo--compact');
});
