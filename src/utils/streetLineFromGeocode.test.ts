import { describe, expect, it } from 'vitest';
import { streetLineFromGeocode } from './streetLineFromGeocode';

describe('streetLineFromGeocode', () => {
  it('combina route y street_number', () => {
    expect(
      streetLineFromGeocode('Calle Mayor, 6, Córdoba', {
        address_components: [
          { long_name: 'Calle Mayor', types: ['route'] },
          { long_name: '6', types: ['street_number'] },
        ],
      })
    ).toBe('Calle Mayor, 6');
  });

  it('sin route usa street_number solo', () => {
    expect(
      streetLineFromGeocode('6', {
        address_components: [{ long_name: '6', types: ['street_number'] }],
      })
    ).toBe('6');
  });

  it('sin componentes, incluye segundo segmento si parece número de vía', () => {
    expect(streetLineFromGeocode('Calle X, 12, Córdoba', {})).toBe('Calle X, 12');
  });

  it('no trata un CP de 5 cifras como número de vía', () => {
    expect(streetLineFromGeocode('Calle X, 14001, Córdoba', {})).toBe('Calle X');
  });
});
