export type GeocodeAddressComponent = {
  long_name: string;
  types: string[];
};

export type GeocodeResultLike = {
  address_components?: GeocodeAddressComponent[];
};

function getComponent(
  comps: GeocodeAddressComponent[] | undefined,
  type: string
): string | undefined {
  return comps?.find((c) => c.types?.includes(type))?.long_name;
}

/**
 * Calle + número a partir del resultado de geocodificación de Google.
 * Evita usar solo el primer segmento de la etiqueta (p. ej. "Calle X, 6, Córdoba")
 * porque ahí se pierde el número.
 */
export function streetLineFromGeocode(
  placeLabel: string,
  result: GeocodeResultLike
): string {
  const comps = result.address_components;
  const route = getComponent(comps, 'route');
  const streetNumber = getComponent(comps, 'street_number');
  if (route) {
    return streetNumber ? `${route}, ${streetNumber}` : route;
  }
  if (streetNumber) {
    return streetNumber;
  }
  const segs = placeLabel.split(',').map((s) => s.trim()).filter(Boolean);
  let short = segs[0] ?? '';
  const next = segs[1];
  if (next && /^\d/.test(next) && !/^\d{5}$/.test(next)) {
    short = `${short}, ${next}`;
  }
  return short;
}
