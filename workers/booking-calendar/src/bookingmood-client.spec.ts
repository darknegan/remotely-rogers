import { describe, expect, it } from 'vitest';

import {
  BookingmoodClient,
  buildProductIdsInFilter,
} from './bookingmood-client';

const SIX_PRODUCT_IDS = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  '44444444-4444-4444-8444-444444444444',
  '55555555-5555-4555-8555-555555555555',
  '66666666-6666-4666-8666-666666666666',
];

describe('BookingmoodClient listProducts query', () => {
  it('buildProductIdsInFilter emits PostgREST in.(…) for OR semantics', () => {
    expect(buildProductIdsInFilter(SIX_PRODUCT_IDS)).toBe(
      `in.(${SIX_PRODUCT_IDS.join(',')})`,
    );
  });

  it('listProducts sends one id=in filter instead of repeated id=eq', async () => {
    let requestedUrl = '';
    const client = new BookingmoodClient('fake-test-key', async (input) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    await client.listProducts('id,name', SIX_PRODUCT_IDS);

    const query = new URL(requestedUrl).searchParams;
    expect(query.get('id')).toBe(buildProductIdsInFilter(SIX_PRODUCT_IDS));
    expect(requestedUrl).not.toMatch(/id=eq\./);
  });
});
