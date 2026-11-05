import { GroupCheckoutRequest } from '../../../src/app/core/models/booking.models';
import { CABIN_CONFIG } from '../../../src/environments/cabin-config';
import {
  claimCheckoutIdempotency,
  completeCheckoutIdempotency,
  indeterminateCheckoutIdempotency,
} from './booking-coordinator';
import {
  buildGuestFormValues,
  BookingWorkerEnv,
  hasDurableBookingStorage,
  isBookingWriteEnabled,
  occupancyForAdults,
  parseGuestFormServices,
  productIdForCabin,
} from './booking-config';
import { seedCheckoutReferenceStatus } from './booking-state-store';
import { assertCartItemsValid, assertCartValidateResponse } from './cart-validate';
import { checkoutRequestFingerprint, idempotencyScopeKey } from './checkout-fingerprint';
import { BookingmoodClient, HttpError } from './bookingmood-client';
import { isCabinRangeAvailable } from './availability';
import { sanitizePaymentUrl } from './payment-url';
import { shortCabinName } from './checkout-format';

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const UPSTREAM_TIMEOUT_MS = 25_000;

export interface BookingCheckoutResponse {
  paymentUrl: string | null;
  reference: string;
  bookingId: string;
  /** True when upstream outcome is unknown — do not retry automatically. */
  indeterminate?: boolean;
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
      'Booking checkout is disabled until Bookingmood API, product map, form services, BOOKING_STATE KV, and BOOKING_COORDINATOR are configured.',
    );
  }

  if (!hasDurableBookingStorage(env)) {
    throw new HttpError(
      503,
      'Booking checkout requires BOOKING_STATE KV and BOOKING_COORDINATOR durable object bindings.',
    );
  }

  const fingerprint = await checkoutRequestFingerprint(request);
  const scopeKey = idempotencyScopeKey(idempotencyKey, fingerprint);
  const claim = await claimCheckoutIdempotency(env, scopeKey, fingerprint);

  if (claim.status === 'completed' && claim.result) {
    return { ...claim.result, indeterminate: false };
  }

  if (claim.status === 'conflict') {
    throw new HttpError(409, 'Idempotency key does not match this checkout payload.');
  }

  if (claim.status === 'in_progress') {
    throw new HttpError(409, 'Checkout is already in progress for this idempotency scope.');
  }

  if (claim.status === 'indeterminate') {
    throw new HttpError(
      503,
      'A previous checkout attempt has an indeterminate outcome. Contact the host before retrying.',
    );
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

  const submittedIds = items.map((item) => item.id);

  try {
    const validatedRaw = await client.cartValidate({ items });
    const validated = assertCartValidateResponse(submittedIds, validatedRaw);
    assertCartItemsValid(validated);

    const confirmation = await withTimeout(
      client.cartCheckout({ items }),
      UPSTREAM_TIMEOUT_MS,
      'Bookingmood cart-checkout timed out.',
    );

    const result: BookingCheckoutResponse = {
      paymentUrl: sanitizePaymentUrl(confirmation.payment_url),
      reference: confirmation.reference,
      bookingId: confirmation.booking_id,
      indeterminate: false,
    };

    await seedCheckoutReferenceStatus(env, result.reference);
    await completeCheckoutIdempotency(env, scopeKey, fingerprint, result);

    if (!result.paymentUrl) {
      console.info('bookingmood_checkout_no_payment_url', {
        reference: result.reference,
        origin,
      });
    }

    return result;
  } catch (error) {
    if (error instanceof HttpError && error.status >= 500) {
      await indeterminateCheckoutIdempotency(env, scopeKey, fingerprint);
      throw new HttpError(
        503,
        'Checkout outcome is indeterminate after an upstream error. Do not retry automatically.',
      );
    }

    if (error instanceof Error && error.message.includes('timed out')) {
      await indeterminateCheckoutIdempotency(env, scopeKey, fingerprint);
      throw new HttpError(
        504,
        'Checkout outcome is indeterminate after a timeout. Do not retry automatically.',
      );
    }

    throw error;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export { HttpError };
