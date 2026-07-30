import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import api from '../api/axios';
import NewRequest from './NewRequest';

/** Sustituye el stub global de `setupTests.ts` para poder simular dirección en Córdoba. */
vi.mock('react-google-places-autocomplete', async () => {
  const ReactMod = await import('react');
  const React = ReactMod.default;
  return {
    __esModule: true,
    default: ({
      selectProps,
    }: {
      selectProps: { onChange: (v: unknown) => void };
    }) =>
      React.createElement(
        'button',
        {
          type: 'button',
          'data-testid': 'mock-place-select',
          onClick: () =>
            selectProps.onChange({
              label: 'Posadas, Córdoba (España)',
              value: 'mock-place',
            }),
        },
        'Mock place',
      ),
    geocodeByAddress: vi.fn(() =>
      Promise.resolve([
        {
          address_components: [
            { long_name: 'Posadas', types: ['locality'] },
            { long_name: 'Córdoba', types: ['administrative_area_level_2'] },
            { long_name: 'España', types: ['country'] },
          ],
        },
      ]),
    ),
    getLatLng: vi.fn(() => Promise.resolve({ lat: 37.4, lng: -4.6 })),
  };
});

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

const mockRequestPredictByUrls = vi.fn();
const mockUploadPrimaryMediaForPredict = vi.fn(() =>
  Promise.resolve({
    photoUrl: null,
    audioUrl: null,
    videoUrl: null,
  }),
);

vi.mock('../services/predictService', () => ({
  requestPredictByUrls: (...args: unknown[]) => mockRequestPredictByUrls(...args),
  uploadPrimaryMediaForPredict: (...args: unknown[]) =>
    mockUploadPrimaryMediaForPredict(...args),
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
  sessionStorage.clear();
  vi.mocked(api.post).mockClear();
  mockRequestPredictByUrls.mockReset();
  mockUploadPrimaryMediaForPredict.mockClear();
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

async function fillStep1TextAndAnalyze(description: string) {
  const { container } = render(<NewRequest />, { wrapper });

  const segment = container.querySelector('ion-segment.mode-segment');
  expect(segment).toBeTruthy();
  fireEvent(
    segment as HTMLElement,
    new CustomEvent('ionChange', { detail: { value: 'TEXT' } }),
  );

  await waitFor(() => {
    expect(container.querySelector('ion-textarea')).toBeTruthy();
  });

  const ionTextarea = container.querySelector('ion-textarea');
  fireEvent(
    ionTextarea as HTMLElement,
    new CustomEvent('ionInput', { detail: { value: description } }),
  );

  fireEvent.click(screen.getByTestId('mock-place-select'));

  // Flush del geocode async (mock) antes de analizar.
  await waitFor(() => {
    expect(screen.getByText('ANALIZAR Y COTIZAR')).toBeInTheDocument();
  });
  await Promise.resolve();

  fireEvent.click(screen.getByText('ANALIZAR Y COTIZAR'));
  return container;
}

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

test('NewRequest no llama a POST /predict si el teléfono no está verificado (con texto y dirección)', async () => {
  mockGetVerificationStatus.mockReturnValue({
    hasClientPhone: true,
    verifiedClientPhone: false,
    canCreateRequest: false,
    hasProPhone: false,
    verifiedProPhone: false,
    canBid: false,
  });

  const { container } = render(<NewRequest />, { wrapper });

  const segment = container.querySelector('ion-segment.mode-segment');
  expect(segment).toBeTruthy();
  fireEvent(
    segment as HTMLElement,
    new CustomEvent('ionChange', { detail: { value: 'TEXT' } }),
  );

  const ionTextarea = container.querySelector('ion-textarea');
  expect(ionTextarea).toBeTruthy();
  fireEvent(
    ionTextarea as HTMLElement,
    new CustomEvent('ionInput', { detail: { value: 'Grieta en el techo' } }),
  );

  fireEvent.click(screen.getByTestId('mock-place-select'));

  await waitFor(() => {
    expect(screen.getByText('ANALIZAR Y COTIZAR')).toBeInTheDocument();
  });

  fireEvent.click(screen.getByText('ANALIZAR Y COTIZAR'));

  await waitFor(() => {
    expect(api.post).not.toHaveBeenCalled();
  });
});

test('NewRequest muestra aviso de teléfono en paso 1 cuando no puede publicar', () => {
  mockGetVerificationStatus.mockReturnValue({
    hasClientPhone: true,
    verifiedClientPhone: false,
    canCreateRequest: false,
    hasProPhone: false,
    verifiedProPhone: false,
    canBid: false,
  });

  render(<NewRequest />, { wrapper });

  expect(
    screen.getByRole('status', {
      name: /verificación de teléfono requerida para publicar/i,
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/verificar tu número de teléfono en Perfil/i),
  ).toBeInTheDocument();
  expect(screen.getByText('Ir a Perfil')).toBeInTheDocument();
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

test('predict sin in_scope avanza a step 2 (compat API antigua → in_scope true)', async () => {
  mockRequestPredictByUrls.mockResolvedValue({
    title: 'Arreglar grifo',
    description: 'Fuga en cocina',
    category: 'PLUMBING',
    safe: true,
    estimated_price_min: 5000,
    estimated_price_max: 9000,
  });

  await fillStep1TextAndAnalyze('Se me ha roto el grifo');

  await waitFor(() => {
    expect(mockRequestPredictByUrls).toHaveBeenCalled();
    expect(screen.getByText('PUBLICAR SOLICITUD')).toBeInTheDocument();
  });
});

test('predict con in_scope=false muestra mensaje y no deja publicar', async () => {
  mockRequestPredictByUrls.mockResolvedValue({
    title: 'Dolor de rodilla',
    description: 'Consulta médica',
    category: 'DIY',
    safe: true,
    in_scope: false,
    out_of_scope_reason: 'Parece una consulta médica.',
    estimated_price_min: 0,
    estimated_price_max: 0,
  });

  await fillStep1TextAndAnalyze('Me duele la rodilla');

  await waitFor(() => {
    expect(mockRequestPredictByUrls).toHaveBeenCalled();
    expect(screen.getByText(/Parece una consulta médica/i)).toBeInTheDocument();
    expect(screen.getByText(/Fuera de cobertura Quira/i)).toBeInTheDocument();
  });

  // No debe avanzar al paso 2 (publicar).
  expect(screen.queryByText('PUBLICAR SOLICITUD')).not.toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalledWith(
    '/requests',
    expect.anything(),
  );
});

test('predict con safe=false muestra aviso de moderación y envía aiDiagnosis.safe=false al publicar', async () => {
  mockRequestPredictByUrls.mockResolvedValue({
    title: 'Contacto en descripción',
    description: 'Arreglo con teléfono',
    category: 'DIY',
    safe: false,
    safety_reason: 'Teléfono detectado en el texto',
    in_scope: true,
    estimated_price_min: 0,
    estimated_price_max: 0,
  });
  vi.mocked(api.post).mockResolvedValue({ data: { id: 'req-1' } });

  await fillStep1TextAndAnalyze('Llama al 600111222 para el grifo');

  await waitFor(() => {
    expect(screen.getByText('PUBLICAR SOLICITUD')).toBeInTheDocument();
  });

  expect(
    screen.getByRole('status', { name: /aviso de moderación/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Teléfono detectado/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText('PUBLICAR SOLICITUD'));

  await waitFor(() => {
    expect(api.post).toHaveBeenCalledWith(
      '/requests',
      expect.objectContaining({
        aiDiagnosis: expect.objectContaining({
          safe: false,
          safety_reason: 'Teléfono detectado en el texto',
          in_scope: true,
        }),
      }),
    );
  });
});
