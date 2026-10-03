import { environment } from '../../../environments/environment';
import { GuestCounts } from '../../core/search/search-state.service';
import { toDateKey } from '../../core/utils/date-utils';

export interface BookingEstimate {
  nights: number;
  nightlyRate: number;
  subtotal: number;
  averagePerNight: number;
  dueToday: number;
  dueBeforeArrival: number;
}

export function computeBookingEstimate(
  nights: number,
  nightlyRate: number,
): BookingEstimate | null {
  if (nights <= 0 || nightlyRate <= 0) {
    return null;
  }

  const subtotal = nights * nightlyRate;

  return {
    nights,
    nightlyRate,
    subtotal,
    averagePerNight: Math.round(subtotal / nights),
    dueToday: Math.round(subtotal * 0.5),
    dueBeforeArrival: subtotal - Math.round(subtotal * 0.5),
  };
}

export function buildLodgifyBookingUrl(
  slug: string,
  checkIn: Date,
  checkOut: Date,
  guests: GuestCounts,
): string {
  const base = `${environment.siteBaseUrl}/en/${slug}/`;
  const params = new URLSearchParams({
    from: toDateKey(checkIn),
    to: toDateKey(checkOut),
    adults: String(guests.adults),
    children: String(guests.children),
    infants: String(guests.infants),
    pets: String(guests.pets),
  });

  return `${base}?${params.toString()}`;
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
