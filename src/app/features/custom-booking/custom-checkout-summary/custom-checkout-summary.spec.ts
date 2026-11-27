import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { BookingStateService } from '../../group-booking/booking-state.service';
import { CustomCheckoutSummary } from './custom-checkout-summary';

describe('CustomCheckoutSummary', () => {
  it('renders disabled Continue to guest details when booking is off', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomCheckoutSummary],
      providers: [
        BookingChannelStateService,
        BookingStateService,
        provideRouter([]),
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

    const group = TestBed.inject(BookingStateService);
    group.bookingEnabled.set(false);

    const fixture = TestBed.createComponent(CustomCheckoutSummary);
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.rr-btn--disabled')?.textContent).toContain('Continue to guest details');
  });
});