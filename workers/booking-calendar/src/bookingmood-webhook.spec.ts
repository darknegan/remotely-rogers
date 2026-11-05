import { beforeEach, describe, expect, it } from 'vitest';

import { seedBookingIdReferenceMapping } from './booking-reference-map';
import { getPublicBookingStatusFromCoordinator } from './booking-status-coordinator';
import {
  BOOKING_ID_CANCEL,
  BOOKING_ID_CONFIRM,
  BOOKING_ID_LIFE,
  WEBHOOK_CALENDAR_CANCELLED,
  WEBHOOK_CALENDAR_CONFIRMED,
  WEBHOOK_PAYMENTS_PAID,
  WEBHOOK_TASKS_COMPLETED,
  lifecycleCalendarCancelled,
  lifecycleCalendarConfirmed,
  lifecyclePaymentPaid,
} from './bookingmood-webhook.fixtures';
import { handleBookingmoodWebhook } from './bookingmood-webhook';
import { isWebhookEventProcessed } from './booking-state-store';
import { createMockBookingCoordinatorNamespace, createMockKv } from './test-durable-helpers';

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

async function postWebhook(
  secret: string,
  env: { BOOKING_STATE: KVNamespace; BOOKING_COORDINATOR: DurableObjectNamespace },
  event: { id: string; event_type: string },
  body: string,
) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = await signBody({
    secret,
    webhookId: event.id,
    timestamp,
    body,
  });

  return handleBookingmoodWebhook(
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

describe('handleBookingmoodWebhook', () => {
  let kv: KVNamespace;
  let coordinator: DurableObjectNamespace;
  let env: { BOOKING_STATE: KVNamespace; BOOKING_COORDINATOR: DurableObjectNamespace };

  beforeEach(() => {
    kv = createMockKv();
    coordinator = createMockBookingCoordinatorNamespace();
    env = { BOOKING_STATE: kv, BOOKING_COORDINATOR: coordinator };
  });

  it('rejects legacy-only X-Signature without Standard Webhooks headers', async () => {
    const request = new Request('https://example.com/api/bookingmood/webhook', {
      method: 'POST',
      headers: { 'X-Signature': '\\xdeadbeef' },
      body: '{}',
    });

    await expect(handleBookingmoodWebhook(request, 'secret', env)).rejects.toMatchObject({
      status: 400,
    });
  });

  it('rejects webhook-signature parts that are not v1', async () => {
    const secret = 'test-signing-secret';
    const body = JSON.stringify(WEBHOOK_TASKS_COMPLETED);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const valid = await signBody({
      secret,
      webhookId: WEBHOOK_TASKS_COMPLETED.id,
      timestamp,
      body,
    });

    await expect(
      handleBookingmoodWebhook(
        new Request('https://example.com/api/bookingmood/webhook', {
          method: 'POST',
          headers: {
            'webhook-id': WEBHOOK_TASKS_COMPLETED.id,
            'webhook-timestamp': timestamp,
            'webhook-signature': `v2,deadbeef ${valid}`,
          },
          body,
        }),
        secret,
        env,
      ),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('accepts Standard Webhooks when legacy X-Signature is also present', async () => {
    const secret = 'test-signing-secret';
    const body = JSON.stringify(WEBHOOK_TASKS_COMPLETED);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = await signBody({
      secret,
      webhookId: WEBHOOK_TASKS_COMPLETED.id,
      timestamp,
      body,
    });

    const result = await handleBookingmoodWebhook(
      new Request('https://example.com/api/bookingmood/webhook', {
        method: 'POST',
        headers: {
          'webhook-id': WEBHOOK_TASKS_COMPLETED.id,
          'webhook-timestamp': timestamp,
          'webhook-signature': signature,
          'X-Signature': '\\xignored',
        },
        body,
      }),
      secret,
      env,
    );
    expect(result.ignored).toBe(true);
  });

  it('updates payment via payments.reference and confirmation via booking_id mapping', async () => {
    const secret = 'test-signing-secret';

    await seedBookingIdReferenceMapping(env, BOOKING_ID_CONFIRM, 'REF-CONF-001');

    for (const event of [WEBHOOK_PAYMENTS_PAID, WEBHOOK_CALENDAR_CONFIRMED]) {
      const body = JSON.stringify(event);
      await postWebhook(secret, env, event, body);
    }

    const paid = await getPublicBookingStatusFromCoordinator(env, 'REF-PAID-001');
    expect(paid?.paymentRecorded).toBe(true);
    expect(paid?.bookingConfirmed).toBe(false);

    const confirmed = await getPublicBookingStatusFromCoordinator(env, 'REF-CONF-001');
    expect(confirmed?.bookingConfirmed).toBe(true);
    expect(confirmed?.paymentRecorded).toBe(false);
  });

  it('runs payment → confirm → cancel → reconfirm without sticky cancelled', async () => {
    const secret = 'test-signing-secret';
    const reference = 'REF-LIFE-001';

    await seedBookingIdReferenceMapping(env, BOOKING_ID_LIFE, reference);

    const events = [
      lifecyclePaymentPaid(reference),
      lifecycleCalendarConfirmed('00000000-0000-0000-0000-000000000021'),
      lifecycleCalendarCancelled('00000000-0000-0000-0000-000000000022'),
      lifecycleCalendarConfirmed('00000000-0000-0000-0000-000000000023'),
    ];

    for (const event of events) {
      await postWebhook(secret, env, event, JSON.stringify(event));
    }

    const status = await getPublicBookingStatusFromCoordinator(env, reference);
    expect(status?.paymentRecorded).toBe(true);
    expect(status?.bookingConfirmed).toBe(true);
    expect(status?.cancelled).toBe(false);
  });

  it('does not mark dedupe when calendar event lacks booking_id mapping (retry-safe)', async () => {
    const secret = 'test-signing-secret';
    const event = WEBHOOK_CALENDAR_CONFIRMED;
    const body = JSON.stringify(event);

    await expect(postWebhook(secret, env, event, body)).rejects.toMatchObject({ status: 422 });

    const processed = await isWebhookEventProcessed(env, event.id);
    expect(processed).toBe(false);
  });

  it('dedupes duplicate event ids in KV after successful handling', async () => {
    const secret = 'test-signing-secret';
    const body = JSON.stringify(WEBHOOK_PAYMENTS_PAID);

    const first = await postWebhook(secret, env, WEBHOOK_PAYMENTS_PAID, body);
    const second = await postWebhook(secret, env, WEBHOOK_PAYMENTS_PAID, body);

    expect(first.ok).toBe(true);
    expect(second.duplicate).toBe(true);
  });

  it('resolves cancel webhook via seeded booking_id mapping', async () => {
    const secret = 'test-signing-secret';
    await seedBookingIdReferenceMapping(env, BOOKING_ID_CANCEL, 'REF-CANCEL-001');

    await postWebhook(secret, env, WEBHOOK_CALENDAR_CANCELLED, JSON.stringify(WEBHOOK_CALENDAR_CANCELLED));

    const status = await getPublicBookingStatusFromCoordinator(env, 'REF-CANCEL-001');
    expect(status?.cancelled).toBe(true);
  });
});
