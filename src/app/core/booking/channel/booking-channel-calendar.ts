import {
  BookingmoodChannelEvent,
  BookingmoodPriceCalendarEntry,
  CalendarDayKind,
} from './bookingmood-channel.types';
import { DayStatus } from '../../models/booking.models';
import { addDays, eachNight, startOfDay, toDateKey } from '../../utils/date-utils';

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
      if (base !== 'past') {
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

export function stayRangeIsWorkerAvailable(
  checkIn: Date,
  checkOut: Date,
  days: Record<string, DayStatus> | undefined,
): boolean {
  if (!days) {
    return false;
  }

  return eachNight(checkIn, checkOut).every((night) => days[toDateKey(night)] === 'available');
}

/** Group calendar: mark a night reserved on the overlay only when every scoped cabin is blocked. */
export function mergeWorkerBlockedDays(
  cabinDayMaps: Array<Record<string, DayStatus> | undefined>,
): Record<string, DayStatus> | undefined {
  const maps = cabinDayMaps.filter((row): row is Record<string, DayStatus> => Boolean(row));
  if (maps.length === 0) {
    return undefined;
  }

  const keys = new Set<string>();
  for (const map of maps) {
    for (const key of Object.keys(map)) {
      keys.add(key);
    }
  }

  const merged: Record<string, DayStatus> = {};
  for (const key of keys) {
    const allBlocked = maps.every((map) => map[key] != null && map[key] !== 'available');
    merged[key] = allBlocked ? 'booked' : 'available';
  }
  return merged;
}

/** Merge per-product day maps: a night is blocked only when every product blocks it. */
export function mergeScopedCalendarDayKinds(
  kindMaps: Array<Record<string, CalendarDayKind>>,
): Record<string, CalendarDayKind> {
  if (kindMaps.length === 0) {
    return {};
  }
  if (kindMaps.length === 1) {
    return kindMaps[0]!;
  }

  const keys = new Set<string>();
  for (const map of kindMaps) {
    for (const key of Object.keys(map)) {
      keys.add(key);
    }
  }

  const merged: Record<string, CalendarDayKind> = {};
  for (const key of keys) {
    const kinds = kindMaps.map((map) => map[key]).filter((kind): kind is CalendarDayKind => kind != null);
    if (kinds.length === 0) {
      continue;
    }
    if (kinds.every((kind) => kind === 'past')) {
      merged[key] = 'past';
      continue;
    }
    const active = kinds.filter((kind) => kind !== 'past');
    if (active.every((kind) => kind === 'reserved' || kind === 'closed')) {
      merged[key] = active.some((kind) => kind === 'reserved') ? 'reserved' : 'closed';
      continue;
    }
    merged[key] = 'available';
  }
  return merged;
}

export function overlayWorkerDayStatuses(
  kinds: Record<string, CalendarDayKind>,
  days: Record<string, DayStatus> | undefined,
): Record<string, CalendarDayKind> {
  if (!days) {
    return kinds;
  }

  const next = { ...kinds };
  for (const [key, status] of Object.entries(days)) {
    if (status === 'available' || !(key in next) || next[key] === 'past') {
      continue;
    }
    next[key] = 'reserved';
  }
  return next;
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