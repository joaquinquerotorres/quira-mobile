import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { RequestMediaChip } from './RequestMediaModal';

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
  };
});

test('RequestMediaChip renders nothing without media', () => {
  const { container } = render(<RequestMediaChip />);
  expect(container).toBeEmptyDOMElement();
});

test('RequestMediaChip opens modal with media count', () => {
  render(
    <RequestMediaChip photoUrl="/p.jpg" audioUrl="/a.mp3" />,
  );
  expect(screen.getByText('Media')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  fireEvent.click(screen.getByText('Media'));
  expect(screen.getByTestId('media-modal')).toBeInTheDocument();
  expect(screen.getByText(/Foto/)).toBeInTheDocument();
});

test('RequestMediaChip stops card navigation when opening media', () => {
  const onCardClick = vi.fn();
  render(
    <div onClick={onCardClick}>
      <RequestMediaChip videoUrl="/v.mp4" />
    </div>,
  );
  fireEvent.click(screen.getByText('Media'));
  expect(onCardClick).not.toHaveBeenCalled();
  expect(screen.getByTestId('media-modal')).toBeInTheDocument();
  expect(screen.getByText(/Vídeo/)).toBeInTheDocument();
});

test('RequestMediaChip can move between slides', () => {
  render(
    <RequestMediaChip photoUrl="/p.jpg" videoUrl="/v.mp4" audioUrl="/a.mp3" />,
  );
  fireEvent.click(screen.getByText('Media'));
  expect(screen.getByText(/Foto \(1\/3\)/)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Ir a Vídeo'));
  expect(screen.getByText(/Vídeo \(2\/3\)/)).toBeInTheDocument();
});
