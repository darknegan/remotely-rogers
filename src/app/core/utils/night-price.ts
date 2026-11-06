import { CabinAvailability } from '../models/booking.models';
import { toDateKey } from './date-utils';

/**
 * Shown on available nights until Bookingmood returns a per-night price.
 * Temporary checkout rent on the cabins is $1 per night.
 */
export const PLACEHOLDER_NIGHTLY_RATE = 1;

/** Price to show for one night. Real rates win; available nights fall back to the placeholder. */
export function displayedNightPrice(
  quote: CabinAvailability | undefined,
  night: Date,
): number | undefined {
  const key = toDateKey(night);
  const exact = quote?.dayRates?.[key]?.price ?? 0;
  if (exact > 0) {
    return exact;
  }

  const nightly = quote?.nightlyRate ?? 0;
  if (nightly > 0) {
    return nightly;
  }

  if (quote?.days?.[key] === 'available') {
    return PLACEHOLDER_NIGHTLY_RATE;
  }

  return undefined;
}

/** Amount counted in the cart for a selected night. */
export function chargeNightPrice(quote: CabinAvailability | undefined, night: Date): number {
  return displayedNightPrice(quote, night) ?? PLACEHOLDER_NIGHTLY_RATE;
}
