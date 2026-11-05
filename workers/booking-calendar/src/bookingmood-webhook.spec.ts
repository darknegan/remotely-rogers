import { beforeAll, describe, expect, it } from 'vitest';

import { handleBookingmoodWebhook } from './bookingmood-webhook';

const cacheStore = new Map<string, Response>();

beforeAll(() => {
  const cache = {
    match: (request: Request) => Promise.resolve(cacheStore.get(request.url)),
    put: (request: Request, response: Response) => {
      cacheStore.set(request.url, response);
      return Promise.resolve();
    },
  };

  (globalThis as typeof globalThis & { caches: CacheStorage }).caches = {
    default: cache as unknown as Cache,
  } as CacheStorage;
});

async function signBody(input: {
  secret: string;
  webhookId: string;
  timestamp: string;
  body: string;
}): Promise<string> {
  const signedContent = `${input.webhookId}.${input.timestamp}.${input.body}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(input.secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent));
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `v1,${btoa(binary)}`;
}

describe('handleBookingmoodWebhook', () => {
  it('rejects legacy X-Signature', async () => {
    const request = new Request('https://example.com/api/bookingmood/webhook', {
      method: 'POST',
      headers: { 'X-Signature': 'legacy' },
      body: '{}',
    });

    await expect(handleBookingmoodWebhook(request, 'secret')).rejects.toMatchObject({ status: 400 });
  });

  it('accepts valid Standard Webhooks signature', async () => {
    const secret = 'test-signing-secret';
    const body = JSON.stringify({ type: 'payments.paid', data: {} });
    const webhookId = 'msg_123';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await signBody({ secret, webhookId, timestamp, body });

    const request = new Request('https://example.com/api/bookingmood/webhook', {
      method: 'POST',
      headers: {
        'webhook-id': webhookId,
        'webhook-timestamp': timestamp,
        'webhook-signature': signature,
      },
      body,
    });

    const result = await handleBookingmoodWebhook(request, secret);
    expect(result.ok).toBe(true);
  });

  it('dedupes repeated webhook-id', async () => {
    cacheStore.clear();
    const secret = 'test-signing-secret';
    const body = JSON.stringify({ type: 'bookings.updated', data: {} });
    const webhookId = 'msg_duplicate';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await signBody({ secret, webhookId, timestamp, body });
    const headers = {
      'webhook-id': webhookId,
      'webhook-timestamp': timestamp,
      'webhook-signature': signature,
    };

    const first = await handleBookingmoodWebhook(
      new Request('https://example.com/api/bookingmood/webhook', {
        method: 'POST',
        headers,
        body,
      }),
      secret,
    );
    const second = await handleBookingmoodWebhook(
      new Request('https://example.com/api/bookingmood/webhook', {
        method: 'POST',
        headers,
        body,
      }),
      secret,
    );

    expect(first.ok).toBe(true);
    expect(second.duplicate).toBe(true);
  });
});
