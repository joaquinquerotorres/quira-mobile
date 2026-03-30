import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { RequestDetailMedia } from './RequestDetailMedia';

vi.mock('@ionic/react', () => ({
  IonIcon: ({ icon }: any) => <span data-testid="ion-icon">{String(icon?.name ?? icon ?? '')}</span>,
  IonImg: (props: any) => <img data-testid="ion-img" {...props} />,
}));

describe('RequestDetailMedia', () => {
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
      <RequestDetailMedia
        request={{ ...baseRequest, videoUrl: '/v.mp4' }}
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    expect(document.querySelector('video')).toBeInTheDocument();
  });

  test('renders photo when photoUrl exists (and no video)', () => {
    render(
      <RequestDetailMedia
        request={{ ...baseRequest, photoUrl: '/p.jpg' }}
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    const img = document.querySelector('img[alt="Detalle"]');
    expect(img).toBeInTheDocument();
  });

  test('renders audio UI and calls onToggleAudio on click', () => {
    const onToggleAudio = vi.fn();
    render(
      <RequestDetailMedia
        request={{ ...baseRequest, audioUrl: '/a.mp3' }}
        isPlayingAudio={false}
        onToggleAudio={onToggleAudio}
      />,
    );
    fireEvent.click(screen.getByText('Escuchar explicación'));
    expect(onToggleAudio).toHaveBeenCalledWith('/a.mp3');
  });

  test('does not render placeholder image when no media', () => {
    render(
      <RequestDetailMedia
        request={baseRequest}
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('ion-img')).not.toBeInTheDocument();
    expect(screen.queryByText('Rango estimado (IA)')).not.toBeInTheDocument();
  });
});

