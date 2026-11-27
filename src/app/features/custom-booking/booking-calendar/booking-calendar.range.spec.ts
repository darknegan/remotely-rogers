import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { RESERVED_STAY_RANGE_NOTICE } from '../../../core/booking/channel/booking-channel-calendar';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { BOOKINGMOOD_PRODUCT_IDS } from '../../../core/booking/bookingmood-products';
import { BookingCalendar } from './booking-calendar';

describe('BookingCalendar reserved ranges', () => {
  let channel: BookingChannelStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BookingCalendar],
      providers: [
        BookingChannelStateService,
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
    channel.availabilityByProduct.set({
      [BOOKINGMOOD_PRODUCT_IDS[1]!]: {
        product_id: BOOKINGMOOD_PRODUCT_IDS[1]!,
        events: [{ type: 'booking', start_date: '2026-12-24', end_date: '2026-12-26', status: 'confirmed' }],
        price_calendar_entries: [],
      },
    });
    channel.selectedProductIds.set([BOOKINGMOOD_PRODUCT_IDS[1]!]);
    channel.beginDateSelection(new Date(2026, 11, 23));
  });

  it('blocks checkout ranges that cross reserved nights', () => {
    const ok = channel.completeStayRange(new Date(2026, 11, 26));
    expect(ok).toBe(false);
    expect(channel.rangeConflictError()).toBe(RESERVED_STAY_RANGE_NOTICE);
    expect(channel.checkOut()).toBeNull();
    expect(channel.checkIn()).toBeNull();
  });
});