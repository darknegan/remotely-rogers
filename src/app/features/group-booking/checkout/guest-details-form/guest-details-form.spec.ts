import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { BookingApiService } from '../../../../core/services/booking-api.service';
import { CabinAvailability } from '../../../../core/models/booking.models';
import { parseDateKey } from '../../../../core/utils/date-utils';
import { BookingStateService } from '../../booking-state.service';
import { GuestDetailsForm } from './guest-details-form';

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

describe('GuestDetailsForm checkout affordance', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestDetailsForm],
      providers: [
        BookingStateService,
        provideRouter([]),
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
  });

  function seedCart(state: BookingStateService): void {
    state.availabilityMap.set({ 1: sampleQuote(1) });
    state.cabinSelections.set({
      1: {
        cabinId: 1,
        arrival: parseDateKey('2026-08-01'),
        departure: parseDateKey('2026-08-03'),
      },
    });
  }

  it('disables Pay now when booking writes are disabled', () => {
    const fixture = TestBed.createComponent(GuestDetailsForm);
    seedCart(fixture.componentInstance['state']);
    fixture.detectChanges();

    const payButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    expect(payButton).toBeTruthy();
    expect(payButton?.disabled).toBe(true);
  });

  it('enables Pay now when booking writes are enabled and cart is ready', () => {
    const fixture = TestBed.createComponent(GuestDetailsForm);
    const state = fixture.componentInstance['state'];
    seedCart(state);
    state.bookingEnabled.set(true);
    fixture.detectChanges();

    const payButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement | null;

    expect(payButton?.disabled).toBe(false);
  });
});
