import { DateRange } from '../models/booking.models';

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

export function dateKeyFromIso(value: string): string {
  return value.slice(0, 10);
}

export function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

export function differenceInCalendarDays(from: Date, to: Date): number {
  const msPerDay = 86_400_000;
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

export function eachNight(arrival: Date, departure: Date): Date[] {
  const nights: Date[] = [];
  let current = startOfDay(arrival);
  const end = startOfDay(departure);

  while (current < end) {
    nights.push(new Date(current));
    current = addDays(current, 1);
  }

  return nights;
}

export function nightCount(arrival: Date, departure: Date): number {
  return eachNight(arrival, departure).length;
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}

export function formatDateRangeLabel(arrival: Date, departure: Date): string {
  const lastNight = addDays(departure, -1);
  const nights = nightCount(arrival, departure);

  if (toDateKey(arrival) === toDateKey(lastNight)) {
    return `${formatShortDate(arrival)} (${nights} night${nights === 1 ? '' : 's'})`;
  }

  return `${formatShortDate(arrival)} – ${formatShortDate(lastNight)} (${nights} nights)`;
}

export function validateDateRange(
  arrival: Date | null,
  departure: Date | null,
  minNights: number,
): string | null {
  if (!arrival || !departure) {
    return 'Select check-in and check-out dates.';
  }

  const start = startOfDay(arrival);
  const end = startOfDay(departure);
  const today = startOfDay(new Date());

  if (start < today) {
    return 'Check-in cannot be in the past.';
  }

  if (end <= start) {
    return 'Check-out must be after check-in.';
  }

  if (nightCount(start, end) < minNights) {
    return `Minimum stay is ${minNights} nights.`;
  }

  return null;
}

export function toDateRange(arrival: Date, departure: Date): DateRange {
  return {
    arrival: startOfDay(arrival),
    departure: startOfDay(departure),
  };
}
