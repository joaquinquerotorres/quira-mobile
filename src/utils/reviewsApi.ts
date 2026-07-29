import api from '../api/axios';
import type { HydraCollection } from '../types';

/** Review shape used by the profile reviews UI (API-normalized). */
export interface ProfileReviewItem {
  id: number | string;
  /** Display name of who wrote the review. */
  authorName: string;
  /** Display name of who received the review (useful on “given”). */
  targetName: string;
  rating: number;
  comment: string;
  dateLabel: string;
  requestTitle?: string;
  /** When present, used to facet received reviews by active mode. */
  authorIsProfessional?: boolean;
}

function collectionMembers<T>(data: HydraCollection<T> | T[] | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const hydra = data['hydra:member'];
  if (Array.isArray(hydra)) return hydra;
  const member = data.member;
  if (Array.isArray(member)) return member;
  return [];
}

function displayNameFromUser(user: unknown): string {
  if (!user || typeof user !== 'object') return '';
  const u = user as Record<string, unknown>;
  const client = u.clientProfile as { fullName?: string } | undefined;
  const pro = u.professionalProfile as { fullName?: string } | undefined;
  return (
    (typeof client?.fullName === 'string' && client.fullName) ||
    (typeof pro?.fullName === 'string' && pro.fullName) ||
    (typeof u.email === 'string' ? u.email : '') ||
    ''
  );
}

function formatDateLabel(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) {
    // API already returns relative labels via SerializedName("date")
    if (!/^\d{4}-\d{2}-\d{2}/.test(raw) && !raw.includes('T')) {
      return raw;
    }
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    return raw;
  }
  return '';
}

export function normalizeProfileReview(raw: Record<string, unknown>): ProfileReviewItem {
  const authorField = raw.author;
  const authorName =
    typeof authorField === 'string'
      ? authorField
      : displayNameFromUser(authorField) ||
        (typeof raw.authorName === 'string' ? raw.authorName : '') ||
        'Anónimo';

  const targetName =
    (typeof raw.targetName === 'string' && raw.targetName) ||
    displayNameFromUser(raw.target) ||
    'Usuario';

  const score =
    typeof raw.rating === 'number'
      ? raw.rating
      : typeof raw.score === 'number'
        ? raw.score
        : 0;

  const comment =
    (typeof raw.text === 'string' && raw.text) ||
    (typeof raw.comment === 'string' && raw.comment) ||
    '';

  const request = raw.request as { title?: string } | string | undefined;
  const requestTitle =
    (typeof raw.requestTitle === 'string' && raw.requestTitle) ||
    (request && typeof request === 'object' && typeof request.title === 'string'
      ? request.title
      : undefined);

  const authorIsProfessional =
    typeof raw.authorIsProfessional === 'boolean'
      ? raw.authorIsProfessional
      : undefined;

  return {
    id: (raw.id as number | string) ?? String(Math.random()),
    authorName,
    targetName,
    rating: score,
    comment,
    dateLabel: formatDateLabel(raw.date ?? raw.createdAt),
    requestTitle,
    authorIsProfessional,
  };
}

/**
 * Facet received reviews by active shell:
 * - client mode → reviews written by professionals (about me as client)
 * - pro mode → reviews written by clients (about me as pro)
 * If the API does not send authorIsProfessional, keep all items.
 */
export function filterReceivedByMode(
  items: ProfileReviewItem[],
  activeMode: 'client' | 'pro'
): ProfileReviewItem[] {
  const hasFacet = items.some((r) => typeof r.authorIsProfessional === 'boolean');
  if (!hasFacet) return items;
  if (activeMode === 'client') {
    return items.filter((r) => r.authorIsProfessional === true);
  }
  return items.filter((r) => r.authorIsProfessional === false);
}

export function averageRating(items: ProfileReviewItem[]): number | null {
  if (items.length === 0) return null;
  const sum = items.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return Math.round((sum / items.length) * 10) / 10;
}

export async function fetchReviewsByTarget(
  userId: number | string
): Promise<ProfileReviewItem[]> {
  const res = await api.get<HydraCollection<Record<string, unknown>>>('/reviews', {
    params: { target: `/api/users/${userId}` },
  });
  return collectionMembers(res.data).map((r) =>
    normalizeProfileReview(r as Record<string, unknown>)
  );
}

export async function fetchReviewsByAuthor(
  userId: number | string
): Promise<ProfileReviewItem[]> {
  const res = await api.get<HydraCollection<Record<string, unknown>>>('/reviews', {
    params: { author: `/api/users/${userId}` },
  });
  return collectionMembers(res.data).map((r) =>
    normalizeProfileReview(r as Record<string, unknown>)
  );
}

/** Fallback when GET /reviews?target=… is not available yet (pro only). */
export async function fetchProProfileEmbeddedReviews(
  professionalProfileId: number | string
): Promise<ProfileReviewItem[]> {
  const res = await api.get(`/professional_profiles/${professionalProfileId}`);
  const raw = Array.isArray(res.data?.reviews) ? res.data.reviews : [];
  return raw.map((r: Record<string, unknown>) =>
    normalizeProfileReview({
      ...r,
      author: r.authorName ?? r.author,
      rating: r.rating ?? r.score,
      text: r.comment ?? r.text,
      date: r.date ?? r.createdAt,
      authorIsProfessional: false,
    })
  );
}
