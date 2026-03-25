import { describe, expect, test, vi } from 'vitest';
import { shuffleArray } from './shuffle';

describe('shuffleArray', () => {
  test('returns a new array (does not mutate input)', () => {
    const input = [1, 2, 3, 4];
    const out = shuffleArray(input);
    expect(out).not.toBe(input);
    expect(input).toEqual([1, 2, 3, 4]);
    expect(out.slice().sort()).toEqual([1, 2, 3, 4]);
  });

  test('is deterministic with mocked Math.random', () => {
    const spy = vi.spyOn(Math, 'random');
    spy.mockReturnValue(0); // always choose j = 0
    expect(shuffleArray([1, 2, 3, 4])).toEqual([2, 3, 4, 1]);
    spy.mockRestore();
  });
});

