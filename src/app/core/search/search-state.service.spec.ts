import { describe, expect, it } from 'vitest';

import {
  clampGuests,
  guestStepperLimits,
  MAX_CABIN_GUESTS,
  MIN_STAY_NIGHTS,
  SearchStateService,
} from './search-state.service';
import { startOfDay, validateDateRange } from '../utils/date-utils';

describe('clampGuests', () => {
  it('caps adults and children at 4 total guests', () => {
    expect(clampGuests({ adults: 3, children: 3, infants: 0, pets: 0 })).toEqual({
      adults: 3,
      children: 1,
      infants: 0,
      pets: 0,
    });
  });

  it('requires at least one adult', () => {
    expect(clampGuests({ adults: 0, children: 2, infants: 0, pets: 0 }).adults).toBe(1);
  });

  it('limits infants and pets', () => {
    expect(clampGuests({ adults: 2, children: 0, infants: 5, pets: 3 })).toEqual({
      adults: 2,
      children: 0,
      infants: 2,
      pets: 1,
    });
  });
});

describe('guestStepperLimits', () => {
  it('prevents raising children when adults already fill the cabin', () => {
    const guests = { adults: 4, children: 0, infants: 0, pets: 0 };
    expect(guestStepperLimits(guests, 'children').max).toBe(0);
  });
});

describe('SearchStateService', () => {
  it('enforces the 2-night minimum through date validation', () => {
    const service = new SearchStateService();
    const arrival = startOfDay(new Date());
    arrival.setDate(arrival.getDate() + 10);
    const departure = startOfDay(new Date(arrival));
    departure.setDate(departure.getDate() + 1);

    service.setCheckIn(arrival);
    service.setCheckOut(departure);

    expect(validateDateRange(arrival, departure, MIN_STAY_NIGHTS)).toBe(
      `Minimum stay is ${MIN_STAY_NIGHTS} nights.`,
    );
    expect(service.dateError()).toBe(`Minimum stay is ${MIN_STAY_NIGHTS} nights.`);
    expect(service.canSearch()).toBe(false);
  });

  it('accepts a valid stay and builds query params', () => {
    const service = new SearchStateService();
    const arrival = startOfDay(new Date());
    arrival.setDate(arrival.getDate() + 14);
    const departure = startOfDay(new Date(arrival));
    departure.setDate(departure.getDate() + 3);

    service.setCheckIn(arrival);
    service.setCheckOut(departure);
    service.setGuests({ adults: 2, children: 1, infants: 0, pets: 1 });

    expect(service.dateError()).toBeNull();
    expect(service.canSearch()).toBe(true);
    expect(service.guestSummary()).toBe('3 guests · 1 pet');
    expect(service.toQueryParams()).toEqual({
      checkIn: arrival.toISOString().slice(0, 10),
      checkOut: departure.toISOString().slice(0, 10),
      adults: '2',
      children: '1',
      infants: '0',
      pets: '1',
    });
  });

  it('reports when the guest cap is reached', () => {
    const service = new SearchStateService();
    service.setGuests({ adults: 2, children: 2, infants: 0, pets: 0 });

    expect(service.totalPeople()).toBe(MAX_CABIN_GUESTS);
    expect(service.capNote()).toContain('reached the limit');
  });
});
