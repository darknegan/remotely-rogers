import { CABIN_CONFIG } from '../../../src/environments/cabin-config';

type DayStatus = 'available' | 'booked' | 'blocked';

interface AvailabilityRequest {
  arrival: string;
  departure: string;
  adults: number;
}

interface CabinAvailability {
  cabinId: number;
  nightlyRate: number;
  totalPrice: number;
  currency: string;
  available: boolean;
  days: Record<string, DayStatus>;
  bookingUrl?: string;
}

const NIGHTLY_RATE = 132;
const SITE_BASE_URL = 'https://remotelyrogers.com';

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function eachNight(arrival: Date, departure: Date): Date[] {
  const nights: Date[] = [];
  let current = startOfDay(arrival);
  const end = startOfDay(departure);

  while (current < end) {
    nights.push(new Date(current));
    current = addDays(current, 1);
  }

  return nights;
}

function mockDayStatus(cabinId: number, date: Date): DayStatus {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );

  if ((cabinId + dayOfYear) % 11 === 0) {
    return 'booked';
  }

  if ((cabinId * 3 + dayOfYear) % 17 === 0) {
    return 'blocked';
  }

  return 'available';
}

/** Mock availability until Lodgify quotes are wired through the BFF. */
export function buildAvailabilityResponse(request: AvailabilityRequest): { cabins: CabinAvailability[] } {
  const arrival = startOfDay(new Date(request.arrival));
  const departure = startOfDay(new Date(request.departure));
  const nights = eachNight(arrival, departure);
  const windowStart = addDays(arrival, -2);
  const windowEnd = addDays(departure, 2);
  const windowNights = eachNight(windowStart, windowEnd);

  const cabins = CABIN_CONFIG.cabins.map((cabin) => {
    const days: Record<string, DayStatus> = {};

    for (const night of windowNights) {
      days[toDateKey(night)] = mockDayStatus(cabin.id, night);
    }

    const stayAvailable = nights.every((night) => days[toDateKey(night)] === 'available');
    const totalPrice = NIGHTLY_RATE * nights.length;

    return {
      cabinId: cabin.id,
      nightlyRate: NIGHTLY_RATE,
      totalPrice,
      currency: 'USD',
      available: stayAvailable,
      days,
      bookingUrl: `${SITE_BASE_URL}/en/${cabin.slug}/`,
    };
  });

  return { cabins };
}
