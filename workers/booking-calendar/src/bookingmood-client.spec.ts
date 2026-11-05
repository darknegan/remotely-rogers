import { describe, expect, it } from 'vitest';

import {
  BookingmoodClient,
  buildProductIdsInFilter,
} from './bookingmood-client';
import { RUNTIME_SIX_PRODUCT_IDS } from './bookingmood-runtime-fixtures';

const SIX_PRODUCT_IDS = [...RUNTIME_SIX_PRODUCT_IDS];

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
