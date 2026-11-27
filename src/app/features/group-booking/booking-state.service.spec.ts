import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { BookingApiService } from '../../core/services/booking-api.service';
import { CabinAvailability, GuestDetails } from '../../core/models/booking.models';
import {
  addDays,
  formatDateRangeLabel,
  parseDateKey,
  startOfDay,
  toDateKey,
} from '../../core/utils/date-utils';
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

  it('does not treat unknown bookingEnabled as reservations-off when the cart is ready', () => {
    seedCart();
    expect(service.bookingEnabled()).toBeNull();
    expect(service.reservationsOff()).toBe(false);
    expect(service.checkoutBlockedByWorker()).toBe(false);
    expect(service.canContinue()).toBe(true);
    expect(service.canCheckout()).toBe(false);
  });

  it('blocks checkout only when availability explicitly returns bookingEnabled false', () => {
    seedCart();
    service.bookingEnabled.set(false);
    expect(service.reservationsOff()).toBe(true);
    expect(service.checkoutBlockedByWorker()).toBe(true);
    expect(service.canContinue()).toBe(true);
    expect(service.canCheckout()).toBe(false);
  });

  it('allows checkout when availability explicitly returns bookingEnabled true', () => {
    seedCart();
    service.bookingEnabled.set(true);
    expect(service.reservationsOff()).toBe(false);
    expect(service.canCheckout()).toBe(true);
  });

  it('keeps continue enabled while availability is loading', () => {
    seedCart();
    service.loading.set(true);
    expect(service.canContinue()).toBe(true);
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

  it('leaves bookingEnabled unknown when API omits bookingEnabled', () => {
    fetchAvailability.mockReturnValue(
      of({
        cabins: [sampleQuote(1)],
      }),
    );

    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 14);
    service.setViewStartDate(start);
    service.searchAvailability();

    expect(service.bookingEnabled()).toBeNull();
    expect(service.reservationsOff()).toBe(false);
    seedCart();
    expect(service.canContinue()).toBe(true);
  });

  it('sets bookingEnabled false only when the API sends false', () => {
    fetchAvailability.mockReturnValue(
      of({
        cabins: [sampleQuote(1)],
        bookingEnabled: false,
      }),
    );

    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 14);
    service.setViewStartDate(start);
    service.searchAvailability();

    expect(service.bookingEnabled()).toBe(false);
    expect(service.reservationsOff()).toBe(true);
  });

  it('preserves bookingEnabled on availability errors', () => {
    fetchAvailability.mockReturnValue(throwError(() => new Error('network')));
    service.bookingEnabled.set(true);

    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 14);
    service.setViewStartDate(start);
    service.searchAvailability();

    expect(service.bookingEnabled()).toBe(true);
    seedCart();
    expect(service.canContinue()).toBe(true);
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

  it('does not add selections shorter than the minimum stay', () => {
    const quote = sampleQuote(1);
    quote.days = { '2026-12-07': 'available' };
    service.availabilityMap.set({ 1: quote });

    service.selectCell(1, parseDateKey('2026-12-07'));
    expect(service.cabinSelections()[1]).toBeUndefined();
    expect(service.selectionError()).toContain('Minimum stay');
  });

  it('legacy grid Dec 7 then Dec 9 charges 3 nights and labels check-out Dec 10', () => {
    const quote = sampleQuote(1);
    quote.days = {
      '2026-12-07': 'available',
      '2026-12-08': 'available',
      '2026-12-09': 'available',
    };
    service.availabilityMap.set({ 1: quote });

    service.selectCell(1, parseDateKey('2026-12-07'));
    expect(service.cabinSelections()[1]).toBeUndefined();

    service.selectCell(1, parseDateKey('2026-12-09'));
    const selection = service.getCabinSelection(1);
    expect(selection).toBeDefined();
    expect(toDateKey(selection!.arrival)).toBe('2026-12-07');
    expect(toDateKey(selection!.departure)).toBe('2026-12-10');
    expect(formatDateRangeLabel(selection!.arrival, selection!.departure)).toBe(
      'Dec 7 – Dec 10 (3 nights)',
    );
  });

  it('drops hydrated cart lines shorter than the minimum stay', () => {
    sessionStorage.setItem(
      'rr-group-booking-cart',
      JSON.stringify({
        guestCount: 2,
        cabinSelections: {
          '1': { cabinId: 1, arrival: '2026-08-01', departure: '2026-08-02' },
        },
        availabilityMap: { 1: sampleQuote(1) },
      }),
    );

    TestBed.resetTestingModule();
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
    const hydrated = TestBed.inject(BookingStateService);
    expect(hydrated.cabinSelections()).toEqual({});
  });

  it('revalidateSavedCart drops stale lines that fail min-stay or availability', () => {
    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 14);
    const departure = addDays(start, 3);
    service.cabinSelections.set({
      1: { cabinId: 1, arrival: start, departure },
    });
    service.guestCount.set(4);
    service.cabinGuestCounts.set({ 1: 4 });

    fetchAvailability.mockReturnValue(
      of({
        cabins: [{ ...sampleQuote(1), available: false }],
        bookingEnabled: false,
      }),
    );

    const done = vi.fn();
    service.revalidateSavedCart(done);
    expect(done).toHaveBeenCalled();
    expect(service.cabinSelections()).toEqual({});
    expect(service.guestCount()).toBe(2);
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
