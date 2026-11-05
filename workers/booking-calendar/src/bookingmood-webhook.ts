import { HttpError } from './bookingmood-client';
import {
  BookingStateKvEnv,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
  mergePublicBookingStatus,
} from './booking-state-store';

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

export async function handleBookingmoodWebhook(
  request: Request,
  signingSecret: string | undefined,
  env: BookingStateKvEnv,
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

  const rawBody = await request.text();
  if (rawBody.length > WEBHOOK_MAX_BODY_BYTES) {
    throw new HttpError(413, 'Webhook payload is too large.');
  }

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
  env: BookingStateKvEnv,
  event: BookingmoodWebhookEvent,
): Promise<WebhookHandleResult> {
  const reference = extractReference(event.payload?.new);
  switch (event.event_type) {
    case 'payments.paid':
      if (reference) {
        await mergePublicBookingStatus(env, reference, { paymentRecorded: true });
      }
      return { ok: true, eventType: event.event_type };

    case 'calendar_events.confirmed':
      if (reference) {
        await mergePublicBookingStatus(env, reference, { bookingConfirmed: true });
      }
      return { ok: true, eventType: event.event_type };

    case 'calendar_events.cancelled':
      if (reference) {
        await mergePublicBookingStatus(env, reference, { cancelled: true });
      }
      return { ok: true, eventType: event.event_type };

    default:
      return { ok: true, ignored: true, eventType: event.event_type };
  }
}

function extractReference(payload: Record<string, unknown> | undefined): string | null {
  if (!payload) {
    return null;
  }

  const reference = payload['reference'];
  if (typeof reference === 'string' && reference.trim()) {
    return reference.trim();
  }

  return null;
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

  const signatures = input.signatureHeader
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      if (part.startsWith('v1,')) {
        return [part.slice(3)];
      }
      return [part.replace(/^v1,/, '')];
    });

  return signatures.some((candidate) => timingSafeEqual(candidate, expected));
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
