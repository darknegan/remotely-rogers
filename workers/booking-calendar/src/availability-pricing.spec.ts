import { describe, expect, it, vi } from 'vitest';

import { quoteStaySubtotalsViaCartValidate } from './availability-pricing';
import type { BookingWorkerEnv } from './booking-config';
import type { BookingmoodClient } from './bookingmood-client';

const ENV = {
  BOOKINGMOOD_CAPACITY_GROUP_ID: 'f8558449-6548-4559-8f5d-31448942969d',
  BOOKINGMOOD_FORM_SERVICES: '[]',
} as BookingWorkerEnv;

describe('quoteStaySubtotalsViaCartValidate', () => {
  it('returns an empty map when cart validate throws', async () => {
    const client = {
      cartValidate: vi.fn().mockRejectedValue(new Error('channel_not_bookable')),
    } as unknown as BookingmoodClient;

    const map = await quoteStaySubtotalsViaCartValidate(
      client,
      ENV,
      '2026-12-07',
      '2026-12-09',
      { [ENV.BOOKINGMOOD_CAPACITY_GROUP_ID!]: 2 },
      [
        { cabinId: 1, productId: '936c1ff7-2900-410b-9ced-cc2cf6ec3b65' },
        { cabinId: 2, productId: 'c7f5ee68-02db-49b5-ae79-85445daa73bf' },
      ],
    );

    expect(map.size).toBe(0);
    expect(client.cartValidate).toHaveBeenCalledTimes(1);
    const items = (client.cartValidate as ReturnType<typeof vi.fn>).mock.calls[0]![0].items;
    expect(items).toHaveLength(2);
  });

  it('batch-validates several cabins in one request', async () => {
    const client = {
      cartValidate: vi.fn().mockResolvedValue([
        { id: 'quote-1', price: { subtotal: 26_400 } },
        { id: 'quote-2', price: { subtotal: 26_400 } },
      ]),
    } as unknown as BookingmoodClient;

    const map = await quoteStaySubtotalsViaCartValidate(
      client,
      ENV,
      '2026-12-07',
      '2026-12-09',
      { [ENV.BOOKINGMOOD_CAPACITY_GROUP_ID!]: 2 },
      [
        { cabinId: 1, productId: '936c1ff7-2900-410b-9ced-cc2cf6ec3b65' },
        { cabinId: 2, productId: 'c7f5ee68-02db-49b5-ae79-85445daa73bf' },
      ],
    );

    expect(map.get(1)).toBe(26_400);
    expect(map.get(2)).toBe(26_400);
  });
});