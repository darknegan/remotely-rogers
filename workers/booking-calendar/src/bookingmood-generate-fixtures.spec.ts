import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'vitest';

import { BOOKINGMOOD_PRODUCT_IDS } from '../../../src/app/core/booking/bookingmood-products';
import {
  describeBookingmoodSearchResponseShape,
  sanitizeBookingmoodFixture,
} from './bookingmood-fixture-sanitize';
import { BookingmoodClient } from './bookingmood-client';

const CAPACITY = 'f8558449-6548-4559-8f5d-31448942969d';
const PRODUCT_IDS = Object.values(BOOKINGMOOD_PRODUCT_IDS);
const INTERVAL = { start: '2026-12-07', end: '2026-12-09' };

const MCP_SEARCH_DUMP = resolve(
  '/home/ubuntu/.cursor/projects/agent-repos-remotely-rogers/agent-tools/4700a70e-51f6-47d5-aa38-0d30a85e0530.txt',
);
const MCP_CART_DUMP = resolve(
  '/home/ubuntu/.cursor/projects/agent-repos-remotely-rogers/agent-tools/46a0beb7-3294-4787-ac31-6b0a1383e5db.txt',
);

describe('generate Bookingmood worker fixtures', () => {
  const canRefresh =
    process.env.UPDATE_BOOKINGMOOD_FIXTURES === '1' &&
    existsSync(MCP_SEARCH_DUMP) &&
    existsSync(MCP_CART_DUMP);

  it.skipIf(!canRefresh)('writes captured search and cart-validate JSON', () => {

    const client = new BookingmoodClient('fixture-only');
    const fixtureDir = resolve(import.meta.dirname, 'fixtures');

    const searchResponseBody = sanitizeBookingmoodFixture(
      JSON.parse(readFileSync(MCP_SEARCH_DUMP, 'utf8')),
    );
    const cartResponseBody = sanitizeBookingmoodFixture(
      JSON.parse(readFileSync(MCP_CART_DUMP, 'utf8')),
    );

    const searchRequest = client.buildSearchRequestBody({
      interval: INTERVAL,
      productIds: PRODUCT_IDS,
      occupancy: {},
    });
    const cartRequest = client.buildCartValidateRequestBody({
      items: [
        {
          id: 'quote-1',
          product_id: PRODUCT_IDS[0]!,
          interval: INTERVAL,
          occupancy: { [CAPACITY]: 2 },
          form_values: {},
        },
      ],
    });

    writeFileSync(
      resolve(fixtureDir, 'bookingmood-search-dec-2026-raw.json'),
      `${JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          endpoint: 'POST https://api.bookingmood.com/v1/search',
          requestBody: searchRequest,
          responseBody: searchResponseBody,
          responseShape: describeBookingmoodSearchResponseShape(searchResponseBody),
          captureNote:
            'responseBody from read-only live /search (Dec 7–9 2026, six products, occupancy {}); requestBody from BookingmoodClient.buildSearchRequestBody',
        },
        null,
        2,
      )}\n`,
    );

    writeFileSync(
      resolve(fixtureDir, 'bookingmood-cart-validate-dec-2026-raw.json'),
      `${JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          endpoint: 'POST https://api.bookingmood.com/v1/cart-validate',
          requestBody: cartRequest,
          responseBody: cartResponseBody,
          responseIsArray: Array.isArray(cartResponseBody),
          captureNote:
            'responseBody from read-only live /cart-validate (quote-1); requestBody from BookingmoodClient.buildCartValidateRequestBody',
        },
        null,
        2,
      )}\n`,
    );
  });
});