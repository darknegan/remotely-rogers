import { CabinCheckoutResult } from '../../../src/app/core/models/booking.models';
import { eachNight, parseDateKey, toDateKey } from '../../../src/app/core/utils/date-utils';

export interface CheckoutCabinLine {
  cabinId: number;
  arrival: string;
  departure: string;
}

export function shortCabinName(name: string): string {
  return name.split('-')[0]?.trim() || name;
}

export function formatStayLabel(arrival: string, departure: string): string {
  const start = parseDateKey(arrival);
  const end = parseDateKey(departure);
  const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${monthDay.format(start)}–${end.getDate()}`;
  }

  return `${monthDay.format(start)}–${monthDay.format(end)}`;
}

export function formatCabinCsv(cabins: CheckoutCabinLine[]): string {
  return cabins.map((cabin) => `${cabin.cabinId}:${cabin.arrival}:${cabin.departure}`).join(',');
}

export function parseCabinCsv(value: string): CheckoutCabinLine[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [cabinId, arrival, departure] = part.split(':');
      return {
        cabinId: Number(cabinId),
        arrival,
        departure,
      };
    })
    .filter((line) => Number.isFinite(line.cabinId) && line.arrival && line.departure);
}

export function formatLodgifyResults(results: CabinCheckoutResult[]): string {
  return results
    .map((result) =>
      result.ok ? `${result.cabinId}:ok:${result.bookingId ?? ''}` : `${result.cabinId}:fail`,
    )
    .join(',');
}

export function parseLodgifyResults(value: string): CabinCheckoutResult[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [cabinId, status, bookingId] = part.split(':');
      const id = Number(cabinId);
      if (status === 'ok') {
        const parsedId = Number(bookingId);
        return {
          cabinId: id,
          ok: true,
          bookingId: Number.isFinite(parsedId) ? parsedId : undefined,
        };
      }

      return { cabinId: id, ok: false, error: 'Reservation was not created.' };
    });
}

export function quoteStayCents(
  dayRates: Record<string, { price: number }>,
  cleaningFee: number,
  arrival: string,
  departure: string,
): number | null {
  const nights = eachNight(parseDateKey(arrival), parseDateKey(departure));
  if (nights.length === 0) {
    return null;
  }

  let sum = 0;
  for (const night of nights) {
    const price = dayRates[toDateKey(night)]?.price;
    if (price == null) {
      return null;
    }
    sum += price;
  }

  return Math.round((sum + cleaningFee) * 100);
}

export function truncateMeta(value: string, max = 500): string {
  return value.length <= max ? value : value.slice(0, max);
}
