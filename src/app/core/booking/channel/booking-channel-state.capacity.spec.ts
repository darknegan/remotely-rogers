import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { BookingChannelStateService } from './booking-channel-state.service';
import { DEV_BOOKINGMOOD_CHANNEL_ID } from './bookingmood-channel-allowlist';
import { BookingmoodChannelPayload } from './bookingmood-channel.types';

const PRODUCT_ID = '936c1ff7-2900-410b-9ced-cc2cf6ec3b65';
const GROUP_ID = 'f8558449-6548-4559-8f5d-31448942969d';

function payloadWithMax(max: number): BookingmoodChannelPayload {
  return {
    channel: { id: DEV_BOOKINGMOOD_CHANNEL_ID, bookable: false },
    organization: {
      capacity_groups: [{ id: GROUP_ID, name: { default: '' } }],
    },
    products: [
      {
        id: PRODUCT_ID,
        name: { default: 'Black Gum Getaway' },
        capacity: { [GROUP_ID]: { min: 1, max } },
        services: [],
      },
    ],
  };
}

describe('BookingChannelStateService capacity', () => {
  let service: BookingChannelStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookingChannelStateService],
    });
    service = TestBed.inject(BookingChannelStateService);
  });

  it('uses product capacity max from the channel API (not hardcoded site copy)', () => {
    service.channelPayload.set(payloadWithMax(2));
    expect(service.maxGuestsForProduct(PRODUCT_ID)).toBe(2);

    service.selectedProductIds.set([PRODUCT_ID]);
    service.seedOccupancy(PRODUCT_ID);
    expect(service.totalGuestsForProduct(PRODUCT_ID)).toBe(1);

    service.changeOccupancy(PRODUCT_ID, GROUP_ID, 10);
    expect(service.totalGuestsForProduct(PRODUCT_ID)).toBe(2);
  });

  it('respects a different API max when capacity changes', () => {
    service.channelPayload.set(payloadWithMax(4));
    expect(service.maxGuestsForProduct(PRODUCT_ID)).toBe(4);
    service.selectedProductIds.set([PRODUCT_ID]);
    service.seedOccupancy(PRODUCT_ID);
    service.changeOccupancy(PRODUCT_ID, GROUP_ID, 3);
    expect(service.totalGuestsForProduct(PRODUCT_ID)).toBe(4);
  });

  it('totalSelectedGuests reflects stepper occupancy for selected cabins', () => {
    service.channelPayload.set(payloadWithMax(2));
    service.selectedProductIds.set([PRODUCT_ID]);
    service.seedOccupancy(PRODUCT_ID);
    expect(service.totalSelectedGuests()).toBe(1);
    service.changeOccupancy(PRODUCT_ID, GROUP_ID, 1);
    expect(service.totalSelectedGuests()).toBe(2);
  });

  it('falls back to Bookingmood capacity max (2) when channel capacity is missing', () => {
    expect(service.maxGuestsForProduct(PRODUCT_ID)).toBe(2);
    service.selectedProductIds.set([PRODUCT_ID]);
    service.seedOccupancy(PRODUCT_ID);
    service.changeOccupancy(PRODUCT_ID, GROUP_ID, 5);
    expect(service.totalGuestsForProduct(PRODUCT_ID)).toBe(2);
  });
});