import { CABIN_CONFIG } from '../../../src/environments/cabin-config';
import {
  AvailabilityState,
  CabinAvailability,
  DayStatus,
} from '../../../src/app/core/models/booking.models';
import { toDateKey } from '../../../src/app/core/utils/date-utils';
import { BookingWorkerEnv, parseAirbnbListingMap } from './booking-config';
import { isStayAvailable } from './bookingmood-interval-map';

/**
 * Temporary read-only availability source: Airbnb's undocumented PdpAvailabilityCalendar
 * query, relayed through Bookingmood. Remove once the Airbnb iCal feeds live in Bookingmood.
 */
export const AIRBNB_CALENDAR_QUERY_HASH =
  '8f08e03c7bd16fcad3c92a3592c19a8b559a0d0855a84028d1163d4733ed9ade';

export const DEFAULT_AIRBNB_PREVIEW_UPSTREAM = `https://www.bookingmood.com/api/airbnb-availability/${AIRBNB_CALENDAR_QUERY_HASH}`;

const MAX_MONTHS = 12;
const CACHE_TTL_SECONDS = 300;

export interface AirbnbCalendarDay {
  calendarDate: string;
  available: boolean | null;
  availableForCheckin?: boolean | null;
  availableForCheckout?: boolean | null;
  minNights?: number | null;
  maxNights?: number | null;
}

interface AirbnbCalendarResponse {
  data?: {
    merlin?: {
      pdpAvailabilityCalendar?: {
        calendarMonths?: { days?: AirbnbCalendarDay[] }[];
      };
    };
  };
}

export function buildAirbnbCalendarUrl(
  upstream: string,
  listingId: string,
  startYear: number,
  startMonth: number,
  months: number,
): string {
  const url = new URL(upstream);
  url.searchParams.set('operationName', 'PdpAvailabilityCalendar');
  url.searchParams.set('locale', 'en');
  url.searchParams.set('currency', 'USD');
  url.searchParams.set(
    'variables',
    JSON.stringify({
      request: { listingId, count: months, year: startYear, month: startMonth },
    }),
  );
  url.searchParams.set(
    'extensions',
    JSON.stringify({ persistedQuery: { version: 1, sha256Hash: AIRBNB_CALENDAR_QUERY_HASH } }),
  );
  return url.toString();
}

export async function fetchAirbnbCalendar(
  listingId: string,
  startYear: number,
  startMonth: number,
  months: number,
  env: BookingWorkerEnv,
): Promise<AirbnbCalendarDay[]> {
  const apiKey = env.AIRBNB_WEB_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('AIRBNB_WEB_API_KEY is not set.');
  }

  const upstream = env.AIRBNB_PREVIEW_UPSTREAM?.trim() || DEFAULT_AIRBNB_PREVIEW_UPSTREAM;
  const url = buildAirbnbCalendarUrl(upstream, listingId, startYear, startMonth, months);
  const response = await globalThis.fetch(url, {
    headers: { Accept: 'application/json', 'X-Airbnb-Api-Key': apiKey },
    cf: { cacheTtl: CACHE_TTL_SECONDS },
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`Airbnb calendar request failed (${response.status}).`);
  }

  const payload = (await response.json()) as AirbnbCalendarResponse;
  const calendarMonths = payload.data?.merlin?.pdpAvailabilityCalendar?.calendarMonths;
  if (!Array.isArray(calendarMonths)) {
    throw new Error('Airbnb calendar response is missing calendarMonths.');
  }

  return calendarMonths.flatMap((month) => month.days ?? []);
}

/** Airbnb-blocked nights close open Bookingmood days. Booked and closed nights stay as Bookingmood reported them. */
export function blockNightsAirbnbMarksUnavailable(
  days: Record<string, DayStatus>,
  airbnbDays: Record<string, DayStatus>,
): Record<string, DayStatus> {
  const next = { ...days };
  for (const [key, status] of Object.entries(airbnbDays)) {
    if (status === 'blocked' && (next[key] === 'available' || next[key] === 'unknown')) {
      next[key] = 'blocked';
    }
  }
  return next;
}

export function mapAirbnbDaysToStatuses(
  days: AirbnbCalendarDay[],
  windowNights: Date[],
): Record<string, DayStatus> {
  const byDate = new Map(days.map((day) => [day.calendarDate, day.available]));
  const statuses: Record<string, DayStatus> = {};

  for (const night of windowNights) {
    const key = toDateKey(night);
    const available = byDate.get(key);
    statuses[key] = available === true ? 'available' : available === false ? 'blocked' : 'unknown';
  }

  return statuses;
}

export function monthSpan(windowNights: Date[]): { year: number; month: number; count: number } {
  const first = windowNights[0] ?? new Date();
  const last = windowNights[windowNights.length - 1] ?? first;
  const count =
    (last.getFullYear() - first.getFullYear()) * 12 + (last.getMonth() - first.getMonth()) + 1;

  return {
    year: first.getFullYear(),
    month: first.getMonth() + 1,
    count: Math.min(Math.max(count, 1), MAX_MONTHS),
  };
}

export async function airbnbStatusesForCabin(
  env: BookingWorkerEnv,
  cabinId: number,
  windowNights: Date[],
): Promise<Record<string, DayStatus> | null> {
  const listingId = parseAirbnbListingMap(env.AIRBNB_LISTING_MAP)[cabinId];
  if (!listingId || !env.AIRBNB_WEB_API_KEY?.trim() || windowNights.length === 0) {
    return null;
  }

  const span = monthSpan(windowNights);
  const calendar = await fetchAirbnbCalendar(listingId, span.year, span.month, span.count, env);
  return mapAirbnbDaysToStatuses(calendar, windowNights);
}

export async function buildAirbnbPreviewCabins(
  env: BookingWorkerEnv,
  windowNights: Date[],
  arrival: string,
  departure: string,
  origin: string,
): Promise<CabinAvailability[]> {
  const listings = parseAirbnbListingMap(env.AIRBNB_LISTING_MAP);
  const span = monthSpan(windowNights);

  return Promise.all(
    CABIN_CONFIG.cabins.map(async (cabin) => {
      const bookingUrl = `${origin}/cabins/${cabin.slug}`;
      const listingId = listings[cabin.id];
      if (!listingId) {
        return previewCabin(cabin.id, bookingUrl, unknownDays(windowNights), false, 'unconfigured');
      }

      try {
        const calendar = await fetchAirbnbCalendar(listingId, span.year, span.month, span.count, env);
        const days = mapAirbnbDaysToStatuses(calendar, windowNights);
        return previewCabin(cabin.id, bookingUrl, days, isStayAvailable(days, arrival, departure), 'ok');
      } catch (error) {
        console.error('airbnb_preview_failed', {
          cabinId: cabin.id,
          message: error instanceof Error ? error.message : String(error),
        });
        return previewCabin(cabin.id, bookingUrl, unknownDays(windowNights), false, 'error');
      }
    }),
  );
}

function unknownDays(windowNights: Date[]): Record<string, DayStatus> {
  return mapAirbnbDaysToStatuses([], windowNights);
}

function previewCabin(
  cabinId: number,
  bookingUrl: string,
  days: Record<string, DayStatus>,
  available: boolean,
  availabilityState: AvailabilityState,
): CabinAvailability {
  return {
    cabinId,
    nightlyRate: 0,
    totalPrice: 0,
    currency: 'USD',
    available,
    days,
    dayRates: {},
    cleaningFee: 0,
    availabilityState,
    bookingUrl,
  };
}
