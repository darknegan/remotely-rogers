import { GroupCheckoutRequest } from '../../../src/app/core/models/booking.models';
import { CABIN_CONFIG } from '../../../src/environments/cabin-config';
import {
  buildGuestFormValues,
  isBookingWriteEnabled,
  occupancyForAdults,
  parseGuestFormServices,
  productIdForCabin,
  BookingWorkerEnv,
} from './booking-config';
import { BookingmoodClient, HttpError } from './bookingmood-client';
import { isCabinRangeAvailable } from './availability';
import { shortCabinName } from './checkout-format';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export interface BookingCheckoutResponse {
  paymentUrl: string | null;
  reference: string;
  bookingId: string;
}

export async function createBookingCheckout(
  request: GroupCheckoutRequest,
  client: BookingmoodClient,
  env: BookingWorkerEnv,
  origin: string,
  idempotencyKey?: string,
): Promise<BookingCheckoutResponse> {
  if (!isBookingWriteEnabled(env)) {
    throw new HttpError(
      503,
      'Booking checkout is disabled until BOOKINGMOOD_API_KEY, product map, capacity group, and form services are configured.',
    );
  }

  if (idempotencyKey) {
    const cached = await readIdempotentCheckout(idempotencyKey);
    if (cached) {
      return cached;
    }
  }

  const guest = request.guest;
  const firstName = guest?.firstName?.trim() ?? '';
  const lastName = guest?.lastName?.trim() ?? '';
  const email = guest?.email?.trim() ?? '';
  const phone = guest?.phone?.trim() ?? '';
  const notes = guest?.notes?.trim() ?? '';
  const adults = Math.max(1, request.adults || 1);
  const cabins = Array.isArray(request.cabins) ? request.cabins : [];

  if (!firstName || !lastName || !email) {
    throw new HttpError(400, 'First name, last name, and email are required.');
  }

  if (cabins.length === 0) {
    throw new HttpError(400, 'Select at least one cabin.');
  }

  const services = parseGuestFormServices(env.BOOKINGMOOD_FORM_SERVICES);
  const formTemplate = buildGuestFormValues(services, {
    firstName,
    lastName,
    email,
    phone,
    notes,
  });
  const occupancy = occupancyForAdults(env, adults);

  const items: Array<{
    id: string;
    product_id: string;
    interval: { start: string; end: string };
    occupancy: Record<string, number>;
    form_values: Record<string, string>;
  }> = [];

  const unavailable: string[] = [];

  for (const line of cabins) {
    const cabin = CABIN_CONFIG.cabins.find((item) => item.id === line.cabinId);
    if (!cabin) {
      throw new HttpError(400, `Unknown cabin ${line.cabinId}.`);
    }

    if (!DATE_KEY.test(line.arrival) || !DATE_KEY.test(line.departure)) {
      throw new HttpError(400, 'Arrival and departure must be YYYY-MM-DD.');
    }

    const productId = productIdForCabin(env, line.cabinId);
    if (!productId) {
      throw new HttpError(400, `${shortCabinName(cabin.name)} is not mapped to a Bookingmood product.`);
    }

    const open = await isCabinRangeAvailable(client, env, line.cabinId, line.arrival, line.departure);
    if (!open) {
      unavailable.push(shortCabinName(cabin.name));
      continue;
    }

    items.push({
      id: `cabin-${line.cabinId}`,
      product_id: productId,
      interval: { start: line.arrival, end: line.departure },
      occupancy,
      form_values: { ...formTemplate },
    });
  }

  if (unavailable.length > 0) {
    throw new HttpError(
      409,
      `Some cabins are no longer available: ${unavailable.join(', ')}.`,
    );
  }

  const validated = await client.cartValidate({ items });
  const invalid = validated.filter((item) => !item.valid || !item.availabilityMatch || !item.occupancyMatch);
  if (invalid.length > 0) {
    throw new HttpError(409, 'Your cart is no longer valid. Refresh availability and try again.');
  }

  const confirmation = await client.cartCheckout({ items });
  const result: BookingCheckoutResponse = {
    paymentUrl: confirmation.payment_url?.trim() || null,
    reference: confirmation.reference,
    bookingId: confirmation.booking_id,
  };

  if (idempotencyKey) {
    await storeIdempotentCheckout(idempotencyKey, result);
  }

  if (!result.paymentUrl) {
    // Bookingmood may return an empty payment_url for zero-balance or provider-managed flows.
    console.info('bookingmood_checkout_no_payment_url', {
      reference: result.reference,
      origin,
    });
  }

  return result;
}

async function readIdempotentCheckout(key: string): Promise<BookingCheckoutResponse | null> {
  const cache = caches.default;
  const hit = await cache.match(idempotencyCacheRequest(key));
  if (!hit) {
    return null;
  }

  try {
    return (await hit.json()) as BookingCheckoutResponse;
  } catch {
    return null;
  }
}

async function storeIdempotentCheckout(key: string, value: BookingCheckoutResponse): Promise<void> {
  const cache = caches.default;
  await cache.put(
    idempotencyCacheRequest(key),
    new Response(JSON.stringify(value), {
      headers: {
        'Cache-Control': 'max-age=86400',
        'Content-Type': 'application/json',
      },
    }),
  );
}

function idempotencyCacheRequest(key: string): Request {
  return new Request(`https://checkout-idempotency.internal/${encodeURIComponent(key)}`, {
    method: 'GET',
  });
}

export { HttpError };
