import { describe, expect, it } from 'vitest';

import { addDays, startOfDay } from '../utils/date-utils';
import { MAX_GUESTS_PER_CABIN, MIN_NIGHTS, SearchState } from './search-state.service';

describe('SearchState', () => {
  it('keeps adults, children, and infants within 4 guests', () => {
    const state = new SearchState();
    state.setAdults(3);
    state.setChildren(2);
    state.setInfants(2);

    expect(state.partySize()).toBeLessThanOrEqual(MAX_GUESTS_PER_CABIN);
    expect(state.adults()).toBeGreaterThanOrEqual(1);
  });

  it('does not let a full cabin add another guest', () => {
    const state = new SearchState();
    state.setAdults(4);
    state.setChildren(1);

    expect(state.adults()).toBe(4);
    expect(state.children()).toBe(0);
    expect(state.partySize()).toBe(4);
  });

  it('caps pets at one', () => {
    const state = new SearchState();
    state.setPets(3);
    expect(state.pets()).toBe(1);
  });

  it('rejects stays shorter than the 2-night minimum', () => {
    const state = new SearchState();
    const arrival = addDays(startOfDay(new Date()), 10);
    state.setCheckIn(arrival);
    state.setCheckOut(addDays(arrival, 1));

    expect(state.dateError()).toBe(`Minimum stay is ${MIN_NIGHTS} nights.`);
    expect(state.canSearch()).toBe(false);
  });

  it('allows a 2-night stay', () => {
    const state = new SearchState();
    const arrival = addDays(startOfDay(new Date()), 10);
    state.setCheckIn(arrival);
    state.setCheckOut(addDays(arrival, MIN_NIGHTS));

    expect(state.dateError()).toBeNull();
    expect(state.canSearch()).toBe(true);
  });
});
