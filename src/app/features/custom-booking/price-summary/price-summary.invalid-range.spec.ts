import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { DEV_BOOKINGMOOD_CHANNEL_ID } from '../../../core/booking/channel/bookingmood-channel-allowlist';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { BOOKINGMOOD_PRODUCT_IDS } from '../../../core/booking/bookingmood-products';
import { PriceSummary } from './price-summary';

const GROUP_ID = 'f8558449-6548-4559-8f5d-31448942969d';
const PRODUCT_ID = BOOKINGMOOD_PRODUCT_IDS[1]!;

describe('PriceSummary invalid date ranges', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PriceSummary],
      providers: [
        BookingChannelStateService,
        {
          provide: BookingApiService,
          useValue: {
            getConfig: () => CABIN_CONFIG,
            fetchAvailability: vi.fn(() =>
              of({
                cabins: [
                  {
                    cabinId: 1,
                    totalPrice: 132,
                    nightlyRate: 132,
                    currency: 'USD',
                    available: true,
                    days: {},
                    dayRates: {},
                    cleaningFee: 0,
                  },
                ],
                bookingEnabled: false,
              }),
            ),
            createCheckout: vi.fn(),
            getBookingStatus: vi.fn(),
          },
        },
      ],
    });
  });

  it('shows dashes instead of dollar amounts when below minimum stay', () => {
    const state = TestBed.inject(BookingChannelStateService);
    state.channelPayload.set({
      channel: { id: DEV_BOOKINGMOOD_CHANNEL_ID, bookable: false },
      organization: { capacity_groups: [{ id: GROUP_ID, name: { default: 'Guests' } }] },
      products: [
        {
          id: PRODUCT_ID,
          name: { default: 'Black Gum Getaway' },
          capacity: { [GROUP_ID]: { min: 1, max: 2 } },
          services: [],
        },
      ],
    });
    state.setDates(new Date(2026, 11, 7), new Date(2026, 11, 8));
    state.selectedProductIds.set([PRODUCT_ID]);

    const fixture = TestBed.createComponent(PriceSummary);
    fixture.detectChanges();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;
    expect(state.pricingReady()).toBe(false);
    expect(html).not.toContain('$132');
    expect(html).toContain('—');
  });
});