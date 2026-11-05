/** Durable Object: atomic checkout idempotency (single-writer per scope key). */

export interface IdempotencyClaimResult {
  status: 'claimed' | 'completed' | 'in_progress' | 'conflict' | 'indeterminate';
  fingerprint?: string;
  result?: IdempotencyStoredResult;
}

export interface IdempotencyStoredResult {
  paymentUrl: string | null;
  reference: string;
  bookingId: string;
}

interface StoredRecord {
  fingerprint: string;
  state: 'pending' | 'completed' | 'indeterminate';
  result?: IdempotencyStoredResult;
  updatedAt: number;
}

const PENDING_MAX_MS = 120_000;

export class BookingCoordinator implements DurableObject {
  constructor(
    private readonly state: DurableObjectState,
    private readonly env: unknown,
  ) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/idempotency/claim' && request.method === 'POST') {
      const body = (await request.json()) as { fingerprint: string; scopeKey: string };
      return Response.json(await this.claim(body.scopeKey, body.fingerprint));
    }

    if (url.pathname === '/idempotency/complete' && request.method === 'POST') {
      const body = (await request.json()) as {
        scopeKey: string;
        fingerprint: string;
        result: IdempotencyStoredResult;
      };
      return Response.json(await this.complete(body.scopeKey, body.fingerprint, body.result));
    }

    if (url.pathname === '/idempotency/indeterminate' && request.method === 'POST') {
      const body = (await request.json()) as { scopeKey: string; fingerprint: string };
      return Response.json(await this.markIndeterminate(body.scopeKey, body.fingerprint));
    }

    return new Response('Not found', { status: 404 });
  }

  private async read(scopeKey: string): Promise<StoredRecord | null> {
    return (await this.state.storage.get<StoredRecord>(scopeKey)) ?? null;
  }

  private async claim(scopeKey: string, fingerprint: string): Promise<IdempotencyClaimResult> {
    const existing = await this.read(scopeKey);
    if (!existing) {
      await this.state.storage.put(scopeKey, {
        fingerprint,
        state: 'pending',
        updatedAt: Date.now(),
      } satisfies StoredRecord);
      return { status: 'claimed', fingerprint };
    }

    if (existing.state === 'completed') {
      if (existing.fingerprint === fingerprint) {
        return { status: 'completed', fingerprint, result: existing.result };
      }
      return { status: 'conflict', fingerprint: existing.fingerprint };
    }

    if (existing.state === 'indeterminate') {
      return { status: 'indeterminate', fingerprint: existing.fingerprint };
    }

    if (existing.fingerprint !== fingerprint) {
      return { status: 'conflict', fingerprint: existing.fingerprint };
    }

    if (Date.now() - existing.updatedAt > PENDING_MAX_MS) {
      await this.state.storage.put(scopeKey, {
        ...existing,
        state: 'indeterminate',
        updatedAt: Date.now(),
      });
      return { status: 'indeterminate', fingerprint };
    }

    return { status: 'in_progress', fingerprint };
  }

  private async complete(
    scopeKey: string,
    fingerprint: string,
    result: IdempotencyStoredResult,
  ): Promise<{ ok: boolean }> {
    const existing = await this.read(scopeKey);
    if (!existing || existing.fingerprint !== fingerprint) {
      return { ok: false };
    }

    await this.state.storage.put(scopeKey, {
      fingerprint,
      state: 'completed',
      result,
      updatedAt: Date.now(),
    } satisfies StoredRecord);

    return { ok: true };
  }

  private async markIndeterminate(
    scopeKey: string,
    fingerprint: string,
  ): Promise<{ ok: boolean }> {
    const existing = await this.read(scopeKey);
    if (!existing || existing.fingerprint !== fingerprint) {
      return { ok: false };
    }

    await this.state.storage.put(scopeKey, {
      fingerprint,
      state: 'indeterminate',
      updatedAt: Date.now(),
    } satisfies StoredRecord);

    return { ok: true };
  }
}

export async function claimCheckoutIdempotency(
  env: { BOOKING_COORDINATOR: DurableObjectNamespace },
  scopeKey: string,
  fingerprint: string,
): Promise<IdempotencyClaimResult> {
  const id = env.BOOKING_COORDINATOR.idFromName(scopeKey);
  const stub = env.BOOKING_COORDINATOR.get(id);
  const response = await stub.fetch('https://booking-coordinator/idempotency/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scopeKey, fingerprint }),
  });
  return (await response.json()) as IdempotencyClaimResult;
}

export async function completeCheckoutIdempotency(
  env: { BOOKING_COORDINATOR: DurableObjectNamespace },
  scopeKey: string,
  fingerprint: string,
  result: IdempotencyStoredResult,
): Promise<boolean> {
  const id = env.BOOKING_COORDINATOR.idFromName(scopeKey);
  const stub = env.BOOKING_COORDINATOR.get(id);
  const response = await stub.fetch('https://booking-coordinator/idempotency/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scopeKey, fingerprint, result }),
  });
  const payload = (await response.json()) as { ok: boolean };
  return payload.ok;
}

export async function indeterminateCheckoutIdempotency(
  env: { BOOKING_COORDINATOR: DurableObjectNamespace },
  scopeKey: string,
  fingerprint: string,
): Promise<boolean> {
  const id = env.BOOKING_COORDINATOR.idFromName(scopeKey);
  const stub = env.BOOKING_COORDINATOR.get(id);
  const response = await stub.fetch('https://booking-coordinator/idempotency/indeterminate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scopeKey, fingerprint }),
  });
  const payload = (await response.json()) as { ok: boolean };
  return payload.ok;
}
