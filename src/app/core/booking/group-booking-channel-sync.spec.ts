import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { BookingApiService } from '../../core/services/booking-api.service';
import { CabinAvailability } from '../../core/models/booking.models';
import { parseDateKey } from '../../core/utils/date-utils';
import { BookingChannelStateService } from './channel/booking-channel-state.service';
import { BookingmoodChannelPayload } from './channel/bookingmood-channel.types';
import { syncChannelFromGroupBooking } from './group-booking-channel-sync';
import { BOOKINGMOOD_PRODUCT_IDS } from './bookingmood-products';

const GROUP_ID = 'f8558449-6548-4559-8f5d-31448942969d';

function channelPayload(): BookingmoodChannelPayload {
  return {
    channel: { id: 'test', bookable: false },
    organization: { capacity_groups: [{ id: GROUP_ID, name: { default: 'Guests' } }] },
    products: [
      {
        id: BOOKINGMOOD_PRODUCT_IDS[1],
        name: { default: 'Black Gum' },
        capacity: { [GROUP_ID]: { min: 1, max: 4 } },
        services: [],
      },
    ],
  };
}
import { BookingStateService } from '../../features/group-booking/booking-state.service';

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

describe('syncChannelFromGroupBooking', () => {
  let group: BookingStateService;
  let channel: BookingChannelStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        BookingStateService,
        BookingChannelStateService,
        provideRouter([]),
        {
          provide: BookingApiService,
          useValue: {
            getConfig: () => CABIN_CONFIG,
            fetchAvailability: vi.fn(() => of({ cabins: [sampleQuote(1)], bookingEnabled: false })),
            createCheckout: vi.fn(),
            getBookingStatus: vi.fn(),
          },
        },
      ],
    });
    group = TestBed.inject(BookingStateService);
    channel = TestBed.inject(BookingChannelStateService);
  });

  it('copies legacy cart cabins, dates, and guest count into channel state', () => {
    channel.channelPayload.set(channelPayload());
    group.guestCount.set(3);
    group.availabilityMap.set({ 1: sampleQuote(1) });
    group.cabinSelections.set({
      1: {
        cabinId: 1,
        arrival: parseDateKey('2026-12-07'),
        departure: parseDateKey('2026-12-09'),
      },
    });

    expect(syncChannelFromGroupBooking(channel, group)).toBe(true);
    expect(channel.nights()).toBe(2);
    expect(channel.selectedProductIds().length).toBe(1);
    expect(channel.totalGuestsForProduct(channel.selectedProductIds()[0])).toBe(3);
  });
});