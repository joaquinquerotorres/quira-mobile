import type { ListingStatusKey } from '../utils/listingStatus';

/** Estado visual del detalle cliente a partir del status de la request. */
export function getClientDetailStatus(
  status: string,
): { key: ListingStatusKey; label: string } {
  switch (status) {
    case 'COMPLETED':
      return { key: 'completed', label: 'Finalizado' };
    case 'ACCEPTED':
      return { key: 'assigned', label: 'Asignado' };
    case 'PENDING_APPROVAL':
      return { key: 'pending_approval', label: 'En revisión' };
    case 'CANCELLED':
      return { key: 'cancelled', label: 'Cancelado' };
    default:
      return { key: 'pending', label: 'Pendiente' };
  }
}

/** Estado visual del detalle profesional. */
export function getProDetailStatus(opts: {
  isCompleted: boolean;
  isWinner: boolean;
  hasBid: boolean;
}): { key: ListingStatusKey; label: string } {
  if (opts.isCompleted) return { key: 'completed', label: 'Finalizado' };
  if (opts.isWinner) return { key: 'assigned', label: 'Trabajo Ganado' };
  if (opts.hasBid) return { key: 'sent', label: 'Propuesta Enviada' };
  return { key: 'available', label: 'Disponible' };
}
