import {
  BookingmoodChannelEvent,
  BookingmoodPriceCalendarEntry,
  CalendarDayKind,
} from './bookingmood-channel.types';
import { addDays, startOfDay, toDateKey } from '../../utils/date-utils';

export interface StayRange {
  checkIn: Date;
  checkOut: Date;
}

/** F-07c mock 03 — reserved / unavailable nights inside a picked range. */
export const RESERVED_STAY_RANGE_NOTICE =
  'Those dates include reserved or unavailable nights. Pick a different check-in and check-out.';

export function productLabel(name: { default?: string } | string): string {
  if (typeof name === 'string') {
    return name;
  }
  return name.default ?? '';
}

export function buildDayKinds(
  events: BookingmoodChannelEvent[] | undefined,
  calendarEntries: BookingmoodPriceCalendarEntry[] | undefined,
  range: StayRange | null,
  visibleStart: Date,
  visibleEnd: Date,
): Record<string, CalendarDayKind> {
  const days: Record<string, CalendarDayKind> = {};
  const today = startOfDay(new Date());

  for (let cursor = startOfDay(visibleStart); cursor < visibleEnd; cursor = addDays(cursor, 1)) {
    const key = toDateKey(cursor);
    if (cursor < today) {
      days[key] = 'past';
      continue;
    }

    if (isReservedNight(cursor, events)) {
      days[key] = 'reserved';
      continue;
    }

    if (isClosedNight(cursor, calendarEntries)) {
      days[key] = 'closed';
      continue;
    }

    days[key] = 'available';
  }

  if (range) {
    const checkInKey = toDateKey(range.checkIn);
    const checkOutKey = toDateKey(range.checkOut);

    for (let cursor = startOfDay(range.checkIn); cursor < range.checkOut; cursor = addDays(cursor, 1)) {
      const key = toDateKey(cursor);
      if (!(key in days)) {
        continue;
      }
      const base = days[key];
      if (base === 'reserved' || base === 'closed' || base === 'past') {
        continue;
      }
      days[key] = key === checkInKey ? 'selected-endpoint' : 'in-stay';
    }

    const checkoutDay = startOfDay(range.checkOut);
    if (checkoutDay >= visibleStart && checkoutDay < visibleEnd) {
      const base = days[checkOutKey];
      if (base !== 'past' && base !== 'reserved' && base !== 'closed') {
        days[checkOutKey] = 'selected-endpoint';
      }
    }
  }

  return days;
}

export function isReservedNight(date: Date, events: BookingmoodChannelEvent[] | undefined): boolean {
  if (!events?.length) {
    return false;
  }

  const key = toDateKey(date);
  for (const event of events) {
    if (event.type !== 'booking') {
      continue;
    }
    const start = event.start_date;
    const end = event.end_date;
    if (key >= start && key < end) {
      return true;
    }
  }
  return false;
}

export function isClosedNight(date: Date, entries: BookingmoodPriceCalendarEntry[] | undefined): boolean {
  if (!entries?.length) {
    return false;
  }

  const weekday = date.getDay();
  const key = toDateKey(date);

  for (const entry of entries) {
    const checkIn = entry.check_in_days;
    if (checkIn && checkIn[weekday] === false) {
      return true;
    }
    if (entry.min_duration != null && entry.min_duration > 30) {
      continue;
    }
    if (!entry.rates?.length) {
      return true;
    }
    void key;
  }
  return false;
}

export function estimateCleaningCents(fee?: BookingmoodPriceCalendarEntry): number {
  void fee;
  return 0;
}

export function stayRangeIsBookable(
  checkIn: Date,
  checkOut: Date,
  events: BookingmoodChannelEvent[] | undefined,
  entries: BookingmoodPriceCalendarEntry[] | undefined,
): boolean {
  for (let cursor = startOfDay(checkIn); cursor < checkOut; cursor = addDays(cursor, 1)) {
    if (isReservedNight(cursor, events) || isClosedNight(cursor, entries)) {
      return false;
    }
  }
  return true;
}