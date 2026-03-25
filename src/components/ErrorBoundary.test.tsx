import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

vi.mock('@ionic/react', () => ({
  IonPage: ({ children }: any) => <div>{children}</div>,
  IonContent: ({ children }: any) => <div>{children}</div>,
  IonButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

function Boom() {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // jsdom reload mock
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  test('renders fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Algo ha ido mal')).toBeInTheDocument();
    expect(screen.getByText(/Se ha producido un error inesperado/i)).toBeInTheDocument();
    expect(screen.getByText('Recargar aplicación')).toBeInTheDocument();
  });

  test('reload button calls window.location.reload', () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText('Recargar aplicación'));
    expect(window.location.reload).toHaveBeenCalled();
  });
});

