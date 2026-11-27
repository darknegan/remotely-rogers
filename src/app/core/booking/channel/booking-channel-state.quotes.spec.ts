import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { BookingApiService } from '../../services/booking-api.service';
import { BookingChannelStateService } from './booking-channel-state.service';
import { BookingmoodChannelError } from './bookingmood-channel-client';
import { BOOKINGMOOD_PRODUCT_IDS } from '../bookingmood-products';

describe('BookingChannelStateService worker quotes', () => {
  let state: BookingChannelStateService;
  const fetchAvailability = vi.fn();

  beforeEach(() => {
    fetchAvailability.mockReturnValue(
      of({
        cabins: [
          {
            cabinId: 1,
            totalPrice: 312,
            nightlyRate: 104,
            currency: 'USD',
            available: true,
            days: {},
            dayRates: {},
            cleaningFee: 75,
          },
        ],
        bookingEnabled: false,
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        BookingChannelStateService,
        {
          provide: BookingApiService,
          useValue: {
            getConfig: () => CABIN_CONFIG,
            fetchAvailability,
            createCheckout: vi.fn(),
            getBookingStatus: vi.fn(),
          },
        },
      ],
    });
    state = TestBed.inject(BookingChannelStateService);
    state.setDates(new Date(2026, 11, 7), new Date(2026, 11, 10));
    state.selectedProductIds.set([BOOKINGMOOD_PRODUCT_IDS[1]!]);
    state.seedOccupancy(BOOKINGMOOD_PRODUCT_IDS[1]!);
  });

  it('changeOccupancy re-runs worker quote refresh', () => {
    const GROUP_ID = 'f8558449-6548-4559-8f5d-31448942969d';
    fetchAvailability.mockClear();
    state.changeOccupancy(BOOKINGMOOD_PRODUCT_IDS[1]!, GROUP_ID, 1);
    expect(fetchAvailability).toHaveBeenCalled();
  });

  it('loads display pricing from Worker /api/availability', () => {
    state.refreshWorkerQuotes();
    expect(fetchAvailability).toHaveBeenCalled();
    expect(state.workerPriceLines()[0]?.subtotalDollars).toBe(312);
  });

  it('maps channel_not_bookable to friendly guest copy', () => {
    const message = state.guestFacingChannelError(
      new BookingmoodChannelError(403, 'channel_not_bookable', "This channel doesn't accept bookings"),
    );
    expect(message).not.toMatch(/channel_not_bookable/i);
    expect(message).toMatch(/unavailable/i);
  });
});