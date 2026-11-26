import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { BookingApiService } from '../../../core/services/booking-api.service';
import { CabinAvailability } from '../../../core/models/booking.models';
import { parseDateKey } from '../../../core/utils/date-utils';
import { BookingStateService } from '../booking-state.service';
import { GroupBookingShell } from './shell';

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

describe('GroupBookingShell reservations-off', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupBookingShell],
      providers: [
        BookingStateService,
        provideRouter([]),
        {
          provide: BookingApiService,
          useValue: {
            getConfig: () => ({
              cabins: [{ id: 1, slug: 'test', name: 'Test Cabin' }],
              maxGuestsPerCabin: 4,
              minNights: 2,
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
    sessionStorage.clear();
  });

  it('shows the browse-only banner only when bookingEnabled is explicitly false', () => {
    const state = TestBed.inject(BookingStateService);
    state.bookingEnabled.set(false);

    const fixture = TestBed.createComponent(GroupBookingShell);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;

    expect(root.textContent).toContain('Reservations are temporarily unavailable');
  });
});