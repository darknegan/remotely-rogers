import { CABIN_CONFIG } from '../../../src/environments/cabin-config';
import { CabinAvailability } from '../../../src/app/core/models/booking.models';
import { addDays, eachNight, parseDateKey, toDateKey } from '../../../src/app/core/utils/date-utils';
import { mapPeriodsToDays, normalizeAvailabilityPeriods } from './availability-map';
import { LodgifyClient } from './lodgify';

const SITE_BASE_URL = 'https://remotelyrogers.com';

export interface AvailabilityRequest {
  arrival: string;
  departure: string;
  adults: number;
}

export async function buildAvailabilityResponse(
  request: AvailabilityRequest,
  client: LodgifyClient,
): Promise<{ cabins: CabinAvailability[] }> {
  const arrival = parseDateKey(request.arrival);
  const departure = parseDateKey(request.departure);
  const nights = eachNight(arrival, departure);
  const windowStart = addDays(arrival, -2);
  const windowEnd = addDays(departure, 2);
  const windowNights = eachNight(windowStart, windowEnd);

  const cabins = await Promise.all(
    CABIN_CONFIG.cabins.map(async (cabin) => {
      let days: CabinAvailability['days'] = {};
      for (const night of windowNights) {
        days[toDateKey(night)] = 'blocked';
      }

      try {
        const payload = await client.getAvailability(
          cabin.lodgifyPropertyId,
          toDateKey(windowStart),
          toDateKey(windowEnd),
        );
        days = mapPeriodsToDays(normalizeAvailabilityPeriods(payload), windowNights);
      } catch (error) {
        // Keep blocked defaults when Lodgify availability fails for one cabin.
        console.error('lodgify_availability_failed', {
          propertyId: cabin.lodgifyPropertyId,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      const stayAvailable =
        nights.length > 0 && nights.every((night) => days[toDateKey(night)] === 'available');

      let dayRates: CabinAvailability['dayRates'] = {};
      let cleaningFee = 0;
      let nightlyRate = 0;
      let totalPrice = 0;
      let currency = 'USD';

      try {
        const rates = await client.getRatesCalendar(
          cabin.lodgifyPropertyId,
          cabin.lodgifyRoomTypeId,
          toDateKey(windowStart),
          toDateKey(windowEnd),
        );
        if (rates) {
          dayRates = rates.dayRates;
          cleaningFee = rates.cleaningFee;
          currency = rates.currency;

          const windowPrices = windowNights
            .map((night) => dayRates[toDateKey(night)]?.price)
            .filter((price): price is number => price != null);
          nightlyRate =
            windowPrices.length > 0
              ? windowPrices.reduce((sum, price) => sum + price, 0) / windowPrices.length
              : 0;

          const stayPrices = nights
            .map((night) => dayRates[toDateKey(night)]?.price)
            .filter((price): price is number => price != null);
          totalPrice =
            stayPrices.reduce((sum, price) => sum + price, 0) + cleaningFee;
        }
      } catch (error) {
        // Price is optional; day statuses still render.
        console.error('lodgify_rates_failed', {
          propertyId: cabin.lodgifyPropertyId,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      return {
        cabinId: cabin.id,
        nightlyRate,
        totalPrice,
        currency,
        available: stayAvailable,
        days,
        dayRates,
        cleaningFee,
        bookingUrl: `${SITE_BASE_URL}/en/${cabin.slug}/`,
      } satisfies CabinAvailability;
    }),
  );

  return { cabins };
}

export async function isCabinRangeAvailable(
  client: LodgifyClient,
  propertyId: number,
  arrival: string,
  departure: string,
): Promise<boolean> {
  const nights = eachNight(parseDateKey(arrival), parseDateKey(departure));
  if (nights.length === 0) {
    return false;
  }

  const payload = await client.getAvailability(propertyId, arrival, departure);
  const days = mapPeriodsToDays(normalizeAvailabilityPeriods(payload), nights);
  return nights.every((night) => days[toDateKey(night)] === 'available');
}
