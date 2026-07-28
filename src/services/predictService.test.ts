import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../api/axios';
import { requestPredictByUrls } from './predictService';

vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('requestPredictByUrls', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
    vi.mocked(api.get).mockReset();
  });

  it('devuelve result cuando el POST responde completed (sync)', async () => {
    vi.mocked(api.post).mockResolvedValue({
      status: 200,
      data: {
        taskId: 'abc',
        status: 'completed',
        result: { title: 'Fuga', category: 'PLUMBING' },
      },
    });

    const result = await requestPredictByUrls({
      description: 'Gotea',
      videoUrl: 'https://example.supabase.co/x.mp4',
    });

    expect(result.title).toBe('Fuga');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('hace polling cuando el POST responde 202', async () => {
    vi.mocked(api.post).mockResolvedValue({
      status: 202,
      data: { taskId: 'task-1', status: 'processing' },
    });
    vi.mocked(api.get)
      .mockResolvedValueOnce({
        data: { taskId: 'task-1', status: 'processing' },
      })
      .mockResolvedValueOnce({
        data: {
          taskId: 'task-1',
          status: 'completed',
          result: { title: 'Ok', category: 'DIY' },
        },
      });

    const result = await requestPredictByUrls({ description: 'Test' });
    expect(result.title).toBe('Ok');
    expect(api.get).toHaveBeenCalledWith('/predict/tasks/task-1', expect.any(Object));
  });
});
