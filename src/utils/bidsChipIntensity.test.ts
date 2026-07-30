import { describe, expect, it } from 'vitest';
import { getBidsChipIntensity } from './bidsChipIntensity';

describe('getBidsChipIntensity', () => {
  it('maps counts to stepped heat levels', () => {
    expect(getBidsChipIntensity(0)).toBe('none');
    expect(getBidsChipIntensity(1)).toBe('soft');
    expect(getBidsChipIntensity(2)).toBe('soft');
    expect(getBidsChipIntensity(3)).toBe('mid');
    expect(getBidsChipIntensity(4)).toBe('mid');
    expect(getBidsChipIntensity(5)).toBe('hot');
    expect(getBidsChipIntensity(12)).toBe('hot');
  });

  it('treats invalid / negative as none', () => {
    expect(getBidsChipIntensity(-1)).toBe('none');
    expect(getBidsChipIntensity(Number.NaN)).toBe('none');
  });
});
