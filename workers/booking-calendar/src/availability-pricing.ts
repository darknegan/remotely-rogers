import { CabinAvailability } from '../../../src/app/core/models/booking.models';
import { eachNight, parseDateKey, toDateKey } from '../../../src/app/core/utils/date-utils';
import {
  buildGuestFormValues,
  BookingWorkerEnv,
  parseGuestFormServices,
} from './booking-config';
import { diagnoseCapacityGroupEnv } from './bookingmood-capacity-env';
import { readCartValidateItemId, readCartValidateSubtotalCents } from './bookingmood-cart-validate';
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
  if (lines.length === 0) {
    return new Map();
  }

  if (Object.keys(occupancy).length === 0) {
    console.info('bookingmood_quote_skipped_no_occupancy', {
      ...diagnoseCapacityGroupEnv(env.BOOKINGMOOD_CAPACITY_GROUP_ID),
      lineCount: lines.length,
    });
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
  const productIdByQuoteId = new Map(items.map((item) => [item.id, item.product_id]));

  try {
    const validated = await client.cartValidate({ items });
    const map = new Map<number, number>();
    for (const row of validated) {
      const subtotal = readCartValidateSubtotalCents(row);
      if (subtotal == null) {
        const itemId = readCartValidateItemId(row);
        const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : null;
        const priceField = record?.price;
        console.info('bookingmood_quote_no_subtotal', {
          productId: itemId ? (productIdByQuoteId.get(itemId) ?? null) : null,
          responseKeys: record ? Object.keys(record) : [],
          priceKeys:
            priceField && typeof priceField === 'object'
              ? Object.keys(priceField as Record<string, unknown>)
              : [],
        });
        continue;
      }
      const itemId = readCartValidateItemId(row);
      if (!itemId) {
        continue;
      }
      const cabinId = Number(itemId.replace(/^quote-/, ''));
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