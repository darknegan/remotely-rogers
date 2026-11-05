import { HttpError } from './bookingmood-client';
import { resolveWebhookBookingReference } from './booking-reference-map';
import {
  applyPublicBookingStatusPatch,
  type StatusPatch,
} from './booking-status-coordinator';
import {
  BookingStateKvEnv,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
} from './booking-state-store';
import { readRequestBodyUtf8 } from './webhook-body';

const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000;
const WEBHOOK_MAX_BODY_BYTES = 256 * 1024;

export interface BookingmoodWebhookEvent {
  id: string;
  date: number;
  event_type: string;
  payload: {
    new?: Record<string, unknown>;
    old?: Record<string, unknown>;
  };
}

export interface WebhookHandleResult {
  ok: boolean;
  duplicate?: boolean;
  ignored?: boolean;
  eventType?: string;
}

export type BookingmoodWebhookEnv = BookingStateKvEnv & {
  BOOKING_COORDINATOR?: DurableObjectNamespace;
};

const STATUS_EVENT_TYPES = new Set([
  'payments.paid',
  'calendar_events.confirmed',
  'calendar_events.cancelled',
]);

export async function handleBookingmoodWebhook(
  request: Request,
  signingSecret: string | undefined,
  env: BookingmoodWebhookEnv,
): Promise<WebhookHandleResult> {
  const secret = signingSecret?.trim();
  if (!secret) {
    throw new HttpError(503, 'BOOKINGMOOD_WEBHOOK_SIGNING_SECRET is not configured.');
  }

  if (!env.BOOKING_STATE) {
    throw new HttpError(503, 'BOOKING_STATE KV binding is not configured for webhook processing.');
  }

  const webhookId = request.headers.get('webhook-id') ?? '';
  const timestamp = request.headers.get('webhook-timestamp') ?? '';
  const signatureHeader = request.headers.get('webhook-signature') ?? '';
  const legacySignature = request.headers.get('X-Signature');

  const hasStandard = !!(webhookId && timestamp && signatureHeader);

  if (!hasStandard) {
    if (legacySignature) {
      throw new HttpError(
        400,
        'Legacy X-Signature alone is not supported. Configure Standard Webhooks headers.',
      );
    }
    throw new HttpError(400, 'Missing Standard Webhooks headers.');
  }

  const ageMs = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (!Number.isFinite(ageMs) || ageMs > WEBHOOK_MAX_AGE_MS) {
    throw new HttpError(400, 'Webhook timestamp is outside the allowed window.');
  }

  const rawBody = await readRequestBodyUtf8(request, WEBHOOK_MAX_BODY_BYTES);

  const valid = await verifyStandardWebhookSignature({
    secret,
    webhookId,
    timestamp,
    signatureHeader,
    rawBody,
  });

  if (!valid) {
    throw new HttpError(400, 'Invalid webhook signature.');
  }

  let event: BookingmoodWebhookEvent;
  try {
    event = JSON.parse(rawBody) as BookingmoodWebhookEvent;
  } catch {
    throw new HttpError(400, 'Webhook body must be JSON.');
  }

  if (!event.id || !event.event_type) {
    throw new HttpError(400, 'Webhook event is missing id or event_type.');
  }

  const dedupeId = event.id || webhookId;
  if (await isWebhookEventProcessed(env, dedupeId)) {
    return { ok: true, duplicate: true, eventType: event.event_type };
  }

  const handled = await dispatchWebhookEvent(env, event);
  await markWebhookEventProcessed(env, dedupeId);

  return handled;
}

async function dispatchWebhookEvent(
  env: BookingmoodWebhookEnv,
  event: BookingmoodWebhookEvent,
): Promise<WebhookHandleResult> {
  if (!STATUS_EVENT_TYPES.has(event.event_type)) {
    return { ok: true, ignored: true, eventType: event.event_type };
  }

  if (!env.BOOKING_COORDINATOR) {
    throw new HttpError(
      503,
      'BOOKING_COORDINATOR durable object is required for webhook booking status updates.',
    );
  }

  const reference = await resolveWebhookBookingReference(
    env,
    event.event_type,
    event.payload?.new,
  );

  if (!reference) {
    throw new HttpError(422, 'Unable to correlate webhook event to a booking reference.');
  }

  const patch = statusPatchForEventType(event.event_type);
  await applyPublicBookingStatusPatch(env, reference, patch);

  return { ok: true, eventType: event.event_type };
}

function statusPatchForEventType(eventType: string): StatusPatch {
  switch (eventType) {
    case 'payments.paid':
      return { paymentRecorded: true };
    case 'calendar_events.confirmed':
      return { bookingConfirmed: true };
    case 'calendar_events.cancelled':
      return { cancelled: true };
    default:
      return {};
  }
}

async function verifyStandardWebhookSignature(input: {
  secret: string;
  webhookId: string;
  timestamp: string;
  signatureHeader: string;
  rawBody: string;
}): Promise<boolean> {
  const signedContent = `${input.webhookId}.${input.timestamp}.${input.rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(input.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
  const expected = bufferToBase64(digest);

  const parts = input.signatureHeader
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return false;
  }

  for (const part of parts) {
    if (!part.startsWith('v1,')) {
      return false;
    }
  }

  return parts.some((part) => timingSafeEqual(part.slice(3), expected));
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
