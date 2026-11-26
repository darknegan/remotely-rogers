import { describe, expect, it } from 'vitest';

import { customBookingReservationsOff } from './booking-reservations-off';
import { environment as bookingTestWorker } from '../../../environments/environment.booking-test-worker';

describe('customBookingReservationsOff', () => {
  it('is false in the default ng test environment (custom components off)', () => {
    expect(customBookingReservationsOff()).toBe(false);
  });

  it('would be true when custom components are on but checkout is off (test Worker flags file)', () => {
    expect(bookingTestWorker.useCustomBookingComponents).toBe(true);
    expect(bookingTestWorker.bookingmoodChannelBookingEnabled).toBe(false);
    expect(
      bookingTestWorker.useCustomBookingComponents === true &&
        bookingTestWorker.bookingmoodChannelBookingEnabled !== true,
    ).toBe(true);
  });
});