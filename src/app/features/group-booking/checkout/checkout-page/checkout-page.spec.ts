import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { BookingApiService } from '../../../../core/services/booking-api.service';
import { CabinAvailability } from '../../../../core/models/booking.models';
import { parseDateKey } from '../../../../core/utils/date-utils';
import { BookingStateService } from '../../booking-state.service';
import { CheckoutPage } from './checkout-page';

function sampleQuote(cabinId: number): CabinAvailability {
  return {
    cabinId,
    nightlyRate: 120,
    totalPrice: 240,
    currency: 'USD',
    available: true,
    days: {},
    dayRates: {},
    cleaningFee: 0,
    availabilityState: 'ok',
    bookingUrl: 'https://example.com/cabins/test',
  };
}

describe('CheckoutPage direct URL guard', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        BookingStateService,
        provideRouter([
          { path: 'group-booking', component: CheckoutPage },
          { path: 'group-booking/checkout', component: CheckoutPage },
        ]),
        {
          provide: BookingApiService,
          useValue: {
            getConfig: () => ({
              cabins: [{ id: 1, slug: 'test', name: 'Test Cabin' }],
              maxGuestsPerCabin: 8,
              minNights: 1,
            }),
            fetchAvailability: vi.fn(() =>
              of({ cabins: [sampleQuote(1)], bookingEnabled: false }),
            ),
            createCheckout: vi.fn(),
            getBookingStatus: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    localStorage.clear();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('redirects away from checkout when writes are disabled even with cart items', async () => {
    const state = TestBed.inject(BookingStateService);
    state.availabilityMap.set({ 1: sampleQuote(1) });
    state.cabinSelections.set({
      1: {
        cabinId: 1,
        arrival: parseDateKey('2026-08-01'),
        departure: parseDateKey('2026-08-03'),
      },
    });
    expect(state.cartItems().length).toBeGreaterThan(0);
    expect(state.bookingEnabled()).toBe(false);

    TestBed.createComponent(CheckoutPage);
    await vi.waitFor(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/group-booking'], {
        queryParamsHandling: 'preserve',
      });
    });
  });
});
