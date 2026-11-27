import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  occupancyForCapacityGroup,
  occupancyForSearch,
  resetCapacityGroupCacheForTests,
  resolveOccupancyForAdults,
} from './bookingmood-occupancy';
import { BookingmoodClient } from './bookingmood-client';

const CAPACITY = 'f8558449-6548-4559-8f5d-31448942969d';

describe('resolveOccupancyForAdults', () => {
  beforeEach(() => {
    resetCapacityGroupCacheForTests();
  });

  it('strips surrounding quotes and whitespace from BOOKINGMOOD_CAPACITY_GROUP_ID', async () => {
    const client = { listCapacityGroups: vi.fn() } as unknown as BookingmoodClient;
    const occupancy = await resolveOccupancyForAdults(
      client,
      { BOOKINGMOOD_CAPACITY_GROUP_ID: `  "${CAPACITY}"  `, ASSETS: {} as Fetcher },
      2,
    );
    expect(occupancy).toEqual({ [CAPACITY]: 2 });
  });

  it('uses BOOKINGMOOD_CAPACITY_GROUP_ID when configured', async () => {
    const client = { listCapacityGroups: vi.fn() } as unknown as BookingmoodClient;
    const occupancy = await resolveOccupancyForAdults(client, { BOOKINGMOOD_CAPACITY_GROUP_ID: CAPACITY, ASSETS: {} as Fetcher }, 2);
    expect(occupancy).toEqual({ [CAPACITY]: 2 });
    expect(client.listCapacityGroups).not.toHaveBeenCalled();
  });

  it('fetches the primary capacity group when env is missing', async () => {
    const client = {
      listCapacityGroups: vi.fn().mockResolvedValue([{ id: CAPACITY }]),
    } as unknown as BookingmoodClient;

    const occupancy = await resolveOccupancyForAdults(client, { ASSETS: {} as Fetcher }, 3);
    expect(occupancy).toEqual({ [CAPACITY]: 3 });
  });
});

describe('occupancyForCapacityGroup', () => {
  it('returns an empty object without a valid group id', () => {
    expect(occupancyForCapacityGroup('', 2)).toEqual({});
  });
});

describe('occupancyForSearch', () => {
  it('always sends an empty map so Bookingmood returns priced search rows', () => {
    expect(occupancyForSearch()).toEqual({});
  });
});