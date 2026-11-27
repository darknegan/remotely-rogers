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
    state.calendarMonth.set(new Date(2026, 11, 1));
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

  it('rejects blocked ranges before any cabin is selected when every cabin is booked', () => {
    const bookedSpan: Record<string, DayStatus> = {
      '2026-12-23': 'available',
      '2026-12-24': 'booked',
      '2026-12-25': 'booked',
      '2026-12-26': 'booked',
    };
    const quotes: Record<number, ReturnType<typeof workerQuote>> = {};
    for (const cabinId of [1, 2, 3, 4, 5, 6]) {
      quotes[cabinId] = workerQuote(cabinId, bookedSpan);
    }
    state.workerQuotesByCabinId.set(quotes);
    state.selectedProductIds.set([]);

    const checkIn = new Date(2026, 11, 23);
    const checkOut = new Date(2026, 11, 26);
    state.beginDateSelection(checkIn);
    expect(state.stayRangeAllowed(checkIn, checkOut)).toBe(false);
    expect(state.completeStayRange(checkOut)).toBe(false);
    expect(state.rangeConflictError()).toBe(RESERVED_STAY_RANGE_NOTICE);
    expect(state.calendarDayMap()['2026-12-24']).toBe('reserved');
  });

  it('revalidates the existing range after a cabin is selected', () => {
    const openSpan: Record<string, DayStatus> = {
      '2026-12-10': 'available',
      '2026-12-11': 'available',
      '2026-12-12': 'available',
      '2026-12-13': 'available',
    };
    state.workerQuotesByCabinId.set({
      1: workerQuote(1, {
        '2026-12-10': 'available',
        '2026-12-11': 'booked',
        '2026-12-12': 'booked',
        '2026-12-13': 'booked',
      }),
      2: workerQuote(2, openSpan),
    });
    state.selectedProductIds.set([]);

    const checkIn = new Date(2026, 11, 10);
    const checkOut = new Date(2026, 11, 13);
    state.setDates(checkIn, checkOut);
    expect(state.rangeConflictError()).toBeNull();

    state.toggleProductSelection(BOOKINGMOOD_PRODUCT_IDS[1]!);
    expect(state.rangeConflictError()).toBe(RESERVED_STAY_RANGE_NOTICE);
  });

  it('rejects Dec 23-26 when Worker marks Dec 24-25 booked', () => {
    const checkIn = new Date(2026, 11, 23);
    const checkOut = new Date(2026, 11, 26);
    state.beginDateSelection(checkIn);
    expect(state.stayRangeAllowed(checkIn, checkOut)).toBe(false);
    expect(state.isProductSelectable(BOOKINGMOOD_PRODUCT_IDS[1]!)).toBe(false);
    expect(state.completeStayRange(checkOut)).toBe(false);
    expect(state.rangeConflictError()).toBe(RESERVED_STAY_RANGE_NOTICE);
    expect(state.checkIn()).toBeNull();
    expect(state.checkOut()).toBeNull();
  });
});