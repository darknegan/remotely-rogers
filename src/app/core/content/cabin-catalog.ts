import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { environment } from '../../../environments/environment';
import { shortCabinName } from '../utils/reviews';

export interface CabinListing {
  id: number;
  slug: string;
  name: string;
  imageUrl: string;
  gallery: string[];
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  nightlyFrom: number;
  wifi: boolean;
  pets: boolean;
  parking: boolean;
  workspace: boolean;
  fireplace: boolean;
  lodgifyUrl: string;
}

const PHOTO: Record<string, string> = {
  'black-gum': '/cabins/black-gum.jpg',
  dogwood: '/cabins/dogwood.jpg',
  'running-spring': '/cabins/running-spring.jpg',
  'black-walnut': '/cabins/black-walnut.jpg',
  'white-oak': '/cabins/white-oak.jpg',
  'post-oak': '/cabins/post-oak.jpg',
};

const SHARED_GALLERY = ['/cabins/hero.jpg', '/cabins/03.jpg', '/cabins/10.jpg'];

function photoKey(slug: string): string {
  if (slug.startsWith('black-gum')) return 'black-gum';
  if (slug.startsWith('dogwood')) return 'dogwood';
  if (slug.startsWith('running-spring')) return 'running-spring';
  if (slug.startsWith('black-walnut')) return 'black-walnut';
  if (slug.startsWith('white-oak')) return 'white-oak';
  return 'post-oak';
}

export const CABIN_LISTINGS: CabinListing[] = CABIN_CONFIG.cabins.map((cabin) => {
  const key = photoKey(cabin.slug);
  const imageUrl = PHOTO[key];
  return {
    id: cabin.id,
    slug: cabin.slug,
    name: shortCabinName(cabin.name),
    imageUrl,
    gallery: [imageUrl, ...SHARED_GALLERY.filter((src) => src !== imageUrl)],
    guests: cabin.maxGuests,
    bedrooms: 2,
    beds: 3,
    baths: 1,
    nightlyFrom: 132,
    wifi: true,
    pets: true,
    parking: true,
    workspace: true,
    fireplace: true,
    lodgifyUrl: `${environment.siteBaseUrl}/en/${cabin.slug}/`,
  };
});

export function cabinBySlug(slug: string | null | undefined): CabinListing | undefined {
  if (!slug) {
    return undefined;
  }
  return CABIN_LISTINGS.find((cabin) => cabin.slug === slug);
}

export const AMENITY_GROUPS: { title: string; items: string }[] = [
  { title: 'Parking & facilities', items: 'Parking, patio or balcony' },
  {
    title: 'Kitchen & dining',
    items:
      'BBQ, kitchenette, coffee machine, cookware, microwave, oven, fridge and freezer, toaster, dishes, wine glasses, dining table, coffee, cooking basics, cleaning products',
  },
  { title: 'Internet & office', items: 'Wi-Fi, dedicated workspace' },
  { title: 'Heating & cooling', items: 'Air conditioning, ceiling fans, central heat, fireplace' },
  {
    title: 'Bathroom & laundry',
    items:
      'Shower, towels, hair dryer, shampoo, conditioner, body soap, linens, extra pillows, room-darkening shades, clothing storage. Laundromat nearby. Cleaning available during stay.',
  },
  { title: 'Location', items: 'Mountain, rural, private entrance' },
  { title: 'Safety', items: 'Smoke detector' },
  {
    title: 'Policies',
    items:
      'Children welcome, pets only after arrangement, no smoking, long-term stays allowed, credit cards accepted, accessible 24/7',
  },
];

export const CABIN_DESCRIPTION =
  'Welcome to Remotely Rogers, a six-cabin modern A-frame retreat. Our central location in Rogers, AR invites guests to spend their days boating on Beaver Lake, wandering Crystal Bridges, or traversing the local MTB trails. Traveling with friends or extended family? Book multiple cabins to have separate spaces while enjoying time together. NOTE: 2 friendly free-range GSP dogs live on site.';
