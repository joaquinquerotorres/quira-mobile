export const REQUESTS_INVALIDATED_EVENT = 'quira:requests-invalidated';

export function notifyRequestsInvalidated(): void {
  window.dispatchEvent(new CustomEvent(REQUESTS_INVALIDATED_EVENT));
}
