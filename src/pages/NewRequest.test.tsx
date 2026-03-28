import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NewRequest from './NewRequest';

const mockGetVerificationStatus = vi.fn();

const mockGetVideoUploadConnectionHint = vi.fn(() =>
  Promise.resolve('unknown' as const),
);

vi.mock('../hooks/useUserVerification', () => ({
  getVerificationStatus: () => mockGetVerificationStatus(),
}));

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() },
}));

vi.mock('../utils/videoUploadNetworkHint', () => ({
  getVideoUploadConnectionHint: () => mockGetVideoUploadConnectionHint(),
}));

vi.mock('@capacitor/network', () => ({
  Network: {
    getStatus: () =>
      Promise.resolve({ connected: true, connectionType: 'unknown' as const }),
    addListener: () => Promise.resolve({ remove: vi.fn() }),
  },
}));

vi.mock('capacitor-voice-recorder', () => ({
  VoiceRecorder: {
    requestAudioRecordingPermission: () => Promise.resolve({ value: true }),
    startRecording: () => Promise.resolve(),
    stopRecording: () => Promise.resolve({ value: null }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    {children}
  </MemoryRouter>
);

beforeEach(() => {
  mockGetVerificationStatus.mockReturnValue({
    hasClientPhone: true,
    verifiedClientPhone: true,
    canCreateRequest: true,
    hasProPhone: false,
    verifiedProPhone: false,
    canBid: false,
  });
  mockGetVideoUploadConnectionHint.mockImplementation(() =>
    Promise.resolve('unknown'),
  );
});

test('NewRequest renders step 1 header and mode selector when user can create requests', () => {
  render(<NewRequest />, { wrapper });
  expect(screen.getByText('Nueva Solicitud')).toBeInTheDocument();
  expect(screen.getByText('Elige cómo quieres contárnoslo')).toBeInTheDocument();
  expect(screen.getByText('Audio')).toBeInTheDocument();
  expect(screen.getByText('Video')).toBeInTheDocument();
  expect(screen.getByText('Escribir')).toBeInTheDocument();
});

test('NewRequest has Analyze button', () => {
  render(<NewRequest />, { wrapper });
  const btn = screen.getByText('ANALIZAR Y COTIZAR');
  expect(btn).toBeInTheDocument();
});

test('NewRequest still allows filling step 1 when user cannot create requests yet', () => {
  mockGetVerificationStatus.mockReturnValue({
    hasClientPhone: true,
    verifiedClientPhone: false,
    canCreateRequest: false,
    hasProPhone: false,
    verifiedProPhone: false,
    canBid: false,
  });

  render(<NewRequest />, { wrapper });

  expect(screen.getByText('Nueva Solicitud')).toBeInTheDocument();
  expect(screen.getByText('Elige cómo quieres contárnoslo')).toBeInTheDocument();
});

test('NewRequest step 1 is shown even when user has no phone', () => {
  mockGetVerificationStatus.mockReturnValue({
    hasClientPhone: false,
    verifiedClientPhone: false,
    canCreateRequest: false,
    hasProPhone: false,
    verifiedProPhone: false,
    canBid: false,
  });

  render(<NewRequest />, { wrapper });

  expect(screen.getByText('Nueva Solicitud')).toBeInTheDocument();
  expect(screen.getByText('Elige cómo quieres contárnoslo')).toBeInTheDocument();
});

test('NewRequest muestra aviso en pestaña vídeo cuando la red parece datos móviles', async () => {
  mockGetVideoUploadConnectionHint.mockImplementation(() =>
    Promise.resolve('cellular'),
  );

  const { container } = render(<NewRequest />, { wrapper });

  const segment = container.querySelector('ion-segment.mode-segment');
  expect(segment).toBeTruthy();
  fireEvent(
    segment as HTMLElement,
    new CustomEvent('ionChange', { detail: { value: 'VIDEO' } }),
  );

  await waitFor(() => {
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/datos móviles/i)).toBeInTheDocument();
  });
});
