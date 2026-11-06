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
              cabins: [
              { id: 1, slug: 'test', name: 'Test Cabin' },
              { id: 2, slug: 'test-2', name: 'Second Cabin' },
            ],
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
    sessionStorage.clear();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('opens the Bookingmood widget on the single selected cabin', () => {
    const state = TestBed.inject(BookingStateService);
    state.availabilityMap.set({ 1: sampleQuote(1) });
    state.cabinSelections.set({
      1: {
        cabinId: 1,
        arrival: parseDateKey('2026-08-01'),
        departure: parseDateKey('2026-08-03'),
      },
    });

    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    const url = new URL(fixture.componentInstance.widgetUrl());

    expect(url.hostname).toBe('www.bookingmood.com');
    expect(url.searchParams.get('product_id')).toBe('936c1ff7-2900-410b-9ced-cc2cf6ec3b65');
    expect(url.searchParams.get('start')).toBe('2026-08-01');
    expect(url.searchParams.get('end')).toBe('2026-08-03');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('keeps the shopping cart open when several cabins are selected', () => {
    const state = TestBed.inject(BookingStateService);
    state.availabilityMap.set({ 1: sampleQuote(1), 2: sampleQuote(2) });
    state.cabinSelections.set({
      1: {
        cabinId: 1,
        arrival: parseDateKey('2026-08-01'),
        departure: parseDateKey('2026-08-03'),
      },
      2: {
        cabinId: 2,
        arrival: parseDateKey('2026-08-01'),
        departure: parseDateKey('2026-08-03'),
      },
    });

    const fixture = TestBed.createComponent(CheckoutPage);
    fixture.detectChanges();
    const url = new URL(fixture.componentInstance.widgetUrl());

    expect(url.searchParams.has('product_id')).toBe(false);
    expect(url.searchParams.has('start')).toBe(false);
  });
});
