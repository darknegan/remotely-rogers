import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { shortCabinName } from '../../../core/utils/reviews';

export interface WorkAmenity {
  number: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  linkPath?: string;
  linkLabel?: string;
  overlay?: boolean;
  variant?: 'oxblood';
}

export interface WorkNeed {
  text: string;
}

export interface WorkdayStep {
  time: string;
  title: string;
  description: string;
}

export interface StayOption {
  eyebrow: string;
  title: string;
  description: string;
  variant: 'paper' | 'walnut' | 'paper-link';
  linkPath?: string;
  linkLabel?: string;
  ctaPath?: string;
  ctaLabel?: string;
}

export interface CabinSelectOption {
  label: string;
  value: string;
}

function cabinImage(slug: string, width = 1600): string {
  const cabin = CABIN_CONFIG.cabins.find((entry) => entry.slug === slug);
  const baseUrl =
    cabin?.imageUrl ??
    CABIN_CONFIG.cabins[0]?.imageUrl ??
    'https://l.icdbcdn.com/oh/1ae37a40-2d6a-429e-bb94-15f02c14dd18.png?w=400';
  return baseUrl.replace('w=400', `w=${width}`);
}

export const WORK_STAYS_HERO_IMAGE = cabinImage(
  'black-walnut-bungalow-cozy-forest-a-frame-near-bentonville',
  1800,
);

export const WORK_AMENITIES: WorkAmenity[] = [
  {
    number: '01',
    title: 'Private A-frame offices',
    description:
      'A desk, a real chair, Wi-Fi and natural light from the glass wall. Close the door and nobody’s on the other side.',
    imageUrl: cabinImage('black-gum-getaway-cozy-forest-a-frame-near-bentonville', 1200),
    imageAlt: 'Loft workspace in an A-frame cabin',
  },
  {
    number: '02',
    title: 'Nature between meetings',
    description: 'Seventy acres to walk between calls.',
    imageUrl: cabinImage('running-spring-retreat-cozy-forest-a-frame-near-bentonville', 1200),
    imageAlt: 'Running Spring Retreat on the property',
    overlay: true,
  },
  {
    number: '03',
    title: 'Team & corporate retreats',
    description: 'Book several cabins for the team — everyone gets their own.',
    imageUrl: '',
    imageAlt: '',
    variant: 'oxblood',
    linkPath: '/multi-cabin',
    linkLabel: 'Multi-cabin stays →',
  },
];

export const WORK_NEEDS: WorkNeed[] = [
  { text: 'High-speed Wi-Fi' },
  { text: 'A dedicated workspace' },
  { text: 'No shared walls' },
  { text: 'Weekly and extended stays' },
  { text: 'Rogers & Bentonville close by' },
  { text: 'On-site parking' },
];

export const WORKDAY_FLOW: WorkdayStep[] = [
  {
    time: '8 AM',
    title: 'Coffee & deep work',
    description:
      'Quiet hours end at 8. The best focus of the day is the first two hours.',
  },
  {
    time: 'Noon',
    title: 'Walk or ride',
    description:
      'The property, Lake Atalanta, or twenty minutes to the Bentonville trails.',
  },
  {
    time: '2 PM',
    title: 'Calls & collaboration',
    description: 'Meetings from the desk, or with the team in the next cabin over.',
  },
];

export const STAY_OPTIONS: StayOption[] = [
  {
    eyebrow: '1 cabin · 5–7 nights',
    title: 'Solo work week',
    description: 'Arrive Sunday, work the week, stay for the weekend if you like.',
    variant: 'paper',
  },
  {
    eyebrow: '4+ weeks',
    title: 'Extended stay',
    description:
      'Long-term stays are allowed. Cleaning is available during your stay and there’s a laundromat nearby.',
    variant: 'walnut',
    ctaPath: '#inquire',
    ctaLabel: 'Ask about monthly',
  },
  {
    eyebrow: 'Multiple cabins',
    title: 'Team offsite',
    description: 'Up to six cabins, four people each, on one checkout.',
    variant: 'paper-link',
    linkPath: '/multi-cabin',
    linkLabel: 'Open the group calendar →',
  },
];

export const CABIN_SELECT_OPTIONS: CabinSelectOption[] = [
  { label: 'No preference', value: '' },
  ...CABIN_CONFIG.cabins.map((cabin) => ({
    label: shortCabinName(cabin.name),
    value: shortCabinName(cabin.name),
  })),
];

export const HOST_PHONE = '479-440-5011';
export const HOST_EMAIL = 'Jeff@remotelyrogers.com';
