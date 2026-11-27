import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { DayStatus } from '../../models/booking.models';
import { BookingApiService } from '../../services/booking-api.service';
import { RESERVED_STAY_RANGE_NOTICE } from './booking-channel-calendar';
import { BookingChannelStateService } from './booking-channel-state.service';
import { BOOKINGMOOD_PRODUCT_IDS } from '../bookingmood-products';

function workerQuote(cabinId: number, days: Record<string, DayStatus>) {
  return {
    cabinId,
    nightlyRate: 120,
    totalPrice: 360,
    currency: 'USD',
    available: true,
    days,
    dayRates: {},
    cleaningFee: 0,
  };
}

describe('BookingChannelStateService worker dayStatuses', () => {
  let state: BookingChannelStateService;
  const fetchAvailability = vi.fn();

  beforeEach(() => {
    fetchAvailability.mockReturnValue(
      of({
        cabins: [
          workerQuote(1, {
            '2026-12-23': 'available',
            '2026-12-24': 'booked',
            '2026-12-25': 'booked',
            '2026-12-26': 'available',
          }),
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
    state.workerQuotesByCabinId.set({
      1: workerQuote(1, {
        '2026-12-23': 'available',
        '2026-12-24': 'booked',
        '2026-12-25': 'booked',
        '2026-12-26': 'available',
      }),
    });
    state.selectedProductIds.set([BOOKINGMOOD_PRODUCT_IDS[1]!]);
  });

  it('rejects Dec 23-26 when Worker marks Dec 24-25 booked', () => {
    const checkIn = new Date(2026, 11, 23);
    const checkOut = new Date(2026, 11, 26);
    state.beginDateSelection(checkIn);
    expect(state.stayRangeAllowed(checkIn, checkOut)).toBe(false);
    expect(state.isProductSelectable(BOOKINGMOOD_PRODUCT_IDS[1]!)).toBe(false);
    expect(state.completeStayRange(checkOut)).toBe(false);
    expect(state.rangeConflictError()).toBe(RESERVED_STAY_RANGE_NOTICE);
  });
});