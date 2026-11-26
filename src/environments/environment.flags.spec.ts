import { describe, expect, it } from 'vitest';

import { environment as bookingTestWorker } from './environment.booking-test-worker';
import { environment as bookingWorker } from './environment.booking-worker';
import { environment as prod } from './environment.prod';
import { environment as siteWorker } from './environment.site-worker';

describe('production booking safety flags', () => {
  it('keeps custom components and channel checkout off on production builds', () => {
    for (const env of [prod, siteWorker, bookingWorker]) {
      expect(env.useCustomBookingComponents).toBe(false);
      expect(env.bookingmoodChannelBookingEnabled).toBe(false);
    }
  });

  it('enables custom components only on the isolated test Worker environment file', () => {
    expect(bookingTestWorker.useCustomBookingComponents).toBe(true);
    expect(bookingTestWorker.bookingmoodChannelBookingEnabled).toBe(false);
  });
});