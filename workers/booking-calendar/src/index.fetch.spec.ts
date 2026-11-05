import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GroupCheckoutRequest } from '../../../src/app/core/models/booking.models';
import type { BookingWorkerEnv } from './booking-config';

const PRODUCT = '11111111-1111-4111-8111-111111111111';
const CAPACITY = '22222222-2222-4222-8222-222222222222';
const SERVICE = '33333333-3333-4333-8333-333333333333';

const providerClient = {
  getAvailability: vi.fn(),
  search: vi.fn(),
  cartValidate: vi.fn(),
  cartCheckout: vi.fn(),
  listProducts: vi.fn(),
};

vi.mock('./booking-coordinator', () => ({
  claimCheckoutIdempotency: vi.fn(),
  completeCheckoutIdempotency: vi.fn(),
  indeterminateCheckoutIdempotency: vi.fn(),
}));

vi.mock('./booking-status-coordinator', () => ({
  getPublicBookingStatusFromCoordinator: vi.fn(),
  seedPublicBookingStatus: vi.fn(),
}));

vi.mock('./booking-reference-map', () => ({
  seedBookingIdReferenceMapping: vi.fn(),
}));

vi.mock('./bookingmood-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./bookingmood-client')>();
  return {
    ...actual,
    requireBookingmoodClient: vi.fn(() => providerClient),
  };
});

import worker from './index';
import { claimCheckoutIdempotency } from './booking-coordinator';

function writeReadyEnv(flag: string | undefined): BookingWorkerEnv {
  return {
    ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
    BOOKING_STATE: {} as KVNamespace,
    BOOKING_COORDINATOR: {} as DurableObjectNamespace,
    BOOKINGMOOD_API_KEY: 'test-key',
    BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT, 2: PRODUCT }),
    BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY,
    BOOKINGMOOD_FORM_SERVICES: JSON.stringify({
      firstName: SERVICE,
      lastName: SERVICE,
      email: SERVICE,
    }),
    BOOKINGMOOD_BOOKING_ENABLED: flag,
  };
}

const singleCheckout: GroupCheckoutRequest = {
  guest: { firstName: 'A', lastName: 'B', email: 'a@example.com' },
  adults: 2,
  cabins: [{ cabinId: 1, arrival: '2026-07-01', departure: '2026-07-03' }],
};

const groupCheckout: GroupCheckoutRequest = {
  guest: { firstName: 'A', lastName: 'B', email: 'a@example.com' },
  adults: 2,
  cabins: [
    { cabinId: 1, arrival: '2026-07-01', departure: '2026-07-03' },
    { cabinId: 2, arrival: '2026-07-05', departure: '2026-07-07' },
  ],
};

async function postCheckout(env: BookingWorkerEnv, body: GroupCheckoutRequest) {
  const assetsFetch = vi.fn(async () => new Response('asset-fallback', { status: 200 }));
  const request = new Request('http://localhost:4200/api/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:4200',
    },
    body: JSON.stringify(body),
  });

  const response = await worker.fetch(
    request,
    { ...env, ASSETS: { fetch: assetsFetch } as unknown as Fetcher },
  );

  return { response, assetsFetch, payload: (await response.json()) as { error?: string } };
}

async function postAvailability(env: BookingWorkerEnv, body: Record<string, unknown>) {
  const assetsFetch = vi.fn(async () => new Response('asset-fallback', { status: 200 }));
  const request = new Request('http://localhost:4200/api/availability', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://localhost:4200',
    },
    body: JSON.stringify(body),
  });

  const response = await worker.fetch(
    request,
    { ...env, ASSETS: { fetch: assetsFetch } as unknown as Fetcher },
  );

  return {
    response,
    assetsFetch,
    payload: (await response.json()) as {
      bookingEnabled?: boolean;
      cabins?: Array<{ cabinId: number; available: boolean; availabilityState?: string; days?: Record<string, string> }>;
    },
  };
}

describe('booking worker fetch handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    providerClient.cartValidate.mockReset();
    providerClient.cartCheckout.mockReset();
    providerClient.getAvailability.mockReset();
    providerClient.search.mockReset();
  });

  describe('POST /api/checkout', () => {
    it.each([
      ['flag absent', undefined],
      ['flag false', 'false'],
    ] as const)('returns 503 without upstream or durable effects when %s (single cart)', async (_label, flag) => {
      const { response, assetsFetch, payload } = await postCheckout(writeReadyEnv(flag), singleCheckout);

      expect(response.status).toBe(503);
      expect(payload.error).toMatch(/disabled/i);
      expect(providerClient.cartValidate).not.toHaveBeenCalled();
      expect(providerClient.cartCheckout).not.toHaveBeenCalled();
      expect(providerClient.getAvailability).not.toHaveBeenCalled();
      expect(claimCheckoutIdempotency).not.toHaveBeenCalled();
      expect(assetsFetch).not.toHaveBeenCalled();
    });

    it('returns 503 without upstream calls when write flag absent (group cart)', async () => {
      const { response, assetsFetch, payload } = await postCheckout(writeReadyEnv(undefined), groupCheckout);

      expect(response.status).toBe(503);
      expect(payload.error).toMatch(/disabled/i);
      expect(providerClient.cartValidate).not.toHaveBeenCalled();
      expect(providerClient.cartCheckout).not.toHaveBeenCalled();
      expect(claimCheckoutIdempotency).not.toHaveBeenCalled();
      expect(assetsFetch).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/availability', () => {
    it('returns bookingEnabled false and unavailable cabins when mapping missing (no asset fallback)', async () => {
      const assetsFetch = vi.fn();
      const env = {
        ASSETS: { fetch: assetsFetch } as unknown as Fetcher,
        BOOKINGMOOD_API_KEY: 'test-key',
        BOOKINGMOOD_BOOKING_ENABLED: 'false',
      };

      const { response, payload } = await postAvailability(env, {
        arrival: '2026-07-01',
        departure: '2026-07-03',
        adults: 2,
      });

      expect(response.status).toBe(200);
      expect(payload.bookingEnabled).toBe(false);
      const cabin = payload.cabins?.find((c) => c.cabinId === 1);
      expect(cabin?.available).toBe(false);
      expect(cabin?.availabilityState).toBe('unconfigured');
      expect(Object.values(cabin?.days ?? {}).every((d) => d === 'unknown')).toBe(true);
      expect(providerClient.getAvailability).not.toHaveBeenCalled();
      expect(assetsFetch).not.toHaveBeenCalled();
    });

    it('never marks cabins available when provider availability fails', async () => {
      providerClient.getAvailability.mockRejectedValue(new Error('upstream down'));
      providerClient.search.mockResolvedValue([]);

      const { response, payload, assetsFetch } = await postAvailability(writeReadyEnv('false'), {
        arrival: '2026-07-01',
        departure: '2026-07-03',
        adults: 2,
      });

      expect(response.status).toBe(200);
      expect(payload.bookingEnabled).toBe(false);
      const cabin = payload.cabins?.find((c) => c.cabinId === 1);
      expect(cabin?.available).toBe(false);
      expect(cabin?.availabilityState).toBe('error');
      expect(providerClient.search).not.toHaveBeenCalled();
      expect(assetsFetch).not.toHaveBeenCalled();
    });
  });
});
