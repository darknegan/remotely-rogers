export const CABIN_SLUGS = {
  blackGum: 'black-gum-getaway-cozy-forest-a-frame-near-bentonville',
  dogwood: 'dogwood-den--cozy-forest-a-frame-near-bentonville',
  runningSpring: 'running-spring-retreat-cozy-forest-a-frame-near-bentonville',
  blackWalnut: 'black-walnut-bungalow-cozy-forest-a-frame-near-bentonville',
  whiteOak: 'white-oak-haven-cozy-forest-a-frame-near-bentonville',
  postOak: 'post-oak-perch-cozy-forest-a-frame-near-bentonville',
} as const;

const LISTING_PREFIXES: { prefix: string; slug: string }[] = [
  { prefix: 'black walnut', slug: CABIN_SLUGS.blackWalnut },
  { prefix: 'black gum', slug: CABIN_SLUGS.blackGum },
  { prefix: 'dogwood den', slug: CABIN_SLUGS.dogwood },
  { prefix: 'still spring', slug: CABIN_SLUGS.runningSpring },
  { prefix: 'running spring', slug: CABIN_SLUGS.runningSpring },
  { prefix: 'white oak', slug: CABIN_SLUGS.whiteOak },
  { prefix: 'post oak', slug: CABIN_SLUGS.postOak },
];

export const VISIBLE_REVIEW_LIMIT = 4;

export const REVIEW_BAND_INTERVAL_MS = 15_000;

export interface CarouselAdvanceState {
  reviewCount: number;
  modalOpen: boolean;
  reduceMotion: boolean;
  documentHidden: boolean;
  hovered: boolean;
}

export function nextReviewIndex(current: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return (current + 1) % length;
}

export function prevReviewIndex(current: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return (current - 1 + length) % length;
}

export function shouldAutoAdvance(state: CarouselAdvanceState): boolean {
  return (
    state.reviewCount > 2 &&
    !state.modalOpen &&
    !state.reduceMotion &&
    !state.documentHidden &&
    !state.hovered
  );
}

export function visibleReviewWindow<T>(
  reviews: readonly T[],
  startIndex: number,
  size = 2,
): T[] {
  if (reviews.length === 0 || size <= 0) {
    return [];
  }
  if (reviews.length <= size) {
    return [...reviews];
  }
  const start = ((startIndex % reviews.length) + reviews.length) % reviews.length;
  const visible: T[] = [];
  for (let offset = 0; offset < size; offset++) {
    visible.push(reviews[(start + offset) % reviews.length]);
  }
  return visible;
}

export function reviewBandImageOnLeft(rowIndex: number): boolean {
  return rowIndex % 2 === 0;
}

export function shortCabinName(name: string): string {
  return name.split('-')[0].trim();
}

export function airbnbListingToCabinSlug(listingTitle: string): string | null {
  const normalized = listingTitle.trim().toLowerCase();
  const match = LISTING_PREFIXES.find(({ prefix }) => normalized.startsWith(prefix));
  return match?.slug ?? null;
}

export function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function averageRating(reviews: readonly { rating: number }[]): number {
  if (reviews.length === 0) {
    return 0;
  }
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

export function visibleReviews<T>(
  reviews: readonly T[],
  expanded: boolean,
  limit = VISIBLE_REVIEW_LIMIT,
): T[] {
  if (expanded || reviews.length <= limit) {
    return [...reviews];
  }
  return reviews.slice(0, limit);
}

export function cabinSlugFromPathname(pathname: string): string | null {
  const path = pathname.toLowerCase();
  return (
    Object.values(CABIN_SLUGS).find((slug) => path.includes(`/${slug}`)) ?? null
  );
}
