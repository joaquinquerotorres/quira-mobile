import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IonApp } from '@ionic/react';
import { MemoryRouter } from 'react-router-dom';
import NewRequest from './NewRequest';

const mockGetVerificationStatus = vi.fn();

vi.mock('../hooks/useUserVerification', () => ({
  getVerificationStatus: () => mockGetVerificationStatus(),
}));

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() },
}));

vi.mock('capacitor-voice-recorder', () => ({
  VoiceRecorder: {
    requestAudioRecordingPermission: () => Promise.resolve({ value: true }),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <IonApp>{children}</IonApp>
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

test('NewRequest shows verify-phone blocking screen when user cannot create requests but has phone', () => {
  mockGetVerificationStatus.mockReturnValue({
    hasClientPhone: true,
    verifiedClientPhone: false,
    canCreateRequest: false,
    hasProPhone: false,
    verifiedProPhone: false,
    canBid: false,
  });

  render(<NewRequest />, { wrapper });

  expect(screen.getByText('Verifica tu teléfono')).toBeInTheDocument();
  expect(screen.getByText('Para crear una solicitud necesitas verificar tu número de teléfono en tu perfil de cliente.')).toBeInTheDocument();
  expect(screen.getByText('Ir a Perfil a verificar')).toBeInTheDocument();
  expect(screen.queryByText('Elige cómo quieres contárnoslo')).not.toBeInTheDocument();
});

test('NewRequest shows add-and-verify message when user has no phone', () => {
  mockGetVerificationStatus.mockReturnValue({
    hasClientPhone: false,
    verifiedClientPhone: false,
    canCreateRequest: false,
    hasProPhone: false,
    verifiedProPhone: false,
    canBid: false,
  });

  render(<NewRequest />, { wrapper });

  expect(screen.getByText('Verifica tu teléfono')).toBeInTheDocument();
  expect(
    screen.getByText(
      'Para crear una solicitud necesitas añadir y verificar tu número de teléfono en tu perfil de cliente.',
    ),
  ).toBeInTheDocument();
});
