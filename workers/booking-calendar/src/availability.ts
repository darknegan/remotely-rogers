import { CABIN_CONFIG } from '../../../src/environments/cabin-config';
import {
  AvailabilityState,
  CabinAvailability,
} from '../../../src/app/core/models/booking.models';
import { addDays, eachNight, parseDateKey, toDateKey } from '../../../src/app/core/utils/date-utils';
import {
  allowlistedProductIds,
  BookingWorkerEnv,
  hasBookingmoodApiKey,
  occupancyForAdults,
  resolveCabinProducts,
} from './booking-config';
import { BookingmoodClient } from './bookingmood-client';
import {
  isStayAvailable,
  mapAvailabilityRowsToDays,
} from './bookingmood-interval-map';
import { mapPublicProducts } from './public-product-dto';

export interface AvailabilityRequest {
  arrival: string;
  departure: string;
  adults: number;
}

const PRODUCT_SELECT =
  'id,name,description,timezone,currency,images,rent_pricing_definition,deposit,fee';

export async function buildAvailabilityResponse(
  request: AvailabilityRequest,
  client: BookingmoodClient,
  env: BookingWorkerEnv,
  origin: string,
): Promise<{ cabins: CabinAvailability[]; bookingEnabled: boolean }> {
  const arrival = parseDateKey(request.arrival);
  const departure = parseDateKey(request.departure);
  const nights = eachNight(arrival, departure);
  const windowStart = addDays(arrival, -2);
  const windowEnd = addDays(departure, 2);
  const windowNights = eachNight(windowStart, windowEnd);

  const products = resolveCabinProducts(env);
  const allowlisted = allowlistedProductIds(env);

  if (!hasBookingmoodApiKey(env) || allowlisted.length === 0) {
    return {
      bookingEnabled: false,
      cabins: products.map((cabin) =>
        unavailableCabin(cabin.cabinId, windowNights, origin, cabin.slug, 'unconfigured'),
      ),
    };
  }

  let rows: Awaited<ReturnType<BookingmoodClient['getAvailability']>> = [];
  let availabilityError = false;

  try {
    rows = await client.getAvailability({ productIds: allowlisted, performSync: false });
  } catch (error) {
    availabilityError = true;
    console.error('bookingmood_availability_failed', {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  let searchResults: Awaited<ReturnType<BookingmoodClient['search']>> = [];
  if (nights.length > 0 && !availabilityError) {
    try {
      searchResults = await client.search({
        interval: { start: toDateKey(arrival), end: toDateKey(departure) },
        productIds: allowlisted,
        occupancy: occupancyForAdults(env, request.adults),
      });
    } catch (error) {
      console.error('bookingmood_search_failed', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const cabins = products.map((cabin) => {
    if (!cabin.productId) {
      return unavailableCabin(cabin.cabinId, windowNights, origin, cabin.slug, 'unconfigured');
    }

    if (availabilityError) {
      return unavailableCabin(cabin.cabinId, windowNights, origin, cabin.slug, 'error');
    }

    const days = mapAvailabilityRowsToDays(rows, cabin.productId, windowNights);
    const stayAvailable = isStayAvailable(days, request.arrival, request.departure);
    const search = searchResults.find((item) => item.productId === cabin.productId);
    const currency = 'USD';
    let totalPrice = 0;
    let nightlyRate = 0;

    if (search?.price && nights.length > 0) {
      totalPrice = (search.price.min + search.price.max) / 2 / 100;
      nightlyRate = totalPrice / nights.length;
    }

    return {
      cabinId: cabin.cabinId,
      nightlyRate,
      totalPrice,
      currency,
      available: stayAvailable,
      days,
      dayRates: {},
      cleaningFee: 0,
      availabilityState: 'ok' satisfies AvailabilityState,
      bookingUrl: `${origin}/cabins/${cabin.slug}`,
    } satisfies CabinAvailability;
  });

  return {
    cabins,
    bookingEnabled: allowlisted.length > 0 && hasBookingmoodApiKey(env),
  };
}

function unavailableCabin(
  cabinId: number,
  windowNights: Date[],
  origin: string,
  slug: string,
  state: AvailabilityState,
): CabinAvailability {
  const days: CabinAvailability['days'] = {};
  for (const night of windowNights) {
    days[toDateKey(night)] = 'unknown';
  }

  return {
    cabinId,
    nightlyRate: 0,
    totalPrice: 0,
    currency: 'USD',
    available: false,
    days,
    dayRates: {},
    cleaningFee: 0,
    availabilityState: state,
    bookingUrl: `${origin}/cabins/${slug}`,
  };
}

export async function isCabinRangeAvailable(
  client: BookingmoodClient,
  env: BookingWorkerEnv,
  cabinId: number,
  arrival: string,
  departure: string,
): Promise<boolean> {
  const productId = resolveCabinProducts(env).find((c) => c.cabinId === cabinId)?.productId;
  if (!productId) {
    return false;
  }

  const rows = await client.getAvailability({ productIds: [productId], performSync: false });
  const nights = eachNight(parseDateKey(arrival), parseDateKey(departure));
  const days = mapAvailabilityRowsToDays(rows, productId, nights);
  return isStayAvailable(days, arrival, departure);
}


export async function listPublicProducts(
  client: BookingmoodClient,
  env: BookingWorkerEnv,
) {
  const ids = allowlistedProductIds(env);
  if (ids.length === 0) {
    return [];
  }

  const rows = await client.listProducts(PRODUCT_SELECT, ids);
  return mapPublicProducts(rows);
}

export function cabinCatalogMeta(): typeof CABIN_CONFIG {
  return CABIN_CONFIG;
}
