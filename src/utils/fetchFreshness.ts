/** TTL para no repetir listados al volver a un tab (ms). Pull-to-refresh e invalidación ignoran esto. */
export const LIST_FETCH_STALE_MS = 45_000;

/** Tamaño de página por defecto en colecciones Hydra. */
export const LIST_PAGE_SIZE = 50;

/** Debounce de búsqueda en listados que filtran en vivo. */
export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Evita refetch duplicado para la misma clave dentro de `staleMs`.
 * `force: true` (pull-to-refresh, eventos de invalidación) siempre deja pasar.
 */
export function createFetchFreshness(staleMs: number = LIST_FETCH_STALE_MS) {
  let lastAt = 0;
  let lastKey = '';

  return {
    /** true = no hace falta volver a pedir a la red. */
    shouldSkip(key: string, opts?: { force?: boolean }): boolean {
      if (opts?.force) return false;
      if (!lastKey || lastKey !== key) return false;
      return Date.now() - lastAt < staleMs;
    },
    mark(key: string): void {
      lastKey = key;
      lastAt = Date.now();
    },
    /** Tras mutaciones / REQUESTS_INVALIDATED_EVENT. */
    invalidate(): void {
      lastAt = 0;
      lastKey = '';
    },
  };
}
