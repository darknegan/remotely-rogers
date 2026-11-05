import { addDays, parseDateKey, toDateKey } from '../../../src/app/core/utils/date-utils';
import { DayStatus } from '../../../src/app/core/models/booking.models';
import { BookingmoodAvailabilityRow, BookingmoodIntervalStatus } from './bookingmood-client';

/** Map Bookingmood interval status to calendar day status. Pending blocks selection. */
export function mapIntervalStatus(status: BookingmoodIntervalStatus): DayStatus {
  switch (status) {
    case 'available':
      return 'available';
    case 'booked':
      return 'booked';
    case 'closed':
      return 'closed';
    case 'pending':
      return 'pending';
    case 'unavailable':
    default:
      return 'blocked';
  }
}

/** Parse `YYYY-MM-DDTHH:mm` (or date-only) to a local date key. */
export function dateKeyFromBookingmoodInstant(value: string): string {
  const datePart = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  return toDateKey(parseDateKey(datePart));
}

/**
 * Paint calendar nights from Bookingmood intervals.
 * Nights use [arrival, departure) semantics (departure exclusive).
 */
export function mapAvailabilityRowsToDays(
  rows: BookingmoodAvailabilityRow[],
  productId: string,
  windowNights: Date[],
): Record<string, DayStatus> {
  const days: Record<string, DayStatus> = {};
  for (const night of windowNights) {
    days[toDateKey(night)] = 'unknown';
  }

  const row = rows.find((item) => item.product_id === productId);
  if (!row) {
    return days;
  }

  for (const interval of row.intervals) {
    const status = mapIntervalStatus(interval.status);
    const startKey = dateKeyFromBookingmoodInstant(interval.start);
    const endKey = dateKeyFromBookingmoodInstant(interval.end);
    const start = parseDateKey(startKey);
    const end = parseDateKey(endKey);

    for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) {
      const key = toDateKey(cursor);
      if (!(key in days)) {
        continue;
      }

      days[key] = mergeDayStatus(days[key], status);
    }
  }

  return days;
}

function mergeDayStatus(current: DayStatus, incoming: DayStatus): DayStatus {
  if (current === 'unknown') {
    return incoming;
  }

  if (current === 'available') {
    return incoming === 'available' ? 'available' : incoming;
  }

  const priority: Record<DayStatus, number> = {
    available: 0,
    closed: 1,
    pending: 2,
    booked: 3,
    blocked: 4,
    unknown: 5,
  };

  return priority[incoming] >= priority[current] ? incoming : current;
}

export function isStayAvailable(
  days: Record<string, DayStatus>,
  arrival: string,
  departure: string,
): boolean {
  const nights = eachNightKeys(arrival, departure);
  return nights.length > 0 && nights.every((key) => days[key] === 'available');
}

function eachNightKeys(arrival: string, departure: string): string[] {
  const start = parseDateKey(arrival);
  const end = parseDateKey(departure);
  const keys: string[] = [];
  for (let cursor = start; cursor < end; cursor = addDays(cursor, 1)) {
    keys.push(toDateKey(cursor));
  }
  return keys;
}
