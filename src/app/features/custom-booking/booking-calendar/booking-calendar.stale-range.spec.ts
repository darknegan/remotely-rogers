import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { BOOKINGMOOD_PRODUCT_IDS } from '../../../core/booking/bookingmood-products';
import { BookingCalendar } from './booking-calendar';

describe('BookingCalendar after refused range', () => {
  let state: BookingChannelStateService;
  let calendar: BookingCalendar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingCalendar],
      providers: [
        BookingChannelStateService,
        {
          provide: BookingApiService,
          useValue: {
            getConfig: () => CABIN_CONFIG,
            fetchAvailability: vi.fn(() => of({ cabins: [], bookingEnabled: false })),
            createCheckout: vi.fn(),
            getBookingStatus: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    state = TestBed.inject(BookingChannelStateService);
    state.calendarMonth.set(new Date(2026, 11, 1));
    state.workerQuotesByCabinId.set({
      1: {
        cabinId: 1,
        nightlyRate: 132,
        totalPrice: 396,
        currency: 'USD',
        available: true,
        days: (() => {
          const days: Record<string, 'available' | 'booked'> = {
            '2026-12-24': 'booked',
            '2026-12-25': 'booked',
            '2026-12-26': 'available',
            '2026-12-23': 'available',
          };
          for (let day = 10; day <= 22; day++) {
            days[`2026-12-${String(day).padStart(2, '0')}`] = 'available';
          }
          return days;
        })(),
        dayRates: {},
        cleaningFee: 0,
      },
    });
    state.selectedProductIds.set([BOOKINGMOOD_PRODUCT_IDS[1]!]);

    const fixture = TestBed.createComponent(BookingCalendar);
    calendar = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('clears selection after a refused range and starts fresh on the next click', () => {
    state.beginDateSelection(new Date(2026, 11, 23));
    expect(state.completeStayRange(new Date(2026, 11, 26))).toBe(false);
    expect(state.checkIn()).toBeNull();
    expect(state.checkOut()).toBeNull();

    calendar.pickDay(new Date(2026, 11, 10));
    expect(state.checkIn()?.getDate()).toBe(10);
    expect(state.checkOut()).toBeNull();
  });

  it('allows check-out on the first reserved night when only occupied nights are free', () => {
    state.beginDateSelection(new Date(2026, 11, 10));
    calendar.pickDay(new Date(2026, 11, 24));
    expect(state.checkOut()?.getDate()).toBe(24);
    expect(state.rangeConflictError()).toBeNull();
  });

  it('lets guests click the first reserved day as check-out after check-in', () => {
    state.beginDateSelection(new Date(2026, 11, 10));
    expect(calendar.dayIsDisabled('reserved', new Date(2026, 11, 24))).toBe(false);
    expect(calendar.dayIsDisabled('reserved', new Date(2026, 11, 25))).toBe(true);
    expect(calendar.dayIsDisabled('reserved', new Date(2026, 11, 10))).toBe(true);

    calendar.pickDay(new Date(2026, 11, 24));
    expect(state.checkOut()?.getDate()).toBe(24);
    expect(state.checkIn()?.getDate()).toBe(10);
    expect(state.rangeConflictError()).toBeNull();
  });
});