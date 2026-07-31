import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  openRequestMedia,
  RequestMediaChip,
  RequestMediaModalHost,
} from './RequestMediaModal';

vi.mock('@ionic/react', () => {
  const PassThrough = ({ children, ...props }: any) =>
    React.createElement('div', props, children);
  return {
    IonModal: ({ isOpen, children }: any) =>
      isOpen ? React.createElement('div', { 'data-testid': 'media-modal' }, children) : null,
    IonHeader: PassThrough,
    IonToolbar: PassThrough,
    IonTitle: ({ children }: any) => React.createElement('h1', null, children),
    IonButtons: PassThrough,
    IonButton: ({ children, onClick }: any) =>
      React.createElement('button', { onClick }, children),
    IonContent: PassThrough,
    IonIcon: () => null,
    IonSpinner: () => React.createElement('span', { 'data-testid': 'spinner' }, 'loading'),
  };
});

function renderWithHost(ui: React.ReactElement) {
  return render(
    <>
      <RequestMediaModalHost />
      {ui}
    </>,
  );
}

test('RequestMediaChip renders nothing without media', () => {
  const { container } = renderWithHost(<RequestMediaChip />);
  expect(container.querySelector('.request-media-chip')).toBeNull();
});

test('RequestMediaChip opens shared modal with media count', async () => {
  renderWithHost(<RequestMediaChip photoUrl="/p.jpg" audioUrl="/a.mp3" />);
  expect(screen.getByText('Media')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Media'));
  await waitFor(() => {
    expect(screen.getByTestId('media-modal')).toBeInTheDocument();
  });
  expect(screen.getByText(/Foto/)).toBeInTheDocument();
});

test('RequestMediaChip stops card navigation when opening media', async () => {
  const onCardClick = vi.fn();
  renderWithHost(
    <div onClick={onCardClick}>
      <RequestMediaChip videoUrl="/v.mp4" />
    </div>,
  );
  const chip = screen.getByText('Media');
  fireEvent.pointerDown(chip);
  fireEvent.mouseDown(chip);
  fireEvent.click(chip);
  expect(onCardClick).not.toHaveBeenCalled();
  await waitFor(() => {
    expect(screen.getByTestId('media-modal')).toBeInTheDocument();
  });
  expect(screen.getByText(/Vídeo/)).toBeInTheDocument();
});

test('RequestMediaChip counts primary and extra media', async () => {
  renderWithHost(
    <RequestMediaChip
      photoUrl="/p.jpg"
      extraPhotoUrls={['/p2.jpg']}
      extraVideoUrls={['/v2.mp4']}
    />,
  );
  expect(screen.getByText('Media')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Media'));
  await waitFor(() => {
    expect(screen.getByText(/Foto \(1\/3\)/)).toBeInTheDocument();
  });
  const photoDots = screen.getAllByLabelText('Ir a Foto');
  expect(photoDots).toHaveLength(2);
  fireEvent.click(photoDots[1]);
  expect(screen.getByText(/Foto \(2\/3\)/)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Ir a Vídeo'));
  expect(screen.getByText(/Vídeo \(3\/3\)/)).toBeInTheDocument();
});

test('RequestMediaChip can move between slides', async () => {
  renderWithHost(
    <RequestMediaChip photoUrl="/p.jpg" videoUrl="/v.mp4" audioUrl="/a.mp3" />,
  );
  fireEvent.click(screen.getByText('Media'));
  await waitFor(() => {
    expect(screen.getByText(/Foto \(1\/3\)/)).toBeInTheDocument();
  });
  fireEvent.click(screen.getByLabelText('Ir a Vídeo'));
  expect(screen.getByText(/Vídeo \(2\/3\)/)).toBeInTheDocument();
});

test('openRequestMedia can start on a given index', async () => {
  renderWithHost(<div />);
  act(() => {
    openRequestMedia(
      [
        { kind: 'photo', url: '/p.jpg' },
        { kind: 'video', url: '/v.mp4' },
      ],
      1,
    );
  });
  await waitFor(() => {
    expect(screen.getByText(/Vídeo \(2\/2\)/)).toBeInTheDocument();
  });
});
