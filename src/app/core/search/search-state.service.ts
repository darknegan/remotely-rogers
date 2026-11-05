import { Injectable, computed, signal } from '@angular/core';
import { ParamMap } from '@angular/router';

import {
  addDays,
  parseDateKey,
  startOfDay,
  toDateKey,
  validateDateRange,
} from '../utils/date-utils';

export const MAX_GUESTS_PER_CABIN = 4;
export const MIN_NIGHTS = 2;
export const MAX_PETS = 1;

@Injectable({ providedIn: 'root' })
export class SearchState {
  readonly checkIn = signal<Date | null>(null);
  readonly checkOut = signal<Date | null>(null);
  readonly adults = signal(2);
  readonly children = signal(0);
  readonly infants = signal(0);
  readonly pets = signal(0);

  readonly partySize = computed(() => this.adults() + this.children() + this.infants());

  readonly dateError = computed(() =>
    validateDateRange(this.checkIn(), this.checkOut(), MIN_NIGHTS),
  );

  readonly canSearch = computed(
    () => this.checkIn() !== null && this.checkOut() !== null && this.dateError() === null,
  );

  readonly minDate = startOfDay(new Date());

  setCheckIn(value: Date | Date[] | null): void {
    const date = Array.isArray(value) ? (value[0] ?? null) : value;
    this.checkIn.set(date ? startOfDay(date) : null);
  }

  setCheckOut(value: Date | Date[] | null): void {
    const date = Array.isArray(value) ? (value[0] ?? null) : value;
    this.checkOut.set(date ? startOfDay(date) : null);
  }

  setAdults(value: number | null): void {
    this.applyParty(value ?? 1, this.children(), this.infants());
  }

  setChildren(value: number | null): void {
    this.applyParty(this.adults(), value ?? 0, this.infants());
  }

  setInfants(value: number | null): void {
    this.applyParty(this.adults(), this.children(), value ?? 0);
  }

  setPets(value: number | null): void {
    const next = Math.max(0, Math.floor(value ?? 0));
    this.pets.set(Math.min(MAX_PETS, next));
  }

  resetGuests(): void {
    this.adults.set(2);
    this.children.set(0);
    this.infants.set(0);
    this.pets.set(0);
  }

  toQuery(): Record<string, string> {
    const query: Record<string, string> = {
      adults: String(this.adults()),
      children: String(this.children()),
      infants: String(this.infants()),
      pets: String(this.pets()),
    };
    const arrival = this.checkIn();
    const departure = this.checkOut();
    if (arrival) {
      query['from'] = toDateKey(arrival);
    }
    if (departure) {
      query['to'] = toDateKey(departure);
    }
    return query;
  }

  hydrate(params: ParamMap): void {
    if (params.has('from')) {
      const from = params.get('from');
      this.checkIn.set(from ? parseDateKey(from) : null);
    }
    if (params.has('to')) {
      const to = params.get('to');
      this.checkOut.set(to ? parseDateKey(to) : null);
    }
    this.applyParty(
      numberParam(params, 'adults', this.adults()),
      numberParam(params, 'children', this.children()),
      numberParam(params, 'infants', this.infants()),
    );
    if (params.has('pets')) {
      this.setPets(Number(params.get('pets')));
    }
  }

  /** A sample range used by specs and the foundations preview. */
  previewRange(): void {
    const arrival = addDays(startOfDay(new Date()), 14);
    this.checkIn.set(arrival);
    this.checkOut.set(addDays(arrival, MIN_NIGHTS));
  }

  private applyParty(adults: number, children: number, infants: number): void {
    let nextAdults = Math.max(1, Math.floor(adults));
    let nextChildren = Math.max(0, Math.floor(children));
    let nextInfants = Math.max(0, Math.floor(infants));

    while (nextAdults + nextChildren + nextInfants > MAX_GUESTS_PER_CABIN) {
      if (nextInfants > 0) {
        nextInfants -= 1;
      } else if (nextChildren > 0) {
        nextChildren -= 1;
      } else {
        nextAdults = Math.max(1, nextAdults - 1);
        break;
      }
    }

    this.adults.set(nextAdults);
    this.children.set(nextChildren);
    this.infants.set(nextInfants);
  }
}

function numberParam(params: ParamMap, key: string, fallback: number): number {
  if (!params.has(key)) {
    return fallback;
  }
  const value = Number(params.get(key));
  return Number.isFinite(value) ? value : fallback;
}
