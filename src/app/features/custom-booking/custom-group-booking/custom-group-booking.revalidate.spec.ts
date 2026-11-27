import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { BookingStateService } from '../../group-booking/booking-state.service';
import { addDays, startOfDay, toDateKey } from '../../../core/utils/date-utils';
import { CustomGroupBooking } from './custom-group-booking';

describe('CustomGroupBooking stale cart', () => {
  it('revalidates saved cart on init and flags adjustments', async () => {
    const fetchAvailability = vi.fn(() =>
      of({
        cabins: [{ cabinId: 1, available: false, days: {}, dayRates: {}, totalPrice: 0, nightlyRate: 0, currency: 'USD', cleaningFee: 0 }],
        bookingEnabled: false,
      }),
    );

    await TestBed.configureTestingModule({
      imports: [CustomGroupBooking],
      providers: [
        BookingChannelStateService,
        BookingStateService,
        provideRouter([]),
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
    }).compileComponents();

    const group = TestBed.inject(BookingStateService);
    const start = startOfDay(new Date());
    start.setDate(start.getDate() + 30);
    const departure = addDays(start, 3);
    group.cabinSelections.set({
      1: { cabinId: 1, arrival: start, departure },
    });
    group.guestCount.set(4);
    group.cabinGuestCounts.set({ 1: 4 });

    const fixture = TestBed.createComponent(CustomGroupBooking);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fetchAvailability).toHaveBeenCalled();
    expect(group.savedCartAdjusted()).toBe(true);
    expect(group.cabinSelections()).toEqual({});
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('saved cart was updated');
  });
});