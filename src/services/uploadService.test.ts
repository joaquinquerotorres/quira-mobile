import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import {
  putBlobToSignedUrl,
  uploadAvatarWithTicket,
  uploadRequestMediaWithTicket,
} from './uploadService';

import api from '../api/axios';

vi.mock('../api/axios', () => ({
  default: { post: vi.fn() },
}));

type XhrInstance = {
  open: ReturnType<typeof vi.fn>;
  setRequestHeader: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  upload: { onprogress: ((ev: ProgressEvent) => void) | null };
  onload: (() => void) | null;
  onerror: (() => void) | null;
  ontimeout: (() => void) | null;
  status: number;
  timeout: number;
};

describe('uploadService', () => {
  let lastXhr: XhrInstance | null = null;
  let OriginalXHR: typeof XMLHttpRequest;

  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    lastXhr = null;
    OriginalXHR = globalThis.XMLHttpRequest;

    class MockXHR {
      open = vi.fn();
      setRequestHeader = vi.fn();
      upload: { onprogress: ((ev: ProgressEvent) => void) | null } = {
        onprogress: null,
      };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      ontimeout: (() => void) | null = null;
      status = 0;
      timeout = 0;

      send = vi.fn(() => {
        // Simulate successful PUT after send
        this.status = 200;
        queueMicrotask(() => this.onload?.());
      });

      constructor() {
        lastXhr = this as unknown as XhrInstance;
      }
    }

    // @ts-expect-error mock XHR in jsdom
    globalThis.XMLHttpRequest = MockXHR;
  });

  afterEach(() => {
    globalThis.XMLHttpRequest = OriginalXHR;
    vi.restoreAllMocks();
  });

  test('putBlobToSignedUrl PUTs with Content-Type and resolves on 2xx', async () => {
    const blob = new Blob(['x'], { type: 'text/plain' });
    const progress = vi.fn();
    await putBlobToSignedUrl('https://signed/put', blob, 'text/plain', progress);

    expect(lastXhr?.open).toHaveBeenCalledWith('PUT', 'https://signed/put');
    expect(lastXhr?.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(lastXhr?.send).toHaveBeenCalledWith(blob);
    expect(progress).toHaveBeenCalledWith(100);
  });

  test('uploadAvatarWithTicket requests ticket, PUTs file, returns publicUrl', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { signedUrl: 'https://signed/avatar', publicUrl: 'https://public/avatar.png' },
    } as any);

    const file = new File([new Uint8Array([1, 2, 3])], 'avatar.png', { type: 'image/png' });
    const url = await uploadAvatarWithTicket(file);

    expect(api.post).toHaveBeenCalledWith('/upload-ticket/avatar', { contentType: 'image/png' });
    expect(lastXhr?.open).toHaveBeenCalledWith('PUT', 'https://signed/avatar');
    expect(lastXhr?.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(lastXhr?.send).toHaveBeenCalledWith(file);
    expect(url).toBe('https://public/avatar.png');
  });

  test('uploadRequestMediaWithTicket requests ticket, PUTs blob with inferred content-type, returns publicUrl', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { signedUrl: 'https://signed/media', publicUrl: 'https://public/media' },
    } as any);

    // "hello" base64 is aGVsbG8=
    const dataUrl = 'data:text/plain;base64,aGVsbG8=';
    const url = await uploadRequestMediaWithTicket(dataUrl, 'audio');

    expect(api.post).toHaveBeenCalledWith('/upload-ticket/request-media', {
      type: 'audio',
      contentType: 'text/plain',
    });
    expect(lastXhr?.open).toHaveBeenCalledWith('PUT', 'https://signed/media');
    expect(lastXhr?.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'text/plain');
    expect(lastXhr?.send.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(url).toBe('https://public/media');
  });
});
