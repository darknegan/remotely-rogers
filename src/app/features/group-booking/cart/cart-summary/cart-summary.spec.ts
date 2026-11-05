import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { BookingApiService } from '../../../../core/services/booking-api.service';
import { CabinAvailability } from '../../../../core/models/booking.models';
import { parseDateKey } from '../../../../core/utils/date-utils';
import { BookingStateService } from '../../booking-state.service';
import { CartSummary } from './cart-summary';

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
    bookingUrl: 'https://example.com/cabins/test',
  };
}

describe('CartSummary checkout entry', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartSummary],
      providers: [
        BookingStateService,
        provideRouter([
          { path: 'group-booking', children: [{ path: 'checkout', component: CartSummary }] },
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

  it('does not navigate to checkout when booking writes are disabled', () => {
    const state = TestBed.inject(BookingStateService);
    state.availabilityMap.set({ 1: sampleQuote(1) });
    state.cabinSelections.set({
      1: {
        cabinId: 1,
        arrival: parseDateKey('2026-08-01'),
        departure: parseDateKey('2026-08-03'),
      },
    });

    const fixture = TestBed.createComponent(CartSummary);
    fixture.detectChanges();

    fixture.componentInstance.continueToCheckout();

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
