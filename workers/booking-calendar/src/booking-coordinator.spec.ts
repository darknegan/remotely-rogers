import { describe, expect, it } from 'vitest';

import { BookingCoordinator, mergePublicStatus } from './booking-coordinator';
import { MemoryStorage } from './test-durable-helpers';

describe('BookingCoordinator idempotency', () => {
  it('returns completed result for matching fingerprint', async () => {
    const coordinator = new BookingCoordinator({ storage: new MemoryStorage() } as DurableObjectState, {});
    const claim = await coordinator.fetch(
      new Request('https://coordinator/idempotency/claim', {
        method: 'POST',
        body: JSON.stringify({ scopeKey: 'scope-1', fingerprint: 'fp-a' }),
      }),
    );
    expect((await claim.json()).status).toBe('claimed');

    await coordinator.fetch(
      new Request('https://coordinator/idempotency/complete', {
        method: 'POST',
        body: JSON.stringify({
          scopeKey: 'scope-1',
          fingerprint: 'fp-a',
          result: { paymentUrl: 'https://pay.example/x', reference: 'REF1', bookingId: 'b1' },
        }),
      }),
    );

    const second = await coordinator.fetch(
      new Request('https://coordinator/idempotency/claim', {
        method: 'POST',
        body: JSON.stringify({ scopeKey: 'scope-1', fingerprint: 'fp-a' }),
      }),
    );
    const payload = await second.json();
    expect(payload.status).toBe('completed');
    expect(payload.result.reference).toBe('REF1');
  });

  it('conflicts when fingerprint differs for same scope', async () => {
    const coordinator = new BookingCoordinator({ storage: new MemoryStorage() } as DurableObjectState, {});
    await coordinator.fetch(
      new Request('https://coordinator/idempotency/claim', {
        method: 'POST',
        body: JSON.stringify({ scopeKey: 'scope-2', fingerprint: 'fp-a' }),
      }),
    );

    const conflict = await coordinator.fetch(
      new Request('https://coordinator/idempotency/claim', {
        method: 'POST',
        body: JSON.stringify({ scopeKey: 'scope-2', fingerprint: 'fp-b' }),
      }),
    );
    expect((await conflict.json()).status).toBe('conflict');
  });

  it('marks stale pending claims indeterminate after timeout window', async () => {
    const storage = new MemoryStorage();
    const coordinator = new BookingCoordinator({ storage } as DurableObjectState, {});

    await storage.put('scope-timeout', {
      fingerprint: 'fp-timeout',
      state: 'pending',
      updatedAt: Date.now() - 121_000,
    });

    const response = await coordinator.fetch(
      new Request('https://coordinator/idempotency/claim', {
        method: 'POST',
        body: JSON.stringify({ scopeKey: 'scope-timeout', fingerprint: 'fp-timeout' }),
      }),
    );

    expect((await response.json()).status).toBe('indeterminate');
  });
});

describe('BookingCoordinator public status', () => {
  it('merges payment and confirmation patches on the same reference', async () => {
    const coordinator = new BookingCoordinator({ storage: new MemoryStorage() } as DurableObjectState, {});

    const patch = (body: unknown) =>
      coordinator.fetch(
        new Request('https://coordinator/status/patch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      );

    await patch({ reference: 'REF-X', patch: { paymentRecorded: true } });
    await patch({ reference: 'REF-X', patch: { bookingConfirmed: true } });

    const statusResponse = await coordinator.fetch(
      new Request('https://coordinator/status/get', { method: 'GET' }),
    );
    const status = await statusResponse.json();
    expect(status.paymentRecorded).toBe(true);
    expect(status.bookingConfirmed).toBe(true);
    expect(status.cancelled).toBe(false);
  });
});

describe('mergePublicStatus', () => {
  it('clears cancelled on reconfirm', () => {
    const base = {
      reference: 'R1',
      paymentRecorded: true,
      bookingConfirmed: false,
      cancelled: true,
      updatedAt: new Date(0).toISOString(),
    };

    const next = mergePublicStatus(base, { bookingConfirmed: true }, 'R1');
    expect(next.cancelled).toBe(false);
    expect(next.bookingConfirmed).toBe(true);
    expect(next.paymentRecorded).toBe(true);
  });
});
