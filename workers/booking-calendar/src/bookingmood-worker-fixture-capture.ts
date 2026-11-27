import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOKINGMOOD_PRODUCT_IDS } from '../../../src/app/core/booking/bookingmood-products';
import {
  describeBookingmoodSearchResponseShape,
  sanitizeBookingmoodFixture,
} from './bookingmood-fixture-sanitize';
import { BookingmoodClient } from './bookingmood-client';

const CAPACITY_GROUP_ID = 'f8558449-6548-4559-8f5d-31448942969d';
const INTERVAL = { start: '2026-12-07', end: '2026-12-09' };

const PRODUCT_IDS = Object.values(BOOKINGMOOD_PRODUCT_IDS);

const FIXTURE_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures',
);

export async function captureBookingmoodWorkerFixtures(apiKey: string): Promise<void> {
  const client = new BookingmoodClient(apiKey);

  const searchRequest = client.buildSearchRequestBody({
    interval: INTERVAL,
    productIds: PRODUCT_IDS,
    occupancy: {},
  });

  const searchResponseBody = sanitizeBookingmoodFixture(
    await client.searchRaw({
      interval: INTERVAL,
      productIds: PRODUCT_IDS,
      occupancy: {},
    }),
  );

  const cartValidateRequest = client.buildCartValidateRequestBody({
    items: [
      {
        id: 'quote-1',
        product_id: PRODUCT_IDS[0]!,
        interval: INTERVAL,
        occupancy: { [CAPACITY_GROUP_ID]: 2 },
        form_values: {},
      },
    ],
    couponCodes: [],
  });

  const cartValidateResponseBody = sanitizeBookingmoodFixture(
    await client.cartValidateRaw({
      items: cartValidateRequest.items as (typeof cartValidateRequest.items),
      couponCodes: [],
    }),
  );

  const searchFixture = {
    capturedAt: new Date().toISOString(),
    endpoint: 'POST https://api.bookingmood.com/v1/search',
    requestBody: searchRequest,
    responseBody: searchResponseBody,
    responseShape: describeBookingmoodSearchResponseShape(searchResponseBody),
  };

  const cartValidateFixture = {
    capturedAt: new Date().toISOString(),
    endpoint: 'POST https://api.bookingmood.com/v1/cart-validate',
    requestBody: cartValidateRequest,
    responseBody: cartValidateResponseBody,
    responseIsArray: Array.isArray(cartValidateResponseBody),
  };

  writeFileSync(
    resolve(FIXTURE_DIR, 'bookingmood-search-dec-2026-raw.json'),
    `${JSON.stringify(searchFixture, null, 2)}\n`,
  );
  writeFileSync(
    resolve(FIXTURE_DIR, 'bookingmood-cart-validate-dec-2026-raw.json'),
    `${JSON.stringify(cartValidateFixture, null, 2)}\n`,
  );
}

const isCli =
  process.argv[1] != null &&
  (process.argv[1].endsWith('bookingmood-worker-fixture-capture.ts') ||
    process.argv[1].endsWith('bookingmood-worker-fixture-capture.cli.js'));

if (isCli) {
  const apiKey = process.env.BOOKINGMOOD_API_KEY?.trim() ?? '';
  if (!apiKey) {
    console.error('Set BOOKINGMOOD_API_KEY (read-only org key) then re-run this script.');
    process.exit(1);
  }
  void captureBookingmoodWorkerFixtures(apiKey).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}