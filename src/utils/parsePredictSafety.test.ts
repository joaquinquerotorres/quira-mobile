import { describe, expect, it } from 'vitest';
import {
  outOfScopeUserMessage,
  parsePredictOptionalBoolean,
  parsePredictSafetyFields,
  unsafeUserMessage,
} from './parsePredictSafety';

describe('parsePredictOptionalBoolean', () => {
  it('defaults when absent', () => {
    expect(parsePredictOptionalBoolean(undefined, true)).toBe(true);
    expect(parsePredictOptionalBoolean(null, true)).toBe(true);
    expect(parsePredictOptionalBoolean('', false)).toBe(false);
  });

  it('accepts boolean and string', () => {
    expect(parsePredictOptionalBoolean(true, false)).toBe(true);
    expect(parsePredictOptionalBoolean(false, true)).toBe(false);
    expect(parsePredictOptionalBoolean('true', false)).toBe(true);
    expect(parsePredictOptionalBoolean('FALSE', true)).toBe(false);
  });
});

describe('parsePredictSafetyFields', () => {
  it('treats missing in_scope as true (API antigua)', () => {
    const parsed = parsePredictSafetyFields({
      safe: true,
      title: 'Arreglar grifo',
    });
    expect(parsed.inScope).toBe(true);
    expect(parsed.outOfScopeReason).toBeNull();
    expect(parsed.safe).toBe(true);
  });

  it('reads in_scope=false and out_of_scope_reason', () => {
    const parsed = parsePredictSafetyFields({
      safe: true,
      in_scope: false,
      out_of_scope_reason: 'Parece una consulta médica.',
    });
    expect(parsed.inScope).toBe(false);
    expect(parsed.outOfScopeReason).toBe('Parece una consulta médica.');
  });

  it('accepts camelCase aliases and legacy is_safe / reason', () => {
    const parsed = parsePredictSafetyFields({
      is_safe: false,
      reason: 'Teléfono en el audio',
      inScope: false,
      outOfScopeReason: 'Trámite legal',
    });
    expect(parsed.safe).toBe(false);
    expect(parsed.safetyReason).toBe('Teléfono en el audio');
    expect(parsed.inScope).toBe(false);
    expect(parsed.outOfScopeReason).toBe('Trámite legal');
  });

  it('treats missing safe as false (conservative legacy)', () => {
    expect(parsePredictSafetyFields({}).safe).toBe(false);
  });
});

describe('user messages', () => {
  it('outOfScopeUserMessage falls back', () => {
    expect(outOfScopeUserMessage(null)).toMatch(/Quira cubra/i);
    expect(outOfScopeUserMessage('No encaja')).toBe('No encaja');
  });

  it('unsafeUserMessage falls back', () => {
    expect(unsafeUserMessage(null)).toMatch(/revisión/i);
    expect(unsafeUserMessage('Contacto detectado')).toMatch(/Contacto detectado/);
  });
});
