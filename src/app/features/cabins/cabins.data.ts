import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { shortCabinName } from '../../core/utils/reviews';

export const CABIN_NIGHTLY_RATE = 132;

export const CABIN_AMENITY_OPTIONS = [
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'pets', label: 'Pets welcome' },
  { id: 'parking', label: 'Parking' },
  { id: 'workspace', label: 'Dedicated workspace' },
  { id: 'fireplace', label: 'Fireplace' },
] as const;

export type CabinAmenityId = (typeof CABIN_AMENITY_OPTIONS)[number]['id'];

export type CabinSort = 'price-asc' | 'price-desc' | 'name-asc';

export type CabinLayoutRole = 'featured' | 'grid-primary' | 'grid-offset' | 'row';

export type BedroomFilter = 'any' | 1 | 2;

export interface CabinListing {
  id: number;
  slug: string;
  name: string;
  tagline?: string;
  imageUrl: string;
  nightlyRate: number;
  amenities: CabinAmenityId[];
  bedrooms: 2;
  layoutRole: CabinLayoutRole;
  mapPin: number;
}

const AMENITY_BY_SLUG: Record<string, CabinAmenityId[]> = {
  'black-gum-getaway-cozy-forest-a-frame-near-bentonville': ['wifi', 'pets', 'parking', 'fireplace'],
  'dogwood-den--cozy-forest-a-frame-near-bentonville': ['wifi', 'pets', 'parking', 'fireplace'],
  'running-spring-retreat-cozy-forest-a-frame-near-bentonville': [
    'wifi',
    'pets',
    'parking',
    'fireplace',
  ],
  'black-walnut-bungalow-cozy-forest-a-frame-near-bentonville': [
    'wifi',
    'pets',
    'parking',
    'workspace',
    'fireplace',
  ],
  'white-oak-haven-cozy-forest-a-frame-near-bentonville': ['wifi', 'pets', 'parking', 'workspace'],
  'post-oak-perch-cozy-forest-a-frame-near-bentonville': ['wifi', 'pets', 'parking', 'fireplace'],
};

const TAGLINE_BY_SLUG: Record<string, string> = {
  'black-walnut-bungalow-cozy-forest-a-frame-near-bentonville':
    'Bright, with a proper desk by the window.',
  'white-oak-haven-cozy-forest-a-frame-near-bentonville':
    'The sunniest main room on the property.',
  'post-oak-perch-cozy-forest-a-frame-near-bentonville':
    'Up the hill, with parking at the door.',
};

const LAYOUT_BY_SLUG: Record<string, CabinLayoutRole> = {
  'black-gum-getaway-cozy-forest-a-frame-near-bentonville': 'featured',
  'dogwood-den--cozy-forest-a-frame-near-bentonville': 'grid-primary',
  'running-spring-retreat-cozy-forest-a-frame-near-bentonville': 'grid-offset',
  'black-walnut-bungalow-cozy-forest-a-frame-near-bentonville': 'row',
  'white-oak-haven-cozy-forest-a-frame-near-bentonville': 'row',
  'post-oak-perch-cozy-forest-a-frame-near-bentonville': 'row',
};

function cabinImageUrl(imageUrl: string, width = 1200): string {
  return imageUrl.replace('w=400', `w=${width}`);
}

export const CABIN_LISTINGS: CabinListing[] = CABIN_CONFIG.cabins.map((cabin) => ({
  id: cabin.id,
  slug: cabin.slug,
  name: shortCabinName(cabin.name),
  tagline: TAGLINE_BY_SLUG[cabin.slug],
  imageUrl: cabinImageUrl(cabin.imageUrl ?? ''),
  nightlyRate: CABIN_NIGHTLY_RATE,
  amenities: AMENITY_BY_SLUG[cabin.slug] ?? ['wifi', 'pets', 'parking'],
  bedrooms: 2,
  layoutRole: LAYOUT_BY_SLUG[cabin.slug] ?? 'row',
  mapPin: cabin.id,
}));

export interface SuggestedDateRange {
  label: string;
  checkIn: string;
  checkOut: string;
  availableCount: number;
}

export const HOLIDAY_EMPTY_SUGGESTIONS: SuggestedDateRange[] = [
  { label: 'Dec 27 – 29', checkIn: '12-27', checkOut: '12-29', availableCount: 3 },
  { label: 'Dec 20 – 22', checkIn: '12-20', checkOut: '12-22', availableCount: 2 },
  { label: 'Jan 1 – 3', checkIn: '01-01', checkOut: '01-03', availableCount: 6 },
];

export const SORT_OPTIONS: { label: string; value: CabinSort }[] = [
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Name: A to Z', value: 'name-asc' },
];
