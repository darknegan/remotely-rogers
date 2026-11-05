/** KV-backed webhook dedupe + booking_id → reference mapping (see booking-reference-map.ts). */

export interface BookingStateKvEnv {
  BOOKING_STATE?: KVNamespace;
}

export function hasBookingStateKv(env: BookingStateKvEnv): boolean {
  return !!env.BOOKING_STATE;
}

const WEBHOOK_TTL_SECONDS = 60 * 60 * 24 * 30;

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
