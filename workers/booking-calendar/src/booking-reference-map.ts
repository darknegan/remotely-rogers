import { BookingStateKvEnv } from './booking-state-store';

const BOOKING_ID_PREFIX = 'booking:id:';
const UUID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export async function seedBookingIdReferenceMapping(
  env: BookingStateKvEnv,
  bookingId: string,
  reference: string,
): Promise<void> {
  if (!env.BOOKING_STATE || !UUID.test(bookingId) || !reference.trim()) {
    return;
  }

  await env.BOOKING_STATE.put(`${BOOKING_ID_PREFIX}${bookingId}`, reference.trim(), {
    expirationTtl: 60 * 60 * 24 * 90,
  });
}

export async function lookupReferenceByBookingId(
  env: BookingStateKvEnv,
  bookingId: string,
): Promise<string | null> {
  if (!env.BOOKING_STATE || !UUID.test(bookingId)) {
    return null;
  }

  return (await env.BOOKING_STATE.get(`${BOOKING_ID_PREFIX}${bookingId}`)) ?? null;
}

/**
 * Resolve guest-safe booking reference from webhook payload.new using OpenAPI row shapes:
 * - payments: reference + booking_id
 * - calendar_events: booking_id (no reference column)
 */
export async function resolveWebhookBookingReference(
  env: BookingStateKvEnv,
  eventType: string,
  payloadNew: Record<string, unknown> | undefined,
): Promise<string | null> {
  if (!payloadNew) {
    return null;
  }

  const direct = payloadNew['reference'];
  if (typeof direct === 'string' && direct.trim()) {
    return direct.trim();
  }

  const bookingId = payloadNew['booking_id'];
  if (typeof bookingId === 'string' && UUID.test(bookingId)) {
    const mapped = await lookupReferenceByBookingId(env, bookingId);
    if (mapped) {
      return mapped;
    }

    // payments.paid rows include reference; calendar_events do not — mapping is required there.
    if (eventType.startsWith('calendar_events.')) {
      return null;
    }
  }

  return null;
}
