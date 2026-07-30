import { describe, expect, it } from 'vitest';
import {
  CORDOBA_AREA_TOAST,
  CORDOBA_APPROX_PLACEHOLDER,
  CORDOBA_EXACT_PLACEHOLDER,
  CORDOBA_PROVINCE_BOUNDS,
  cordobaAutocompletionRequest,
  isCordobaAreaFromComponents,
} from './cordobaPlaces';

describe('cordobaPlaces', () => {
  it('exports a loose Córdoba province bbox', () => {
    expect(CORDOBA_PROVINCE_BOUNDS.north).toBeGreaterThan(
      CORDOBA_PROVINCE_BOUNDS.south,
    );
    expect(CORDOBA_PROVINCE_BOUNDS.east).toBeGreaterThan(
      CORDOBA_PROVINCE_BOUNDS.west,
    );
    expect(CORDOBA_PROVINCE_BOUNDS).toEqual({
      north: 38.55,
      south: 37.15,
      east: -4.05,
      west: -5.55,
    });
  });

  it('cordobaAutocompletionRequest sets country es, bounds and strictBounds', () => {
    const req = cordobaAutocompletionRequest();
    expect(req.componentRestrictions).toEqual({ country: ['es'] });
    expect(req.strictBounds).toBe(true);
    expect(req.bounds).toEqual(CORDOBA_PROVINCE_BOUNDS);
    // Copia defensiva: mutar el resultado no altera la constante exportada.
    req.bounds.north = 99;
    expect(CORDOBA_PROVINCE_BOUNDS.north).toBe(38.55);
  });

  it('isCordobaAreaFromComponents accepts Córdoba + España', () => {
    expect(
      isCordobaAreaFromComponents([
        { long_name: 'Posadas', types: ['locality'] },
        { long_name: 'Córdoba', types: ['administrative_area_level_2'] },
        { long_name: 'España', types: ['country'] },
      ]),
    ).toBe(true);
  });

  it('isCordobaAreaFromComponents accepts Cordoba + Spain aliases', () => {
    expect(
      isCordobaAreaFromComponents([
        { long_name: 'Cordoba', types: ['administrative_area_level_1'] },
        { long_name: 'Spain', types: ['country'] },
      ]),
    ).toBe(true);
  });

  it('isCordobaAreaFromComponents rejects other provinces / countries', () => {
    expect(
      isCordobaAreaFromComponents([
        { long_name: 'Sevilla', types: ['administrative_area_level_2'] },
        { long_name: 'España', types: ['country'] },
      ]),
    ).toBe(false);
    expect(
      isCordobaAreaFromComponents([
        { long_name: 'Córdoba', types: ['administrative_area_level_2'] },
        { long_name: 'Argentina', types: ['country'] },
      ]),
    ).toBe(false);
    expect(isCordobaAreaFromComponents([])).toBe(false);
    expect(isCordobaAreaFromComponents(null)).toBe(false);
    expect(isCordobaAreaFromComponents(undefined)).toBe(false);
  });

  it('exports shared toast and placeholders', () => {
    expect(CORDOBA_AREA_TOAST).toMatch(/Córdoba \(Andalucía\)/);
    expect(CORDOBA_APPROX_PLACEHOLDER).toMatch(/Zona en Córdoba/);
    expect(CORDOBA_EXACT_PLACEHOLDER).toMatch(/Dirección en Córdoba/);
  });
});
