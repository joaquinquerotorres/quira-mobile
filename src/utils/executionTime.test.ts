import { describe, expect, it } from 'vitest';
import {
  EXECUTION_TIME_SPECIFIC_OPTION,
  formatSpecificExecutionTime,
  isExecutionTimeComplete,
  isSpecificExecutionTime,
  parseScheduleIntentToIso,
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

  it('parses schedule_intent into ISO when concrete', () => {
    const today = new Date(2026, 6, 28); // 28 jul 2026
    expect(parseScheduleIntentToIso('2026-08-15', today)).toBe('2026-08-15');
    expect(parseScheduleIntentToIso('15/08/2026', today)).toBe('2026-08-15');
    expect(parseScheduleIntentToIso('el 15 de agosto de 2026', today)).toBe(
      '2026-08-15',
    );
    expect(parseScheduleIntentToIso('15 de agosto', today)).toBe('2026-08-15');
    expect(parseScheduleIntentToIso('3 de enero', today)).toBe('2027-01-03');
    expect(parseScheduleIntentToIso('próxima semana', today)).toBeNull();
    expect(parseScheduleIntentToIso('', today)).toBeNull();
  });
});
