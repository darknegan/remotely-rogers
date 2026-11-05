import { describe, expect, it } from 'vitest';

import { BookingCoordinator } from './booking-coordinator';

class MemoryStorage {
  private map = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.map.get(key) as T | undefined;
  }

  async put(key: string, value: unknown): Promise<void> {
    this.map.set(key, value);
  }
}

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
});
