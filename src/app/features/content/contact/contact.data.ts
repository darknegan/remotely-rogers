import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { shortCabinName } from '../../../core/utils/reviews';

export interface CabinSelectOption {
  label: string;
  value: string;
}

export interface TimeWindowOption {
  label: string;
  value: string;
}

export const HOST_NAME = 'Jeff Wolfe';
export const HOST_PHONE = '479-440-5011';
export const HOST_PHONE_HREF = 'tel:4794405011';
export const HOST_EMAIL = 'Jeff@remotelyrogers.com';
export const HOST_ADDRESS_LINE1 = '11611–11601 Lindy Lane';
export const HOST_ADDRESS_LINE2 = 'Rogers, AR 72756';
export const HOST_MAP_URL = 'https://maps.google.com/?q=11611+Lindy+Lane+Rogers+AR+72756';

export const TIME_WINDOW_OPTIONS: TimeWindowOption[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
  { label: 'Flexible', value: 'flexible' },
];

export const CABIN_SELECT_OPTIONS: CabinSelectOption[] = [
  { label: 'No preference', value: '' },
  ...CABIN_CONFIG.cabins.map((cabin) => ({
    label: shortCabinName(cabin.name),
    value: shortCabinName(cabin.name),
  })),
];
