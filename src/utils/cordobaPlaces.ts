/**
 * Restricción geográfica de Quira al lanzamiento: provincia de Córdoba (Andalucía).
 * Places `componentRestrictions` solo admite país; usamos bounds + strictBounds.
 */

export type CordobaProvinceBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

/** Bbox holgado de la provincia de Córdoba (no es el polígono exacto). */
export const CORDOBA_PROVINCE_BOUNDS: CordobaProvinceBounds = {
  north: 38.55,
  south: 37.15,
  east: -4.05,
  west: -5.55,
};

export const CORDOBA_AREA_TOAST =
  'Por ahora solo aceptamos direcciones en Córdoba (Andalucía).';

export const CORDOBA_APPROX_PLACEHOLDER = 'Zona en Córdoba (provincia)...';
export const CORDOBA_EXACT_PLACEHOLDER = 'Dirección en Córdoba (provincia)...';

export type CordobaAutocompletionRequest = {
  componentRestrictions: { country: string[] };
  bounds: CordobaProvinceBounds;
  strictBounds: true;
};

/** Opciones para `GooglePlacesAutocomplete` `autocompletionRequest`. */
export function cordobaAutocompletionRequest(): CordobaAutocompletionRequest {
  return {
    componentRestrictions: { country: ['es'] },
    bounds: { ...CORDOBA_PROVINCE_BOUNDS },
    strictBounds: true,
  };
}

type AddressComponentLike = {
  long_name?: string;
  types?: string[];
};

/**
 * Valida provincia Córdoba + país España a partir de `address_components` de Geocoding.
 * Red de seguridad tras Places/GPS (el bbox no es la provincia exacta).
 */
export function isCordobaAreaFromComponents(
  components: AddressComponentLike[] | null | undefined,
): boolean {
  if (!components?.length) return false;

  const get = (type: string) =>
    components.find((c) => c.types?.includes(type))?.long_name;

  const province =
    get('administrative_area_level_2') || get('administrative_area_level_1');
  const country = get('country');
  const isSpain = country === 'España' || country === 'Spain';
  const isCordoba = province === 'Córdoba' || province === 'Cordoba';
  return Boolean(isSpain && isCordoba);
}
