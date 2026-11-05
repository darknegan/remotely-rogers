/** KV-backed webhook dedupe + public-safe booking reference status (no guest secrets). */

export interface PublicBookingStatus {
  reference: string;
  paymentRecorded: boolean;
  bookingConfirmed: boolean;
  cancelled: boolean;
  updatedAt: string;
}

const WEBHOOK_TTL_SECONDS = 60 * 60 * 24 * 30;
const STATUS_TTL_SECONDS = 60 * 60 * 24 * 90;

export interface BookingStateKvEnv {
  BOOKING_STATE?: KVNamespace;
}

export function hasBookingStateKv(env: BookingStateKvEnv): boolean {
  return !!env.BOOKING_STATE;
}

export async function isWebhookEventProcessed(
  env: BookingStateKvEnv,
  eventId: string,
): Promise<boolean> {
  if (!env.BOOKING_STATE) {
    return false;
  }

  const hit = await env.BOOKING_STATE.get(`webhook:event:${eventId}`);
  return hit != null;
}

export async function markWebhookEventProcessed(
  env: BookingStateKvEnv,
  eventId: string,
): Promise<void> {
  if (!env.BOOKING_STATE) {
    throw new Error('BOOKING_STATE KV binding is not configured.');
  }

  await env.BOOKING_STATE.put(`webhook:event:${eventId}`, '1', {
    expirationTtl: WEBHOOK_TTL_SECONDS,
  });
}

export async function getPublicBookingStatus(
  env: BookingStateKvEnv,
  reference: string,
): Promise<PublicBookingStatus | null> {
  if (!env.BOOKING_STATE || !reference.trim()) {
    return null;
  }

  const raw = await env.BOOKING_STATE.get(`booking:ref:${reference.trim()}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PublicBookingStatus;
  } catch {
    return null;
  }
}

export async function mergePublicBookingStatus(
  env: BookingStateKvEnv,
  reference: string,
  patch: Partial<Omit<PublicBookingStatus, 'reference' | 'updatedAt'>>,
): Promise<PublicBookingStatus> {
  if (!env.BOOKING_STATE) {
    throw new Error('BOOKING_STATE KV binding is not configured.');
  }

  const key = reference.trim();
  const existing =
    (await getPublicBookingStatus(env, key)) ??
    ({
      reference: key,
      paymentRecorded: false,
      bookingConfirmed: false,
      cancelled: false,
      updatedAt: new Date(0).toISOString(),
    } satisfies PublicBookingStatus);

  const next: PublicBookingStatus = {
    reference: key,
    paymentRecorded: patch.paymentRecorded ?? existing.paymentRecorded,
    bookingConfirmed: patch.bookingConfirmed ?? existing.bookingConfirmed,
    cancelled: patch.cancelled ?? existing.cancelled,
    updatedAt: new Date().toISOString(),
  };

  await env.BOOKING_STATE.put(`booking:ref:${key}`, JSON.stringify(next), {
    expirationTtl: STATUS_TTL_SECONDS,
  });

  return next;
}

/** Initial status when checkout creates a booking reference (not paid/confirmed). */
export async function seedCheckoutReferenceStatus(
  env: BookingStateKvEnv,
  reference: string,
): Promise<void> {
  if (!env.BOOKING_STATE || !reference.trim()) {
    return;
  }

  const key = reference.trim();
  const existing = await getPublicBookingStatus(env, key);
  if (existing) {
    return;
  }

  await env.BOOKING_STATE.put(
    `booking:ref:${key}`,
    JSON.stringify({
      reference: key,
      paymentRecorded: false,
      bookingConfirmed: false,
      cancelled: false,
      updatedAt: new Date().toISOString(),
    } satisfies PublicBookingStatus),
    { expirationTtl: STATUS_TTL_SECONDS },
  );
}
