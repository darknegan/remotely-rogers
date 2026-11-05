/** Durable Object: checkout idempotency + per-reference public status (single-writer per instance). */

import type { PublicBookingStatus, StatusPatch } from './booking-status-coordinator';

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
const STATUS_STORAGE_KEY = 'public-status';

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

    if (url.pathname === '/status/seed' && request.method === 'POST') {
      const body = (await request.json()) as { reference: string };
      return Response.json(await this.seedStatus(body.reference));
    }

    if (url.pathname === '/status/get' && request.method === 'GET') {
      const status = await this.readStatus();
      if (!status) {
        return new Response('Not found', { status: 404 });
      }
      return Response.json(status);
    }

    if (url.pathname === '/status/patch' && request.method === 'POST') {
      const body = (await request.json()) as { patch: StatusPatch; reference?: string };
      const reference = body.reference?.trim();
      if (!reference) {
        return new Response('reference is required', { status: 400 });
      }
      const status = await this.patchStatus(reference, body.patch);
      return Response.json({ ok: true, status });
    }

    return new Response('Not found', { status: 404 });
  }

  private async readStatus(): Promise<PublicBookingStatus | null> {
    return (await this.state.storage.get<PublicBookingStatus>(STATUS_STORAGE_KEY)) ?? null;
  }

  private async seedStatus(reference: string): Promise<{ ok: boolean }> {
    const key = reference.trim();
    if (!key) {
      return { ok: false };
    }

    const existing = await this.readStatus();
    if (existing) {
      return { ok: true };
    }

    await this.state.storage.put(
      STATUS_STORAGE_KEY,
      {
        reference: key,
        paymentRecorded: false,
        bookingConfirmed: false,
        cancelled: false,
        updatedAt: new Date().toISOString(),
      } satisfies PublicBookingStatus,
    );

    return { ok: true };
  }

  private async patchStatus(reference: string, patch: StatusPatch): Promise<PublicBookingStatus> {
    const existing =
      (await this.readStatus()) ??
      ({
        reference,
        paymentRecorded: false,
        bookingConfirmed: false,
        cancelled: false,
        updatedAt: new Date(0).toISOString(),
      } satisfies PublicBookingStatus);

    const next = mergePublicStatus(existing, patch, reference);
    await this.state.storage.put(STATUS_STORAGE_KEY, next);
    return next;
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

export function mergePublicStatus(
  existing: PublicBookingStatus,
  patch: StatusPatch,
  reference: string,
): PublicBookingStatus {
  let paymentRecorded = existing.paymentRecorded;
  let bookingConfirmed = existing.bookingConfirmed;
  let cancelled = existing.cancelled;

  if (patch.paymentRecorded === true) {
    paymentRecorded = true;
  }

  if (patch.cancelled === true) {
    cancelled = true;
    bookingConfirmed = false;
  }

  if (patch.bookingConfirmed === true) {
    bookingConfirmed = true;
    cancelled = false;
  }

  return {
    reference: reference.trim() || existing.reference,
    paymentRecorded,
    bookingConfirmed,
    cancelled,
    updatedAt: new Date().toISOString(),
  };
}
