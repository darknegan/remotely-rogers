import { DayStatus } from '../../core/models/booking.models';
import { addDays, eachNight, formatShortDate, startOfDay, toDateKey } from '../../core/utils/date-utils';

export interface OpenStayWindow {
  arrival: Date;
  departure: Date;
}

/** First consecutive available stay of at least `minNights` on or after `afterDate`. */
export function findNextOpenStay(
  days: Record<string, DayStatus>,
  afterDate: Date,
  minNights: number,
): OpenStayWindow | null {
  const start = startOfDay(afterDate);
  const maxOffset = 120;

  for (let offset = 0; offset < maxOffset; offset++) {
    const arrival = addDays(start, offset);
    const departure = addDays(arrival, minNights);
    const stayNights = eachNight(arrival, departure);

    if (stayNights.length < minNights) {
      continue;
    }

    if (stayNights.every((night) => days[toDateKey(night)] === 'available')) {
      return { arrival, departure };
    }
  }

  return null;
}

export function formatNextOpenLabel(window: OpenStayWindow): string {
  const lastNight = addDays(window.departure, -1);

  if (toDateKey(window.arrival) === toDateKey(lastNight)) {
    return `Open from ${formatShortDate(window.arrival)}`;
  }

  return `Open ${formatShortDate(window.arrival)} – ${formatShortDate(lastNight)}`;
}
