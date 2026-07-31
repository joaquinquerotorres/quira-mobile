import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { RequestDetailMedia } from './RequestDetailMedia';

const openRequestMediaFromSources = vi.fn();

vi.mock('../shared/RequestMediaModal', () => ({
  openRequestMediaFromSources: (...args: unknown[]) =>
    openRequestMediaFromSources(...args),
}));

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
    openRequestMediaFromSources.mockClear();
    render(
      <RequestDetailMedia
        request={{ ...baseRequest, videoUrl: '/v.mp4' }}
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    fireEvent.click(video!);
    expect(openRequestMediaFromSources).toHaveBeenCalledWith(
      expect.objectContaining({ videoUrl: '/v.mp4' }),
      { url: '/v.mp4', kind: 'video' },
    );
  });

  test('renders photo when photoUrl exists (and no video)', () => {
    openRequestMediaFromSources.mockClear();
    render(
      <RequestDetailMedia
        request={{ ...baseRequest, photoUrl: '/p.jpg' }}
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    const img = document.querySelector('img[alt="Detalle"]');
    expect(img).toBeInTheDocument();
    fireEvent.click(img!);
    expect(openRequestMediaFromSources).toHaveBeenCalledWith(
      expect.objectContaining({ photoUrl: '/p.jpg' }),
      { url: '/p.jpg', kind: 'photo' },
    );
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

  test('renders placeholder when no media', () => {
    render(
      <RequestDetailMedia
        request={baseRequest}
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
  expect(screen.getByTestId('ion-icon')).toBeInTheDocument();
  });

  test('does not render IA range badge', () => {
    render(
      <RequestDetailMedia
        request={baseRequest}
        isPlayingAudio={false}
        onToggleAudio={vi.fn()}
      />,
    );
    expect(screen.queryByText('Rango estimado (IA)')).not.toBeInTheDocument();
    expect(screen.queryByText('45€ - 55€')).not.toBeInTheDocument();
  });
});

