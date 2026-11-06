import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { BookingApiService } from '../../core/services/booking-api.service';
import { CabinAvailability, GuestDetails } from '../../core/models/booking.models';
import { parseDateKey, startOfDay, toDateKey } from '../../core/utils/date-utils';
import { BookingStateService } from './booking-state.service';

function sampleQuote(cabinId: number): CabinAvailability {
  return {
    cabinId,
    nightlyRate: 120,
    totalPrice: 240,
    currency: 'USD',
    available: true,
    days: { '2026-08-01': 'available', '2026-08-02': 'available' },
    dayRates: {},
    cleaningFee: 0,
    availabilityState: 'ok',
    bookingUrl: `https://example.com/cabins/${cabinId}`,
  };
}

describe('BookingStateService booking write policy', () => {
  let service: BookingStateService;
  let fetchAvailability: ReturnType<typeof vi.fn>;
  let createCheckout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchAvailability = vi.fn(() =>
      of({
        cabins: [sampleQuote(1)],
        bookingEnabled: false,
      }),
    );
    createCheckout = vi.fn(() =>
      of({
        reference: 'REF-1',
        paymentUrl: 'https://www.bookingmood.com/pay/test',
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        BookingStateService,
        provideRouter([]),
        {
          provide: BookingApiService,
          useValue: {
            getConfig: () => CABIN_CONFIG,
            fetchAvailability,
            createCheckout,
            getBookingStatus: vi.fn(),
          },
        },
      ],
    });

    localStorage.clear();
    sessionStorage.clear();
    service = TestBed.inject(BookingStateService);
  });

  function seedCart(): void {
    const arrival = parseDateKey('2026-08-01');
    const departure = parseDateKey('2026-08-03');
    service.availabilityMap.set({ 1: sampleQuote(1) });
    service.cabinSelections.set({
      1: { cabinId: 1, arrival, departure },
    });
  }

  it('defaults bookingEnabled to false and blocks payment, but still opens checkout', () => {
    seedCart();
    expect(service.bookingEnabled()).toBe(false);
    expect(service.canContinue()).toBe(true);
    expect(service.canCheckout()).toBe(false);
  });

  it('prices available nights at $1 when Bookingmood sends no rate', () => {
    const quote = sampleQuote(1);
    quote.nightlyRate = 0;
    quote.days = { '2026-08-01': 'available', '2026-08-02': 'available' };
    service.availabilityMap.set({ 1: quote });
    service.cabinSelections.set({
      1: {
        cabinId: 1,
        arrival: parseDateKey('2026-08-01'),
        departure: parseDateKey('2026-08-03'),
      },
    });

    expect(service.cartItems()[0].totalPrice).toBe(2);
  });

  it('keeps checkout disabled when API omits bookingEnabled', () => {
    fetchAvailability.mockReturnValue(
      of({
        cabins: [sampleQuote(1)],
      }),
    );

    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 14);
    service.setViewStartDate(start);
    service.searchAvailability();

    expect(service.bookingEnabled()).toBe(false);
    expect(service.canCheckout()).toBe(false);
  });

  it('clears bookingEnabled on availability errors', () => {
    fetchAvailability.mockReturnValue(throwError(() => new Error('network')));
    service.bookingEnabled.set(true);

    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 14);
    service.setViewStartDate(start);
    service.searchAvailability();

    expect(service.bookingEnabled()).toBe(false);
    expect(service.canCheckout()).toBe(false);
  });

  it('does not call createCheckout when writes are disabled', () => {
    seedCart();
    const guest: GuestDetails = {
      firstName: 'A',
      lastName: 'B',
      email: 'a@example.com',
    };

    service.submitCheckout(guest);

    expect(createCheckout).not.toHaveBeenCalled();
  });

  it('sizes the calendar window to the fitted day count and refetches once', () => {
    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 20);
    service.setViewStartDate(start);
    service.setViewDayCount(12);
    service.searchAvailability();

    expect(service.timelineDates()).toHaveLength(12);
    expect(fetchAvailability).toHaveBeenCalledTimes(1);

    service.setViewDayCount(18);
    expect(service.timelineDates()).toHaveLength(18);
    expect(fetchAvailability).toHaveBeenCalledTimes(2);

    service.setViewDayCount(18);
    expect(fetchAvailability).toHaveBeenCalledTimes(2);

    service.setViewDayCount(2);
    expect(service.viewDayCount()).toBe(7);
    expect(service.timelineDates()).toHaveLength(7);
  });

  it('calls createCheckout when API enabled booking and cart is ready', () => {
    fetchAvailability.mockReturnValue(
      of({
        cabins: [sampleQuote(1)],
        bookingEnabled: true,
      }),
    );

    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 14);
    service.setViewStartDate(start);
    service.searchAvailability();
    seedCart();

    expect(service.canCheckout()).toBe(true);

    service.submitCheckout({
      firstName: 'A',
      lastName: 'B',
      email: 'a@example.com',
    });

    expect(createCheckout).toHaveBeenCalledTimes(1);
  });
});
