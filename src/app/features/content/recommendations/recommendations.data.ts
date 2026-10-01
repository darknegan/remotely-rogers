import { CABIN_CONFIG } from '../../../../environments/cabin-config';

export type RecommendationVariant = 'walnut' | 'oxblood' | 'brass' | 'paper' | 'linen';

export interface RecommendationPick {
  number: string;
  title: string;
  description: string;
  category: string;
  minutes?: number;
  variant: RecommendationVariant;
  websiteUrl: string;
  large?: boolean;
}

export interface LocalTip {
  number: string;
  text: string;
}

export interface DayPlanStep {
  period: string;
  title: string;
}

export interface TripVibe {
  title: string;
  lines: string[];
  variant: 'brass' | 'walnut' | 'oxblood';
}

export interface MapLegendItem {
  number: number;
  name: string;
  driveTime: string;
}

function cabinImage(slug: string, width = 1600): string {
  const cabin = CABIN_CONFIG.cabins.find((entry) => entry.slug === slug);
  const baseUrl =
    cabin?.imageUrl ??
    CABIN_CONFIG.cabins[0]?.imageUrl ??
    'https://l.icdbcdn.com/oh/1ae37a40-2d6a-429e-bb94-15f02c14dd18.png?w=400';
  return baseUrl.replace('w=400', `w=${width}`);
}

export const RECOMMENDATIONS_HERO_IMAGE = cabinImage(
  'black-gum-getaway-cozy-forest-a-frame-near-bentonville',
  1800,
);

export const RECOMMENDATIONS_DAY_PLAN_IMAGE = cabinImage(
  'dogwood-den--cozy-forest-a-frame-near-bentonville',
  1800,
);

export const RECOMMENDATIONS_CTA_IMAGE = cabinImage(
  'black-gum-getaway-cozy-forest-a-frame-near-bentonville',
  1600,
);

export const MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d103532!2d-94.118!3d36.332!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sRogers%2C%20AR!5e0!3m2!1sen!2sus!4v1234567890';

export const RECOMMENDATION_PICKS: RecommendationPick[] = [
  {
    number: '02',
    title: 'Crystal Bridges',
    description:
      'American art in a museum built into a ravine, with walking trails through the woods around it.',
    category: 'Culture · Bentonville',
    minutes: 25,
    variant: 'walnut',
    websiteUrl: 'https://crystalbridges.org/',
    large: true,
  },
  {
    number: '01',
    title: 'The Buttered Biscuit',
    description: 'Our first stop for a slow breakfast. Go early on weekends.',
    category: 'Brunch',
    variant: 'oxblood',
    websiteUrl: 'https://thebutteredbiscuit.com/',
  },
  {
    number: '03',
    title: 'Beaver Lake',
    description: 'Swim, rent a boat, or drive the shoreline.',
    category: 'On the water',
    minutes: 20,
    variant: 'brass',
    websiteUrl: 'https://www.swl.usace.army.mil/Missions/Recreation/Beaver-Lake/',
  },
  {
    number: '04',
    title: 'Downtown Rogers',
    description: 'Brick storefronts, restaurants and the Saturday crowd.',
    category: 'Coffee & stroll',
    minutes: 12,
    variant: 'paper',
    websiteUrl:
      'https://www.destinationrogers.com/downtown-things-to-do/guide-to-downtown-rogers-arkansas-a-must-visit-destination/',
  },
  {
    number: '05',
    title: 'Railyard Live',
    description:
      'Outdoor concerts in downtown Rogers. Check the calendar before you come.',
    category: 'Nightlife',
    variant: 'paper',
    websiteUrl: 'https://railyardlive.com/',
  },
  {
    number: '06',
    title: 'Pea Ridge National Military Park',
    description: 'A Civil War battlefield with a driving tour and trails.',
    category: 'History',
    variant: 'linen',
    websiteUrl: 'https://www.nps.gov/peri/',
  },
];

export const LOCAL_TIPS: LocalTip[] = [
  { number: '01', text: 'Start mornings slow — the porch is the point.' },
  { number: '02', text: 'Bentonville is an easy day trip, not a separate stay.' },
  { number: '03', text: 'Book dinner reservations ahead on weekends.' },
  {
    number: '04',
    text: 'Rainy day? Crystal Bridges and War Eagle Cavern are both indoors.',
  },
  { number: '05', text: 'Ask Jeff about seasonal events while you’re here.' },
  { number: '06', text: 'Most drives from the hill are 8 to 25 minutes.' },
];

export const DAY_PLAN: DayPlanStep[] = [
  { period: 'Late morning', title: 'Brunch' },
  { period: 'Afternoon', title: 'The lake, or culture' },
  { period: 'Evening', title: 'Downtown Rogers' },
];

export const TRIP_VIBES: TripVibe[] = [
  {
    title: 'Outdoor day',
    lines: ['Lake Atalanta at sunrise', 'Slaughter Pen or Coler', 'Swim at Beaver Lake'],
    variant: 'brass',
  },
  {
    title: 'Culture trip',
    lines: [
      'Crystal Bridges',
      'Rogers Historical Museum',
      'Pea Ridge battlefield',
    ],
    variant: 'walnut',
  },
  {
    title: 'Foodie evening',
    lines: [
      'Brunch at The Buttered Biscuit',
      'Dinner at House 1830',
      'Music at Railyard Live',
    ],
    variant: 'oxblood',
  },
];

export const MAP_LEGEND: MapLegendItem[] = [
  { number: 1, name: 'The Buttered Biscuit', driveTime: '' },
  { number: 2, name: 'Crystal Bridges', driveTime: '25 min' },
  { number: 3, name: 'Beaver Lake', driveTime: '20 min' },
  { number: 4, name: 'Downtown Rogers', driveTime: '12 min' },
  { number: 5, name: 'Railyard Live', driveTime: 'Downtown' },
  { number: 6, name: 'Pea Ridge National Military Park', driveTime: '' },
];
