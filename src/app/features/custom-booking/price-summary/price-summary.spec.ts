import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

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
      providers: [BookingChannelStateService],
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
    state.selectedProductIds.set([PRODUCT_ID]);
    state.seedOccupancy(PRODUCT_ID);
    state.changeOccupancy(PRODUCT_ID, GROUP_ID, 1);
    state.validatedItems.set([
      {
        id: 'item-1',
        valid: true,
        availabilityMatch: true,
        occupancyMatch: true,
        price: { currency: 'USD', subtotal: 26_400, tax: 0, total: 26_400, deposit: 0 },
      },
    ]);

    const fixture = TestBed.createComponent(PriceSummary);
    summary = fixture.componentInstance;
  });

  it('includes guest count when labeling each cart line', () => {
    const line = state.validatedItems()![0];
    expect(summary.lineLabel(line)).toBe('Black Gum Getaway');
    expect(summary.lineGuests(line)).toBe(2);
    expect(summary.formatGuestCount(summary.lineGuests(line))).toBe('2 guests');
  });
});