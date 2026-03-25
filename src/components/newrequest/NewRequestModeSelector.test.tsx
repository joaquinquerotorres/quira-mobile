import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewRequestModeSelector } from './NewRequestModeSelector';

const wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

test('NewRequestModeSelector renders Audio, Video and Text options', () => {
  render(
    <NewRequestModeSelector value="AUDIO" onChange={vi.fn()} />,
    { wrapper }
  );
  expect(screen.getByText('Audio')).toBeInTheDocument();
  expect(screen.getByText('Video')).toBeInTheDocument();
  expect(screen.getByText('Escribir')).toBeInTheDocument();
});

test('NewRequestModeSelector shows correct selected value', () => {
  const { container } = render(
    <NewRequestModeSelector value="VIDEO" onChange={vi.fn()} />,
    { wrapper }
  );
  const segment = container.querySelector('ion-segment');
  expect(segment).toHaveAttribute('value', 'VIDEO');
});
