import { addDays, dateKeyFromIso, parseDateKey, toDateKey } from '../../../src/app/core/utils/date-utils';
import { DayStatus } from '../../../src/app/core/models/booking.models';

export interface AvailabilityPeriod {
  start: string;
  end: string;
  available: number;
  closed_period?: unknown;
  bookings?: unknown[];
}

export function eachInclusiveDate(startKey: string, endKey: string): string[] {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  const keys: string[] = [];
  let current = start;

  while (current <= end) {
    keys.push(toDateKey(current));
    current = addDays(current, 1);
  }

  return keys;
}

export function statusForPeriod(period: AvailabilityPeriod): DayStatus {
  if (period.available === 1) {
    return 'available';
  }

  if (Array.isArray(period.bookings) && period.bookings.length > 0) {
    return 'booked';
  }

  return 'blocked';
}

export function mapPeriodsToDays(
  periods: AvailabilityPeriod[],
  windowNights: Date[],
): Record<string, DayStatus> {
  const days: Record<string, DayStatus> = {};

  for (const night of windowNights) {
    days[toDateKey(night)] = 'blocked';
  }

  for (const period of periods) {
    const start = dateKeyFromIso(period.start);
    const end = dateKeyFromIso(period.end);
    if (start.startsWith('0001-') || end.startsWith('0001-')) {
      continue;
    }

    const status = statusForPeriod(period);

    for (const key of eachInclusiveDate(start, end)) {
      if (key in days) {
        days[key] = status;
      }
    }
  }

  return days;
}

export function normalizeAvailabilityPeriods(payload: unknown): AvailabilityPeriod[] {
  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return [];
    }

    const first = payload[0] as Record<string, unknown>;
    if (first && Array.isArray(first['periods'])) {
      return payload.flatMap((item) => {
        const record = item as { periods?: AvailabilityPeriod[] };
        return record.periods ?? [];
      });
    }

    if (first && typeof first['start'] === 'string') {
      return payload as AvailabilityPeriod[];
    }
  }

  if (payload && typeof payload === 'object' && Array.isArray((payload as { periods?: unknown }).periods)) {
    return (payload as { periods: AvailabilityPeriod[] }).periods;
  }

  return [];
}
