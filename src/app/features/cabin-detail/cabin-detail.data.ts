import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { CABIN_NIGHTLY_RATE } from '../cabins/cabins.data';

export interface CabinGalleryImage {
  url: string;
  alt: string;
}

export interface CabinAmenityGroup {
  title: string;
  items: string;
}

export interface CabinHouseRule {
  label: string;
  value: string;
}

export interface CabinPolicyCard {
  title: string;
  body: string;
}

export interface CabinDetailContent {
  slug: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  fromPrice: number;
  highlights: string[];
  gallery: CabinGalleryImage[];
  amenityGroups: CabinAmenityGroup[];
}

const SHARED_AMENITY_GROUPS: CabinAmenityGroup[] = [
  {
    title: 'Parking & facilities',
    items: 'Parking, patio or balcony',
  },
  {
    title: 'Kitchen & dining',
    items:
      'BBQ, kitchenette, coffee machine, cookware, microwave, oven, fridge/freezer, toaster, dishes, wine glasses, dining table, coffee, cooking basics, cleaning products',
  },
  {
    title: 'Internet & office',
    items: 'Wi-Fi, dedicated workspace',
  },
  {
    title: 'Heating & cooling',
    items: 'A/C, ceiling fans, central heat, fireplace',
  },
  {
    title: 'Bathroom & laundry',
    items:
      'Shower, towels, hair dryer, shampoo, conditioner, body soap, linens, extra pillows, room-darkening shades, clothing storage. Laundromat nearby; cleaning available during your stay',
  },
  {
    title: 'Location',
    items: 'Mountain, rural, private entrance',
  },
  {
    title: 'Safety',
    items: 'Smoke detector',
  },
  {
    title: 'Policies',
    items:
      'Children welcome, pets only after arrangement, no smoking, long-term stays allowed, credit cards accepted, accessible 24/7',
  },
];

const HIGHLIGHTS_BY_SLUG: Record<string, string[]> = {
  'black-gum-getaway-cozy-forest-a-frame-near-bentonville': [
    'Parking',
    'Pets welcome',
    'Wireless internet',
  ],
  'dogwood-den--cozy-forest-a-frame-near-bentonville': [
    'Parking',
    'Pets welcome',
    'Fireplace',
  ],
  'running-spring-retreat-cozy-forest-a-frame-near-bentonville': [
    'Parking',
    'Pets welcome',
    'Fireplace',
  ],
  'black-walnut-bungalow-cozy-forest-a-frame-near-bentonville': [
    'Dedicated workspace',
    'Pets welcome',
    'Wireless internet',
  ],
  'white-oak-haven-cozy-forest-a-frame-near-bentonville': [
    'Dedicated workspace',
    'Pets welcome',
    'Wireless internet',
  ],
  'post-oak-perch-cozy-forest-a-frame-near-bentonville': [
    'Parking at the door',
    'Pets welcome',
    'Fireplace',
  ],
};

function cabinImageUrl(imageUrl: string, width = 1200): string {
  return imageUrl.replace('w=400', `w=${width}`);
}

function galleryForCabin(slug: string, name: string, primaryUrl: string): CabinGalleryImage[] {
  const shortName = name.split('-')[0].trim();
  const primary = cabinImageUrl(primaryUrl, 1400);
  const extras = CABIN_CONFIG.cabins
    .filter((cabin) => cabin.slug !== slug && cabin.imageUrl)
    .slice(0, 3)
    .map((cabin, index) => ({
      url: cabinImageUrl(cabin.imageUrl ?? '', 1000),
      alt: `${shortName} — photo ${index + 2}`,
    }));

  return [
    { url: primary, alt: `${shortName} living room` },
    ...extras,
  ];
}

function buildDetailContent(slug: string): CabinDetailContent {
  const cabin = CABIN_CONFIG.cabins.find((entry) => entry.slug === slug);
  if (!cabin) {
    throw new Error(`Unknown cabin slug: ${slug}`);
  }

  return {
    slug,
    bedrooms: 2,
    beds: 3,
    bathrooms: 1,
    fromPrice: CABIN_NIGHTLY_RATE,
    highlights: HIGHLIGHTS_BY_SLUG[slug] ?? ['Parking', 'Pets welcome', 'Wireless internet'],
    gallery: galleryForCabin(slug, cabin.name, cabin.imageUrl ?? ''),
    amenityGroups: SHARED_AMENITY_GROUPS,
  };
}

export const CABIN_DETAIL_BY_SLUG: Record<string, CabinDetailContent> = Object.fromEntries(
  CABIN_CONFIG.cabins.map((cabin) => [cabin.slug, buildDetailContent(cabin.slug)]),
);

export const CABIN_DETAIL_SLUGS = CABIN_CONFIG.cabins.map((cabin) => cabin.slug);

export function cabinDetailForSlug(slug: string): CabinDetailContent | null {
  return CABIN_DETAIL_BY_SLUG[slug] ?? null;
}

export const CABIN_INTRO_HEADLINE =
  'Welcome to Remotely Rogers, a six-cabin modern A-frame retreat.';

export const CABIN_INTRO_LEDE =
  "We're in central Rogers, Arkansas — close to Beaver Lake, Crystal Bridges and the mountain bike trails around Bentonville.";

export const CABIN_DOG_NOTE =
  'Two friendly, free-range German Shorthaired Pointers live on site. They may come say hello.';

export const CABIN_LOCATION_NOTE =
  'Rogers, Benton County, Arkansas · 12.6 mi to the airport';

export const CABIN_HOUSE_RULES: CabinHouseRule[] = [
  { label: 'Check-in', value: '3:00 PM' },
  { label: 'Check-out', value: '11:00 AM' },
  { label: 'Quiet hours', value: '10:00 PM – 8:00 AM' },
  { label: 'Pets', value: 'By arrangement' },
  { label: 'Smoking', value: 'Not allowed' },
  { label: 'Children', value: 'Welcome' },
];

export const CABIN_POLICY_CARDS: CabinPolicyCard[] = [
  {
    title: 'Rates',
    body: 'Prices vary by date. Select a period to see your rate — from $132 per night.',
  },
  {
    title: 'Payment',
    body: '50% due at reservation. The remainder is due 7 days before arrival.',
  },
  {
    title: 'Cancellation',
    body: '100% refund 30+ days out · 50% at 14+ days · no refund after that.',
  },
  {
    title: 'Security deposit',
    body: '$250 pre-authorization, voided 2 days after departure.',
  },
];

export const HOST_CONTACT = {
  name: 'Jeff Wolfe',
  email: 'Jeff@remotelyrogers.com',
  phone: '479-440-5011',
  phoneHref: 'tel:4794405011',
  bio:
    'Jeff lives nearby and answers questions himself — directions, dinner, dogs, or adding a second cabin.',
  imageUrl: cabinImageUrl(
    CABIN_CONFIG.cabins.find((c) => c.slug.includes('post-oak'))?.imageUrl ?? '',
    400,
  ),
};
