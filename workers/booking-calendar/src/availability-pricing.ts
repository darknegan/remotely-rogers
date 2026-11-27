import { CabinAvailability } from '../../../src/app/core/models/booking.models';
import { eachNight, parseDateKey, toDateKey } from '../../../src/app/core/utils/date-utils';
import {
  buildGuestFormValues,
  BookingWorkerEnv,
  parseGuestFormServices,
} from './booking-config';
import { BookingmoodClient } from './bookingmood-client';
import { BookingmoodSearchResult } from './bookingmood-client';
import { stayTotalDollarsFromSearch } from './bookingmood-search';

export interface CabinQuoteTarget {
  cabinId: number;
  productId: string;
}

export function applySearchPricing(
  search: BookingmoodSearchResult | undefined,
  arrival: Date,
  departure: Date,
): Pick<CabinAvailability, 'nightlyRate' | 'totalPrice' | 'dayRates'> {
  const nights = eachNight(arrival, departure);
  const priced = stayTotalDollarsFromSearch(search, nights.length);
  if (!priced) {
    return { nightlyRate: 0, totalPrice: 0, dayRates: {} };
  }

  const dayRates: CabinAvailability['dayRates'] = {};
  for (const night of nights) {
    dayRates[toDateKey(night)] = { price: priced.nightlyRate };
  }

  return {
    nightlyRate: priced.nightlyRate,
    totalPrice: priced.totalPrice,
    dayRates,
  };
}

export async function quoteStaySubtotalsViaCartValidate(
  client: BookingmoodClient,
  env: BookingWorkerEnv,
  arrival: string,
  departure: string,
  occupancy: Record<string, number>,
  lines: CabinQuoteTarget[],
): Promise<Map<number, number>> {
  if (lines.length === 0 || Object.keys(occupancy).length === 0) {
    return new Map();
  }

  const formValues = buildGuestFormValues(parseGuestFormServices(env.BOOKINGMOOD_FORM_SERVICES), {
    firstName: 'Quote',
    lastName: 'Preview',
    email: 'quote-preview@invalid.remotelyrogers.com',
  });

  const items = lines.map((line) => ({
    id: `quote-${line.cabinId}`,
    product_id: line.productId,
    interval: { start: arrival, end: departure },
    occupancy,
    form_values: formValues,
  }));

  try {
    const validated = await client.cartValidate({ items });
    const map = new Map<number, number>();
    for (const row of validated) {
      const subtotal = row.price?.subtotal;
      if (typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal <= 0) {
        continue;
      }
      const cabinId = Number(String(row.id).replace(/^quote-/, ''));
      if (Number.isFinite(cabinId)) {
        map.set(cabinId, subtotal);
      }
    }
    return map;
  } catch (error) {
    console.error('bookingmood_quote_validate_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Map();
  }
}

export function applySubtotalCentsPricing(
  subtotalCents: number,
  arrival: string,
  departure: string,
): Pick<CabinAvailability, 'nightlyRate' | 'totalPrice' | 'dayRates'> {
  const nights = eachNight(parseDateKey(arrival), parseDateKey(departure));
  if (nights.length === 0 || subtotalCents <= 0) {
    return { nightlyRate: 0, totalPrice: 0, dayRates: {} };
  }

  const totalPrice = subtotalCents / 100;
  const nightlyRate = totalPrice / nights.length;
  const dayRates: CabinAvailability['dayRates'] = {};
  for (const night of nights) {
    dayRates[toDateKey(night)] = { price: nightlyRate };
  }

  return {
    nightlyRate,
    totalPrice,
    dayRates,
  };
}