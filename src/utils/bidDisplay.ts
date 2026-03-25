import type { Bid, ServiceRequest, User } from '../types';

/** Misma regla que en ProRequestDetail: el autor de la puja es el User (id) comparado con sesión. */
export function bidIsMine(
  bid: Bid,
  myUserId: number | null,
  myProfileId: number | null,
): boolean {
  const p = bid.professional as User | string;
  const bidProId =
    typeof p === 'object' && p && 'id' in p
      ? Number(p.id)
      : typeof p === 'string'
        ? parseInt(p.split('/').pop() || '0', 10)
        : NaN;
  return bidProId === myUserId || bidProId === myProfileId;
}

export function getMyBidsFromRequest(
  bids: Bid[] | undefined,
  myUserId: number | null,
  myProfileId: number | null,
): Bid[] {
  if (!bids?.length) return [];
  return bids.filter((b) => bidIsMine(b, myUserId, myProfileId));
}

export function getMyActiveBid(myBids: Bid[]): Bid | undefined {
  return myBids.find((b) => b.status === 'PENDING');
}

/**
 * Tarjeta / estado en detalle pro: prioriza la propuesta activa; si no hay, la retirada más reciente.
 */
export function getMyBidForProUi(myBids: Bid[]): Bid | undefined {
  const active = getMyActiveBid(myBids);
  if (active) return active;
  const rejected = myBids
    .filter((b) => b.status === 'REJECTED')
    .sort((a, b) => b.id - a.id);
  return rejected[0];
}

function professionalKeyFromBid(bid: Bid): number {
  const profile = bid.professional?.professionalProfile;
  if (profile && typeof profile === 'object' && profile.id != null) {
    return Number(profile.id);
  }
  if (typeof bid.professional === 'object' && bid.professional?.id != null) {
    return Number(bid.professional.id);
  }
  return 0;
}

/**
 * Si el backend devuelve más de un PENDING por el mismo profesional, el cliente solo debe ver uno (el más reciente).
 */
export function dedupePendingBidsByProProfile(bids: Bid[]): Bid[] {
  const pending = bids.filter((b) => b.status === 'PENDING');
  const map = new Map<number, Bid>();
  for (const bid of pending) {
    const key = professionalKeyFromBid(bid);
    if (!key) continue;
    const existing = map.get(key);
    if (!existing || bid.id > existing.id) map.set(key, bid);
  }
  return Array.from(map.values());
}

/** En colecciones API el `request` suele ser IRI string o objeto con `@id` sin campo `id`. */
export function getRequestIdFromBid(bid: Bid): number | null {
  const req = bid.request as ServiceRequest | string | { '@id'?: string; id?: number };
  if (typeof req === 'string') {
    const n = parseInt(req.split('/').pop() || '0', 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  if (req && typeof req === 'object') {
    if (req.id != null) {
      const n = Number(req.id);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (req['@id']) {
      const n = parseInt(String(req['@id']).split('/').pop() || '0', 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
  }
  return null;
}

function bidRankForMyWork(b: Bid): number {
  if (b.status === 'PENDING') return 2;
  if (b.status === 'REJECTED') return 0;
  return 1;
}

/**
 * Una fila por solicitud: prioriza PENDING; si solo hay retiradas, muestra la más reciente.
 */
export function dedupeBidsByRequestForMyWork(bids: Bid[]): Bid[] {
  const byReq = new Map<number, Bid[]>();
  for (const bid of bids) {
    const rid = getRequestIdFromBid(bid) ?? -bid.id;
    if (!byReq.has(rid)) byReq.set(rid, []);
    byReq.get(rid)!.push(bid);
  }
  const out: Bid[] = [];
  for (const [, list] of byReq) {
    let best = list[0];
    for (let i = 1; i < list.length; i++) {
      const a = best;
      const b = list[i];
      if (bidRankForMyWork(b) > bidRankForMyWork(a)) best = b;
      else if (bidRankForMyWork(b) === bidRankForMyWork(a) && b.id > a.id) best = b;
    }
    out.push(best);
  }
  return out.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
