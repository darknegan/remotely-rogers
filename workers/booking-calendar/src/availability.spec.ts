import { describe, expect, it, vi } from 'vitest';

import { buildAvailabilityResponse } from './availability';
import type { BookingmoodClient } from './bookingmood-client';

const PRODUCT = '11111111-1111-4111-8111-111111111111';

describe('buildAvailabilityResponse', () => {
  it('marks cabins unavailable on provider errors (never falsely available)', async () => {
    const client = {
      getAvailability: vi.fn().mockRejectedValue(new Error('upstream down')),
      search: vi.fn(),
    } as unknown as BookingmoodClient;

    const result = await buildAvailabilityResponse(
      { arrival: '2026-07-01', departure: '2026-07-03', adults: 2 },
      client,
      {
        ASSETS: {} as Fetcher,
        BOOKINGMOOD_API_KEY: 'test',
        BOOKINGMOOD_PRODUCT_MAP: JSON.stringify({ 1: PRODUCT }),
      },
      'https://example.com',
    );

    expect(result.cabins.find((c) => c.cabinId === 1)?.available).toBe(false);
    expect(result.cabins.find((c) => c.cabinId === 1)?.availabilityState).toBe('error');
    expect(client.search).not.toHaveBeenCalled();
  });
});
