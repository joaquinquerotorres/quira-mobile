/**
 * Piezas compartidas de listados (Mis solicitudes / Mercado / Mi Trabajo).
 *
 * Alias del prompt ↔ implementación existente:
 * - ListingHeroHeader → MainHeader
 * - SegmentedTabBar → SegmentTab
 * - SearchWithFilter → SearchText
 * - BottomNav → IonTabs en App.tsx (cliente vs pro; sin "+" en pro)
 */

export { default as ListingHeroHeader } from '../shared/MainHeader';
export { SegmentTab as SegmentedTabBar } from '../shared/SegmentTab';
export { SearchText as SearchWithFilter } from '../shared/SearchText';

export { CategoryBadge } from './CategoryBadge';
export { StatusBadge } from './StatusBadge';
export { EstimatePriceBlock } from './EstimatePriceBlock';
export { ListingCardFooter } from './ListingCardFooter';
export { ListingCard } from './ListingCard';
export { RequestBidsChip } from './RequestBidsChip';
export { FilterChipRow } from './FilterChipRow';
