import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  adminRangeToFromTo,
  fetchAdminStatsOverview,
  kpiDeltaPercent,
} from './adminApi';

vi.mock('./axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from './axios';

describe('adminApi', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('builds inclusive local date ranges', () => {
    const today = new Date(2026, 6, 31); // 31 jul 2026
    expect(adminRangeToFromTo('7d', today)).toEqual({
      from: '2026-07-25',
      to: '2026-07-31',
    });
    expect(adminRangeToFromTo('30d', today).from).toBe('2026-07-02');
    expect(adminRangeToFromTo('90d', today).from).toBe('2026-05-03');
  });

  it('computes kpi delta percent', () => {
    expect(kpiDeltaPercent({ value: 120, previous: 100 })).toBe(20);
    expect(kpiDeltaPercent({ value: 0, previous: 0 })).toBe(0);
    expect(kpiDeltaPercent({ value: 5, previous: 0 })).toBeNull();
  });

  it('fetches overview with from/to params', async () => {
    const payload = { kpis: {} };
    vi.mocked(api.get).mockResolvedValue({ data: payload });
    const today = new Date(2026, 6, 31);
    vi.useFakeTimers();
    vi.setSystemTime(today);
    await fetchAdminStatsOverview('7d');
    expect(api.get).toHaveBeenCalledWith('/admin/stats/overview', {
      params: { from: '2026-07-25', to: '2026-07-31' },
      headers: { Accept: 'application/json' },
    });
    vi.useRealTimers();
  });
});
