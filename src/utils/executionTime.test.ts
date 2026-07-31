import { describe, expect, it } from 'vitest';
import {
  EXECUTION_TIME_SPECIFIC_OPTION,
  formatSpecificExecutionTime,
  isExecutionTimeComplete,
  isSpecificExecutionTime,
  parseSpecificExecutionIso,
  executionTimeSelectValue,
} from './executionTime';

describe('executionTime', () => {
  it('formats and parses specific dates', () => {
    expect(formatSpecificExecutionTime('2026-08-15')).toBe(
      'Fecha concreta: 15/08/2026',
    );
    expect(parseSpecificExecutionIso('Fecha concreta: 15/08/2026')).toBe(
      '2026-08-15',
    );
    expect(parseSpecificExecutionIso('2026-08-15')).toBe('2026-08-15');
    expect(isSpecificExecutionTime('Fecha concreta: 15/08/2026')).toBe(true);
    expect(isSpecificExecutionTime('Esta semana')).toBe(false);
  });

  it('select value uses sentinel for specific dates', () => {
    expect(executionTimeSelectValue('Esta semana')).toBe('Esta semana');
    expect(executionTimeSelectValue('Fecha concreta: 01/09/2026')).toBe(
      EXECUTION_TIME_SPECIFIC_OPTION,
    );
  });

  it('complete only with preset or full specific date', () => {
    expect(isExecutionTimeComplete('Hoy mismo')).toBe(true);
    expect(isExecutionTimeComplete(EXECUTION_TIME_SPECIFIC_OPTION)).toBe(false);
    expect(isExecutionTimeComplete('Fecha concreta: 15/08/2026')).toBe(true);
    expect(isExecutionTimeComplete('')).toBe(false);
  });
});
