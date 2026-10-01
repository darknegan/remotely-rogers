import { CABIN_CONFIG } from '../../../../environments/cabin-config';

export type ActivityCategory =
  | 'All'
  | 'Outdoor'
  | 'Biking'
  | 'History'
  | 'Dining'
  | 'Nightlife'
  | 'Weekend trips';

export interface CategoryOption {
  label: string;
  value: ActivityCategory;
}

export interface FeaturedActivity {
  id: string;
  title: string;
  description: string;
  eyebrow: string;
  minutes: number;
  variant: 'walnut' | 'oxblood' | 'brass';
  websiteUrl: string;
  categories: ActivityCategory[];
  large?: boolean;
}

export interface OutdoorSpot {
  name: string;
  meta: string;
  line: string;
  websiteUrl: string;
}

export interface TrailSpot {
  name: string;
  minutes: number;
  where: string;
  websiteUrl: string;
}

export interface CultureSpot {
  name: string;
  meta: string;
  websiteUrl: string;
  categories: ActivityCategory[];
}

export interface DiningSpot {
  name: string;
  kind: string;
  websiteUrl: string;
}

export interface AdventureStep {
  period: string;
  title: string;
  description: string;
}

function cabinImage(slug: string, width = 1600): string {
  const cabin = CABIN_CONFIG.cabins.find((entry) => entry.slug === slug);
  const baseUrl =
    cabin?.imageUrl ?? CABIN_CONFIG.cabins[0]?.imageUrl ?? 'https://l.icdbcdn.com/oh/1ae37a40-2d6a-429e-bb94-15f02c14dd18.png?w=400';
  return baseUrl.replace('w=400', `w=${width}`);
}

export const ACTIVITY_HERO_IMAGE = cabinImage(
  'black-gum-getaway-cozy-forest-a-frame-near-bentonville',
  1800,
);

export const ACTIVITY_CULTURE_IMAGE = cabinImage(
  'dogwood-den--cozy-forest-a-frame-near-bentonville',
  1600,
);

export const ACTIVITY_EMPTY_IMAGE = cabinImage(
  'running-spring-retreat-cozy-forest-a-frame-near-bentonville',
  1200,
);

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { label: 'All', value: 'All' },
  { label: 'Outdoor', value: 'Outdoor' },
  { label: 'Biking', value: 'Biking' },
  { label: 'History', value: 'History' },
  { label: 'Dining', value: 'Dining' },
  { label: 'Nightlife', value: 'Nightlife' },
  { label: 'Weekend trips', value: 'Weekend trips' },
];

export const FEATURED_ACTIVITIES: FeaturedActivity[] = [
  {
    id: 'hobbs',
    title: 'Hobbs State Park',
    description:
      "Arkansas's largest state park, with hiking and mountain bike trails along the shore of Beaver Lake.",
    eyebrow: 'Outdoor · State park',
    minutes: 25,
    variant: 'walnut',
    websiteUrl: 'https://www.americasstateparks.org/state-park/hobbs/',
    categories: ['Outdoor'],
    large: true,
  },
  {
    id: 'atalanta',
    title: 'Lake Atalanta',
    description:
      'A lake loop and trails on the edge of Rogers — the closest morning walk off the property.',
    eyebrow: 'Outdoor · City park',
    minutes: 8,
    variant: 'oxblood',
    websiteUrl:
      'https://www.destinationrogers.com/get-inspired/articles/lake-atalanta-features-improved-trails-and-facilities/',
    categories: ['Outdoor'],
  },
  {
    id: 'biking',
    title: 'World-class biking',
    description:
      'Slaughter Pen and Coler in Bentonville — the trails that brought riders to Northwest Arkansas.',
    eyebrow: 'Biking',
    minutes: 20,
    variant: 'brass',
    websiteUrl: 'https://nwabiketrails.com/',
    categories: ['Biking'],
  },
];

export const OUTDOOR_SPOTS: OutdoorSpot[] = [
  {
    name: 'Lake Atalanta',
    meta: '8 min',
    line: 'Walking loop, paved trail and mountain bike singletrack in Rogers.',
    websiteUrl:
      'https://www.destinationrogers.com/get-inspired/articles/lake-atalanta-features-improved-trails-and-facilities/',
  },
  {
    name: 'Prairie Creek Marina',
    meta: 'Beaver Lake',
    line: 'Boat rentals and a swim beach on the lake.',
    websiteUrl: 'https://www.beaverlake.com/marinas/prairie-creek-marina/',
  },
  {
    name: 'War Eagle Cavern',
    meta: 'Beaver Lake',
    line: 'Guided cave tours near the water.',
    websiteUrl: 'https://wareaglecavern.com/',
  },
  {
    name: 'Hobbs State Park',
    meta: '25 min',
    line: 'Long hikes and rides through the largest state park in Arkansas.',
    websiteUrl: 'https://www.americasstateparks.org/state-park/hobbs/',
  },
];

export const TRAIL_SPOTS: TrailSpot[] = [
  {
    name: 'Lake Atalanta',
    minutes: 8,
    where: 'Rogers',
    websiteUrl: 'https://www.oztrails.com/trail/lake-atalanta/',
  },
  {
    name: 'Slaughter Pen',
    minutes: 20,
    where: 'Bentonville',
    websiteUrl: 'https://www.oztrails.com/trail/slaughter-pen/',
  },
  {
    name: 'Coler',
    minutes: 22,
    where: 'Bentonville',
    websiteUrl: 'https://www.oztrails.com/trail/coler-mtb-preserve/',
  },
  {
    name: 'Fitzgerald Mountain',
    minutes: 25,
    where: 'Springdale',
    websiteUrl: 'https://www.oztrails.com/trail/fitzgerald-mountain/',
  },
];

export const CULTURE_SPOTS: CultureSpot[] = [
  {
    name: 'Historic Downtown Rogers',
    meta: '12 min',
    websiteUrl:
      'https://www.destinationrogers.com/downtown-things-to-do/guide-to-downtown-rogers-arkansas-a-must-visit-destination/',
    categories: ['History', 'Nightlife', 'Dining'],
  },
  {
    name: 'Rogers Historical Museum',
    meta: 'Downtown',
    websiteUrl: 'https://www.rogershistoricalmuseum.org/',
    categories: ['History'],
  },
  {
    name: 'Railyard Live',
    meta: 'Outdoor concerts',
    websiteUrl: 'https://railyardlive.com/',
    categories: ['Nightlife'],
  },
];

export const DINING_SPOTS: DiningSpot[] = [
  {
    name: 'The Buttered Biscuit',
    kind: 'Breakfast & brunch',
    websiteUrl: 'https://thebutteredbiscuit.com/',
  },
  {
    name: "Smokin' Joe's Ribhouse",
    kind: 'Barbecue',
    websiteUrl: 'https://smokinjoesribhouse.com/',
  },
  {
    name: 'Louise Café',
    kind: 'Café',
    websiteUrl: 'https://www.louise.cafe/',
  },
  {
    name: 'House 1830',
    kind: 'Dinner',
    websiteUrl: 'https://www.house1830.com/',
  },
  {
    name: "Tekila's",
    kind: 'Mexican',
    websiteUrl: 'https://www.tekilasbargrill.com/',
  },
  {
    name: 'Crystal Bridges Café',
    kind: 'At the museum',
    websiteUrl: 'https://crystalbridges.org/food-and-drink',
  },
];

export const ADVENTURE_DAY: AdventureStep[] = [
  {
    period: 'Morning',
    title: 'Trails or the lake',
    description: 'Coffee on the porch, then eight minutes to Lake Atalanta.',
  },
  {
    period: 'Afternoon',
    title: 'Ride or explore',
    description: 'Slaughter Pen or Coler, or Crystal Bridges if the weather turns.',
  },
  {
    period: 'Evening',
    title: 'Dinner & music downtown',
    description: 'Downtown Rogers for dinner, then a show at Railyard Live.',
  },
];

export function matchesCategory(
  selectedCategory: ActivityCategory,
  itemCategories: readonly ActivityCategory[],
): boolean {
  if (selectedCategory === 'All') {
    return true;
  }

  return itemCategories.includes(selectedCategory);
}

export function filterFeatured(
  selectedCategory: ActivityCategory,
  featured: readonly FeaturedActivity[] = FEATURED_ACTIVITIES,
): FeaturedActivity[] {
  return featured.filter((item) => matchesCategory(selectedCategory, item.categories));
}

export function filterCulture(
  selectedCategory: ActivityCategory,
  cultureSpots: readonly CultureSpot[] = CULTURE_SPOTS,
): CultureSpot[] {
  return cultureSpots.filter((spot) => matchesCategory(selectedCategory, spot.categories));
}

export function showOutdoorSection(selectedCategory: ActivityCategory): boolean {
  return selectedCategory === 'All' || selectedCategory === 'Outdoor';
}

export function showTrailsBand(selectedCategory: ActivityCategory): boolean {
  return selectedCategory === 'All';
}

export function showTrailsCards(selectedCategory: ActivityCategory): boolean {
  return selectedCategory === 'Biking';
}

export function showCultureSection(
  selectedCategory: ActivityCategory,
  cultureSpots: readonly CultureSpot[] = CULTURE_SPOTS,
): boolean {
  if (selectedCategory === 'All') {
    return true;
  }

  return filterCulture(selectedCategory, cultureSpots).length > 0;
}

export function showDiningSection(selectedCategory: ActivityCategory): boolean {
  return selectedCategory === 'All' || selectedCategory === 'Dining';
}

export function hasVisibleContent(selectedCategory: ActivityCategory): boolean {
  return (
    filterFeatured(selectedCategory).length > 0 ||
    showOutdoorSection(selectedCategory) ||
    showTrailsCards(selectedCategory) ||
    showCultureSection(selectedCategory) ||
    showDiningSection(selectedCategory)
  );
}

export function filterSummary(selectedCategory: ActivityCategory): string {
  if (selectedCategory === 'All') {
    return '';
  }

  if (!hasVisibleContent(selectedCategory)) {
    return '0 results';
  }

  const featuredCount = filterFeatured(selectedCategory).length;
  const parts: string[] = [];

  if (featuredCount > 0) {
    parts.push(`${featuredCount} featured`);
  }

  if (showTrailsCards(selectedCategory)) {
    parts.push(`${TRAIL_SPOTS.length} trails`);
  }

  if (showOutdoorSection(selectedCategory) && selectedCategory === 'Outdoor') {
    parts.push(`${OUTDOOR_SPOTS.length} outdoor`);
  }

  if (showCultureSection(selectedCategory)) {
    parts.push(`${filterCulture(selectedCategory).length} culture`);
  }

  if (showDiningSection(selectedCategory) && selectedCategory === 'Dining') {
    parts.push(`${DINING_SPOTS.length} dining`);
  }

  return parts.join(' · ');
}

export function showFeaturedGrid(selectedCategory: ActivityCategory): boolean {
  const items = filterFeatured(selectedCategory);
  return selectedCategory === 'All' && items.some((item) => item.large) && items.length > 1;
}

export function isBikingFilter(selectedCategory: ActivityCategory): boolean {
  return selectedCategory === 'Biking';
}
