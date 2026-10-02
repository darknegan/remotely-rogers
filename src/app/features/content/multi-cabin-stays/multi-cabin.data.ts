import { CABIN_CONFIG } from '../../../../environments/cabin-config';

export interface MultiCabinStep {
  number: string;
  title: string;
  description: string;
}

export interface MultiCabinStat {
  value: string;
  label: string;
}

function cabinImage(slug: string, width = 1800): string {
  const cabin = CABIN_CONFIG.cabins.find((entry) => entry.slug === slug);
  const baseUrl =
    cabin?.imageUrl ??
    CABIN_CONFIG.cabins[0]?.imageUrl ??
    'https://l.icdbcdn.com/oh/1ae37a40-2d6a-429e-bb94-15f02c14dd18.png?w=400';
  return baseUrl.replace('w=400', `w=${width}`);
}

export const MULTI_CABIN_HERO_IMAGE = cabinImage(
  'running-spring-retreat-cozy-forest-a-frame-near-bentonville',
  1800,
);

export const MULTI_CABIN_STATS: MultiCabinStat[] = [
  { value: '6', label: 'Private cabins' },
  { value: '70', label: 'Shared acres' },
  { value: '1', label: 'Combined checkout' },
];

export const MULTI_CABIN_STEPS: MultiCabinStep[] = [
  {
    number: '1',
    title: 'Pick dates',
    description: 'Set a start date and guests per cabin.',
  },
  {
    number: '2',
    title: 'Select cabins',
    description: "Click nights on each cabin's row. Dates can differ by cabin.",
  },
  {
    number: '3',
    title: 'One combined checkout',
    description: 'Pay for every cabin together; we book each one.',
  },
];
