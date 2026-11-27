import { describe, expect, it } from 'vitest';

import { BOOKINGMOOD_PRODUCT_IDS } from '../../../src/app/core/booking/bookingmood-products';
import { captureBookingmoodWorkerFixtures } from './bookingmood-worker-fixture-capture';

const apiKey = process.env.BOOKINGMOOD_API_KEY?.trim() ?? '';

describe.skipIf(!apiKey)('BookingmoodClient live fixture capture', () => {
  it('captures raw /search and /cart-validate via BookingmoodClient', async () => {
    await captureBookingmoodWorkerFixtures(apiKey);
    expect(Object.values(BOOKINGMOOD_PRODUCT_IDS).length).toBe(6);
  }, 60_000);
});