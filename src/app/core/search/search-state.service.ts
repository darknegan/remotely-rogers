import { computed, Injectable, signal } from '@angular/core';

import { nightCount, parseDateKey, startOfDay, validateDateRange } from '../utils/date-utils';

export interface GuestCounts {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export const MAX_CABIN_GUESTS = 4;
export const MIN_STAY_NIGHTS = 2;

const DEFAULT_GUESTS: GuestCounts = {
  adults: 2,
  children: 0,
  infants: 0,
  pets: 0,
};

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  readonly checkIn = signal<Date | null>(null);
  readonly checkOut = signal<Date | null>(null);
  readonly guests = signal<GuestCounts>({ ...DEFAULT_GUESTS });

  readonly totalPeople = computed(() => {
    const { adults, children } = this.guests();
    return adults + children;
  });

  readonly guestSummary = computed(() => {
    const { adults, children, infants, pets } = this.guests();
    const people = adults + children;
    const parts = [`${people} guest${people === 1 ? '' : 's'}`];

    if (infants > 0) {
      parts.push(`${infants} infant${infants === 1 ? '' : 's'}`);
    }

    if (pets > 0) {
      parts.push(`${pets} pet${pets === 1 ? '' : 's'}`);
    }

    return parts.join(' · ');
  });

  readonly capNote = computed(() =>
    this.totalPeople() >= MAX_CABIN_GUESTS
      ? 'Each cabin sleeps 4 — you’ve reached the limit.'
      : 'Each cabin sleeps up to 4 guests.',
  );

  readonly dateError = computed(() =>
    validateDateRange(this.checkIn(), this.checkOut(), MIN_STAY_NIGHTS),
  );

  readonly nights = computed(() => {
    const arrival = this.checkIn();
    const departure = this.checkOut();
    if (!arrival || !departure) {
      return 0;
    }

    return nightCount(arrival, departure);
  });

  readonly canSearch = computed(
    () => !this.dateError() && this.checkIn() !== null && this.checkOut() !== null,
  );

  setCheckIn(value: Date | null): void {
    this.checkIn.set(value ? startOfDay(value) : null);
  }

  setCheckOut(value: Date | null): void {
    this.checkOut.set(value ? startOfDay(value) : null);
  }

  setGuests(value: GuestCounts): void {
    this.guests.set(clampGuests(value));
  }

  updateGuestCount(key: keyof GuestCounts, value: number): void {
    this.guests.update((current) => clampGuests({ ...current, [key]: value }));
  }

  resetGuests(): void {
    this.guests.set({ ...DEFAULT_GUESTS });
  }

  clearDates(): void {
    this.checkIn.set(null);
    this.checkOut.set(null);
  }

  fromQueryParams(params: Partial<Record<string, string | null | undefined>>): void {
    const checkIn = params['checkIn'];
    const checkOut = params['checkOut'];

    if (checkIn) {
      this.setCheckIn(parseDateKey(checkIn));
    }

    if (checkOut) {
      this.setCheckOut(parseDateKey(checkOut));
    }

    const adults = Number(params['adults']);
    const children = Number(params['children']);
    const infants = Number(params['infants']);
    const pets = Number(params['pets']);

    if (
      params['adults'] !== undefined ||
      params['children'] !== undefined ||
      params['infants'] !== undefined ||
      params['pets'] !== undefined
    ) {
      this.setGuests({
        adults: Number.isFinite(adults) && adults > 0 ? adults : DEFAULT_GUESTS.adults,
        children: Number.isFinite(children) && children >= 0 ? children : DEFAULT_GUESTS.children,
        infants: Number.isFinite(infants) && infants >= 0 ? infants : DEFAULT_GUESTS.infants,
        pets: Number.isFinite(pets) && pets >= 0 ? pets : DEFAULT_GUESTS.pets,
      });
    }
  }

  toQueryParams(): Record<string, string> {
    const checkIn = this.checkIn();
    const checkOut = this.checkOut();
    const { adults, children, infants, pets } = this.guests();

    if (!checkIn || !checkOut) {
      return {};
    }

    const format = (date: Date) => date.toISOString().slice(0, 10);

    return {
      checkIn: format(checkIn),
      checkOut: format(checkOut),
      adults: String(adults),
      children: String(children),
      infants: String(infants),
      pets: String(pets),
    };
  }
}

export function clampGuests(guests: GuestCounts): GuestCounts {
  const adults = Math.max(1, Math.min(guests.adults, MAX_CABIN_GUESTS));
  const maxChildren = Math.max(0, MAX_CABIN_GUESTS - adults);
  const children = Math.max(0, Math.min(guests.children, maxChildren));
  const infants = Math.max(0, Math.min(guests.infants, 2));
  const pets = Math.max(0, Math.min(guests.pets, 1));

  return { adults, children, infants, pets };
}

export function guestStepperLimits(
  guests: GuestCounts,
  key: keyof GuestCounts,
): { min: number; max: number } {
  const people = guests.adults + guests.children;

  switch (key) {
    case 'adults':
      return { min: 1, max: MAX_CABIN_GUESTS - guests.children };
    case 'children':
      return { min: 0, max: MAX_CABIN_GUESTS - guests.adults };
    case 'infants':
      return { min: 0, max: 2 };
    case 'pets':
      return { min: 0, max: 1 };
    default:
      return { min: 0, max: people >= MAX_CABIN_GUESTS ? guests[key] : guests[key] };
  }
}
