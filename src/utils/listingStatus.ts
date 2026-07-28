/**
 * Mapa único estado → tokens CSS para borde izquierdo y StatusBadge.
 * Colores alineados con Mi Trabajo (listados) + detalle de servicio.
 */
export type ListingStatusKey =
  | 'pending'
  | 'assigned'
  | 'completed'
  | 'sent'
  | 'available'
  | 'cancelled'
  | 'pending_approval';

export interface ListingStatusTokens {
  borderClass: string;
  badgeClass: string;
}

export const LISTING_STATUS_TOKENS: Record<ListingStatusKey, ListingStatusTokens> = {
  pending: {
    borderClass: 'listing-card-status-pending',
    badgeClass: 'listing-status-badge-pending',
  },
  assigned: {
    borderClass: 'listing-card-status-assigned',
    badgeClass: 'listing-status-badge-assigned',
  },
  completed: {
    borderClass: 'listing-card-status-completed',
    badgeClass: 'listing-status-badge-completed',
  },
  /** Propuesta enviada (detalle pro / mercado). Azul. */
  sent: {
    borderClass: 'listing-card-status-sent',
    badgeClass: 'listing-status-badge-sent',
  },
  /**
   * Disponible (detalle pro, sin propuesta). Lavanda/índigo propio —
   * no reutiliza el naranja de `pending` (Pendiente en vista cliente).
   */
  available: {
    borderClass: 'listing-card-status-available',
    badgeClass: 'listing-status-badge-available',
  },
  cancelled: {
    borderClass: 'listing-card-status-completed',
    badgeClass: 'listing-status-badge-completed',
  },
  pending_approval: {
    borderClass: 'listing-card-status-pending',
    badgeClass: 'listing-status-badge-pending-approval',
  },
};

export function getListingStatusTokens(status: ListingStatusKey): ListingStatusTokens {
  return LISTING_STATUS_TOKENS[status];
}
