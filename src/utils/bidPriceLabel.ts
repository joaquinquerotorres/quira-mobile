import type { Bid } from '../types';

export function bidPriceLabel(bid: Pick<Bid, 'pricingType' | 'priceQuote' | 'priceQuoteMin' | 'priceQuoteMax'>): string {
  if (bid.pricingType === 'RANGE') {
    const min = Number(bid.priceQuoteMin ?? bid.priceQuote ?? 0);
    const max = Number(bid.priceQuoteMax ?? bid.priceQuote ?? min);
    if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min) {
      return `${min}€ - ${max}€`;
    }
  }

  return `${Number(bid.priceQuote ?? 0)}€`;
}

