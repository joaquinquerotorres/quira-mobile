import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DirectoryCategoryChip } from './DirectoryCategoryChip';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

test('DirectoryCategoryChip renders category label', () => {
  render(
    <DirectoryCategoryChip categoryLabel="Albañilería" onClear={vi.fn()} />,
    { wrapper }
  );
  expect(screen.getByText('Albañilería')).toBeInTheDocument();
  expect(screen.getByText('Pulsa para ver todos')).toBeInTheDocument();
});

test('DirectoryCategoryChip calls onClear when clicked', () => {
  const onClear = vi.fn();
  render(
    <DirectoryCategoryChip categoryLabel="Fontanería" onClear={onClear} />,
    { wrapper }
  );
  fireEvent.click(screen.getByText('Fontanería'));
  expect(onClear).toHaveBeenCalled();
});
