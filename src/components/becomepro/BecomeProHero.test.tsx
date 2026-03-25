import React from 'react';
import { render, screen } from '@testing-library/react';
import { BecomeProHero } from './BecomeProHero';

test('BecomeProHero renders title and subtitle', () => {
  render(<BecomeProHero title="Elige tu Nivel" subtitle="Empieza gratis o desbloquea todo." />);
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Elige tu Nivel');
  expect(screen.getByText('Empieza gratis o desbloquea todo.')).toBeInTheDocument();
});

test('BecomeProHero has hero class', () => {
  const { container } = render(
    <BecomeProHero title="Test" subtitle="Sub" />
  );
  expect(container.querySelector('.become-pro-hero')).toBeInTheDocument();
});
