import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ProRequestDetailMedia } from './ProRequestDetailMedia';

vi.mock('@ionic/react', () => ({
  IonIcon: ({ icon }: any) => <span data-testid="ion-icon">{String(icon?.name ?? icon ?? '')}</span>,
}));

describe('ProRequestDetailMedia', () => {
  const baseRequest: any = {
    id: 1,
    estimatedPriceMin: 4500,
    estimatedPriceMax: 5500,
    photoUrl: null,
    audioUrl: null,
    videoUrl: null,
  };

  test('renders video when videoUrl exists', () => {
    render(
      <ProRequestDetailMedia
        request={{ ...baseRequest, videoUrl: '/v.mp4' }}
        serverUrl=""
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  test('renders photo when photoUrl exists (and no video)', () => {
    render(
      <ProRequestDetailMedia
        request={{ ...baseRequest, photoUrl: '/p.jpg' }}
        serverUrl=""
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    const img = document.querySelector('img[alt="Problema"]');
    expect(img).toBeInTheDocument();
  });

  test('renders audio UI and calls onToggleAudio on click', () => {
    const onToggleAudio = vi.fn();
    render(
      <ProRequestDetailMedia
        request={{ ...baseRequest, audioUrl: '/a.mp3' }}
        serverUrl=""
        isPlayingAudio={false}
        onToggleAudio={onToggleAudio}
      />,
    );
    fireEvent.click(screen.getByText('Escuchar explicación'));
    expect(onToggleAudio).toHaveBeenCalledWith('/a.mp3');
  });

  test('renders placeholder when no media', () => {
    render(
      <ProRequestDetailMedia
        request={baseRequest}
        serverUrl=""
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    expect(screen.getByTestId('ion-icon')).toBeInTheDocument();
  });

  test('does not render IA range badge', () => {
    render(
      <ProRequestDetailMedia
        request={baseRequest}
        serverUrl=""
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    expect(screen.queryByText('Rango estimado (IA)')).not.toBeInTheDocument();
    expect(screen.queryByText('45€ - 55€')).not.toBeInTheDocument();
  });
});

