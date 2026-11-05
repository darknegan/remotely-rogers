import { HttpError } from './bookingmood-client';

const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000;

export interface WebhookHandleResult {
  ok: boolean;
  duplicate?: boolean;
  ignored?: boolean;
}

export async function handleBookingmoodWebhook(
  request: Request,
  signingSecret: string | undefined,
): Promise<WebhookHandleResult> {
  const secret = signingSecret?.trim();
  if (!secret) {
    throw new HttpError(503, 'BOOKINGMOOD_WEBHOOK_SIGNING_SECRET is not configured.');
  }

  if (request.headers.get('X-Signature')) {
    throw new HttpError(400, 'Legacy X-Signature webhooks are not supported.');
  }

  const webhookId = request.headers.get('webhook-id') ?? '';
  const timestamp = request.headers.get('webhook-timestamp') ?? '';
  const signatureHeader = request.headers.get('webhook-signature') ?? '';

  if (!webhookId || !timestamp || !signatureHeader) {
    throw new HttpError(400, 'Missing Standard Webhooks headers.');
  }

  const ageMs = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (!Number.isFinite(ageMs) || ageMs > WEBHOOK_MAX_AGE_MS) {
    throw new HttpError(400, 'Webhook timestamp is outside the allowed window.');
  }

  const rawBody = await request.text();
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

  if (await isDuplicateWebhook(webhookId)) {
    return { ok: true, duplicate: true };
  }

  let payload: { type?: string };
  try {
    payload = JSON.parse(rawBody) as { type?: string };
  } catch {
    throw new HttpError(400, 'Webhook body must be JSON.');
  }

  const type = payload.type ?? '';
  if (!type.startsWith('payments.') && !type.startsWith('bookings.')) {
    return { ok: true, ignored: true };
  }

  await rememberWebhook(webhookId);
  return { ok: true };
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

async function isDuplicateWebhook(webhookId: string): Promise<boolean> {
  const cache = caches.default;
  const hit = await cache.match(webhookCacheRequest(webhookId));
  return !!hit;
}

async function rememberWebhook(webhookId: string): Promise<void> {
  const cache = caches.default;
  await cache.put(
    webhookCacheRequest(webhookId),
    new Response('1', { headers: { 'Cache-Control': 'max-age=2592000' } }),
  );
}

function webhookCacheRequest(webhookId: string): Request {
  return new Request(`https://bookingmood-webhook.internal/${encodeURIComponent(webhookId)}`, {
    method: 'GET',
  });
}
