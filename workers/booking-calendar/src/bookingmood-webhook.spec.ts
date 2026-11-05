import { beforeEach, describe, expect, it } from 'vitest';

import {
  WEBHOOK_CALENDAR_CONFIRMED,
  WEBHOOK_PAYMENTS_PAID,
  WEBHOOK_TASKS_COMPLETED,
} from './bookingmood-webhook.fixtures';
import { handleBookingmoodWebhook } from './bookingmood-webhook';
import { getPublicBookingStatus } from './booking-state-store';

function createMockKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
    getWithMetadata: async (key: string) => ({ value: store.get(key) ?? null, metadata: null, cacheStatus: null }),
  } as unknown as KVNamespace;
}

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
  let kv: KVNamespace;

  beforeEach(() => {
    kv = createMockKv();
  });

  it('rejects legacy-only X-Signature without Standard Webhooks headers', async () => {
    const request = new Request('https://example.com/api/bookingmood/webhook', {
      method: 'POST',
      headers: { 'X-Signature': '\\xdeadbeef' },
      body: '{}',
    });

    await expect(
      handleBookingmoodWebhook(request, 'secret', { BOOKING_STATE: kv }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('accepts Standard Webhooks when legacy X-Signature is also present', async () => {
    const secret = 'test-signing-secret';
    const body = JSON.stringify(WEBHOOK_TASKS_COMPLETED);
    const webhookId = WEBHOOK_TASKS_COMPLETED.id;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await signBody({ secret, webhookId, timestamp, body });

    const request = new Request('https://example.com/api/bookingmood/webhook', {
      method: 'POST',
      headers: {
        'webhook-id': webhookId,
        'webhook-timestamp': timestamp,
        'webhook-signature': signature,
        'X-Signature': '\\xignored',
      },
      body,
    });

    const result = await handleBookingmoodWebhook(request, secret, { BOOKING_STATE: kv });
    expect(result.ignored).toBe(true);
  });

  it('updates payment and confirmation status separately', async () => {
    const secret = 'test-signing-secret';
    const env = { BOOKING_STATE: kv };

    for (const event of [WEBHOOK_PAYMENTS_PAID, WEBHOOK_CALENDAR_CONFIRMED]) {
      const body = JSON.stringify(event);
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = await signBody({
        secret,
        webhookId: event.id,
        timestamp,
        body,
      });

      await handleBookingmoodWebhook(
        new Request('https://example.com/api/bookingmood/webhook', {
          method: 'POST',
          headers: {
            'webhook-id': event.id,
            'webhook-timestamp': timestamp,
            'webhook-signature': signature,
          },
          body,
        }),
        secret,
        env,
      );
    }

    const status = await getPublicBookingStatus(env, 'REF-PAID-001');
    expect(status?.paymentRecorded).toBe(true);
    expect(status?.bookingConfirmed).toBe(false);

    const confirmed = await getPublicBookingStatus(env, 'REF-CONF-001');
    expect(confirmed?.bookingConfirmed).toBe(true);
    expect(confirmed?.paymentRecorded).toBe(false);
  });

  it('dedupes duplicate event ids in KV', async () => {
    const secret = 'test-signing-secret';
    const body = JSON.stringify(WEBHOOK_PAYMENTS_PAID);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await signBody({
      secret,
      webhookId: WEBHOOK_PAYMENTS_PAID.id,
      timestamp,
      body,
    });
    const headers = {
      'webhook-id': WEBHOOK_PAYMENTS_PAID.id,
      'webhook-timestamp': timestamp,
      'webhook-signature': signature,
    };

    const env = { BOOKING_STATE: kv };
    const first = await handleBookingmoodWebhook(
      new Request('https://example.com/api/bookingmood/webhook', {
        method: 'POST',
        headers,
        body,
      }),
      secret,
      env,
    );
    const second = await handleBookingmoodWebhook(
      new Request('https://example.com/api/bookingmood/webhook', {
        method: 'POST',
        headers,
        body,
      }),
      secret,
      env,
    );

    expect(first.ok).toBe(true);
    expect(second.duplicate).toBe(true);
  });
});
