import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { uploadAvatarWithTicket, uploadRequestMediaWithTicket } from './uploadService';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() },
}));

describe('uploadService', () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    fetchSpy.mockReset();
    // @ts-expect-error override global fetch in tests
    globalThis.fetch = fetchSpy;
    fetchSpy.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('uploadAvatarWithTicket requests ticket, PUTs file, returns publicUrl', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { signedUrl: 'https://signed/avatar', publicUrl: 'https://public/avatar.png' },
    } as any);

    const file = new File([new Uint8Array([1, 2, 3])], 'avatar.png', { type: 'image/png' });
    const url = await uploadAvatarWithTicket(file);

    expect(api.post).toHaveBeenCalledWith('/upload-ticket/avatar', { contentType: 'image/png' });
    expect(fetchSpy).toHaveBeenCalledWith('https://signed/avatar', {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': 'image/png' },
    });
    expect(url).toBe('https://public/avatar.png');
  });

  test('uploadRequestMediaWithTicket requests ticket, PUTs blob with inferred content-type, returns publicUrl', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { signedUrl: 'https://signed/media', publicUrl: 'https://public/media' },
    } as any);

    // "hello" base64 is aGVsbG8=
    const dataUrl = 'data:text/plain;base64,aGVsbG8=';
    const url = await uploadRequestMediaWithTicket(dataUrl, 'audio');

    expect(api.post).toHaveBeenCalledWith('/upload-ticket/request-media', { type: 'audio' });
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://signed/media',
      expect.objectContaining({
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    const putArgs = fetchSpy.mock.calls[0][1] as any;
    expect(putArgs.body).toBeInstanceOf(Blob);
    expect(url).toBe('https://public/media');
  });
});

