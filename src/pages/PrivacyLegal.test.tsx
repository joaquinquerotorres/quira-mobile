import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PrivacyLegal from './PrivacyLegal';

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    useIonRouter: () => ({ goBack: vi.fn(), push: vi.fn() }),
  };
});

describe('PrivacyLegal', () => {
  test('muestra el título y secciones clave de RGPD', () => {
    render(
      <MemoryRouter>
        <PrivacyLegal />
      </MemoryRouter>,
    );
    expect(screen.getByText('Privacidad y datos personales')).toBeInTheDocument();
    expect(screen.getByText('1. Responsable del tratamiento')).toBeInTheDocument();
    expect(screen.getByText('5. Encargados del tratamiento y proveedores tecnológicos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Privacidad de Google/i })).toHaveAttribute(
      'href',
      'https://policies.google.com/privacy',
    );
    expect(screen.getByRole('link', { name: /quira\.app\/privacidad/i })).toHaveAttribute(
      'href',
      'https://quira.app/privacidad',
    );
  });
});
