import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { BookingApiService } from '../../../core/services/booking-api.service';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { DEV_BOOKINGMOOD_CHANNEL_ID } from '../../../core/booking/channel/bookingmood-channel-allowlist';
import { PriceSummary } from './price-summary';

const PRODUCT_ID = '936c1ff7-2900-410b-9ced-cc2cf6ec3b65';
const GROUP_ID = 'f8558449-6548-4559-8f5d-31448942969d';

describe('PriceSummary cart rows', () => {
  let summary: PriceSummary;
  let state: BookingChannelStateService;

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
                    totalPrice: 264,
                    nightlyRate: 88,
                    currency: 'USD',
                    available: true,
                    days: {},
                    dayRates: {},
                    cleaningFee: 75,
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
    state = TestBed.inject(BookingChannelStateService);
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
    state.setDates(new Date(2026, 11, 7), new Date(2026, 11, 10));
    state.selectedProductIds.set([PRODUCT_ID]);
    state.seedOccupancy(PRODUCT_ID);
    state.changeOccupancy(PRODUCT_ID, GROUP_ID, 1);
    state.workerQuotesByProduct.set({
      [PRODUCT_ID]: {
        cabinId: 1,
        totalPrice: 264,
        nightlyRate: 88,
        currency: 'USD',
        available: true,
        days: {},
        dayRates: {},
        cleaningFee: 75,
      },
    });

    const fixture = TestBed.createComponent(PriceSummary);
    summary = fixture.componentInstance;
  });

  it('includes guest count when labeling each cart line', () => {
    expect(summary.lineLabelForProduct(PRODUCT_ID)).toBe('Black Gum Getaway');
    expect(summary.guestsForProduct(PRODUCT_ID)).toBe(2);
    expect(summary.formatGuestCount(summary.guestsForProduct(PRODUCT_ID))).toBe('2 guests');
  });

  it('reads worker quote dollars for each line', () => {
    expect(state.workerTotalDollars()).toBe(264);
  });
});