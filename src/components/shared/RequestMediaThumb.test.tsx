import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { RequestMediaThumb } from './RequestMediaThumb';

vi.mock('@ionic/react', () => ({
  IonImg: (props: any) => <img data-testid="ion-img" {...props} />,
  IonIcon: ({ icon }: any) => <span data-testid="ion-icon">{String(icon?.name ?? icon ?? '')}</span>,
}));

describe('RequestMediaThumb', () => {
  test('renders placeholder logo when no media provided', () => {
    render(
      <RequestMediaThumb
        variant="market"
        requestId={1}
        playingAudioId={null}
      />,
    );
    expect(screen.getByTestId('ion-img')).toBeInTheDocument();
  });

  test('renders image when photoSrc is provided', () => {
    render(
      <RequestMediaThumb
        variant="market"
        requestId={1}
        photoSrc="https://img"
        playingAudioId={null}
      />,
    );
    const img = screen.getByTestId('ion-img');
    expect(img).toHaveAttribute('src', 'https://img');
  });

  test('calls onToggleAudio with id and url when audio is clicked', () => {
    const onToggleAudio = vi.fn();
    const { container } = render(
      <RequestMediaThumb
        variant="requestList"
        requestId={7}
        audioUrl="/a.mp3"
        playingAudioId={null}
        onToggleAudio={onToggleAudio}
      />,
    );
    const audioDiv = container.querySelector('.request-list-thumb-media.audio');
    expect(audioDiv).toBeInTheDocument();
    if (audioDiv) fireEvent.click(audioDiv);
    expect(onToggleAudio).toHaveBeenCalledWith(expect.anything(), 7, '/a.mp3');
  });

  test('does not call onToggleAudio when handler missing', () => {
    const { container } = render(
      <RequestMediaThumb
        variant="requestList"
        requestId={7}
        audioUrl="/a.mp3"
        playingAudioId={null}
      />,
    );
    const audioDiv = container.querySelector('.request-list-thumb-media.audio');
    expect(audioDiv).toBeInTheDocument();
    if (audioDiv) fireEvent.click(audioDiv);
    // no crash is the assertion here
  });

  test('uses variant-specific wrapper class', () => {
    const { container: c1 } = render(
      <RequestMediaThumb variant="market" requestId={1} playingAudioId={null} />,
    );
    expect(c1.querySelector('.mkt-thumb')).toBeInTheDocument();

    const { container: c2 } = render(
      <RequestMediaThumb variant="myWork" requestId={1} playingAudioId={null} />,
    );
    expect(c2.querySelector('.mw-thumb')).toBeInTheDocument();
  });
});

