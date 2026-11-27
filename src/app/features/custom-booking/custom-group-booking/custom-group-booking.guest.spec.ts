import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { DEV_BOOKINGMOOD_CHANNEL_ID } from '../../../core/booking/channel/bookingmood-channel-allowlist';
import { BOOKINGMOOD_PRODUCT_IDS } from '../../../core/booking/bookingmood-products';
import { BookingStateService } from '../../group-booking/booking-state.service';
import { CustomGroupBooking } from './custom-group-booking';

const GROUP_ID = 'f8558449-6548-4559-8f5d-31448942969d';

describe('CustomGroupBooking guest display', () => {
  let component: CustomGroupBooking;
  let channel: BookingChannelStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CustomGroupBooking],
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
    });
    channel = TestBed.inject(BookingChannelStateService);
    channel.channelPayload.set({
      channel: { id: DEV_BOOKINGMOOD_CHANNEL_ID, bookable: false },
      organization: { capacity_groups: [{ id: GROUP_ID, name: { default: 'Guests' } }] },
      products: [
        {
          id: BOOKINGMOOD_PRODUCT_IDS[1],
          name: { default: 'Black Gum Getaway' },
          capacity: { [GROUP_ID]: { min: 1, max: 2 } },
          services: [],
        },
      ],
    });

    const fixture = TestBed.createComponent(CustomGroupBooking);
    component = fixture.componentInstance;
  });

  it('sleeps badge uses Bookingmood max (not site listing copy)', () => {
    expect(component.sleepsMax(1)).toBe(2);
  });

  it('guestSummary sums stepper occupancy for selected cabins', () => {
    channel.setDates(new Date(2026, 11, 7), new Date(2026, 11, 9));
    channel.selectedProductIds.set([BOOKINGMOOD_PRODUCT_IDS[1]]);
    channel.seedOccupancy(BOOKINGMOOD_PRODUCT_IDS[1]);
    channel.changeOccupancy(BOOKINGMOOD_PRODUCT_IDS[1], GROUP_ID, 1);
    expect(component.guestSummary()).toBe('2 guests');
  });
});