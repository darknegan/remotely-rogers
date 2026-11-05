import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { CABIN_LISTINGS, CabinListing } from '../content/cabin-catalog';
import { CabinAvailability } from '../models/booking.models';
import { BookingApiService } from '../services/booking-api.service';
import { SearchState } from '../search/search-state.service';
import { nightCount, toDateKey } from '../utils/date-utils';

export type PriceSort = 'asc' | 'desc';

export interface AmenityFilters {
  wifi: boolean;
  pets: boolean;
  parking: boolean;
  workspace: boolean;
  fireplace: boolean;
}

export const EMPTY_AMENITY_FILTERS: AmenityFilters = {
  wifi: false,
  pets: false,
  parking: false,
  workspace: false,
  fireplace: false,
};

export interface CabinAvailabilityRow {
  cabin: CabinListing;
  quote?: CabinAvailability;
  available: boolean;
}

@Injectable({ providedIn: 'root' })
export class CabinSearchStore {
  private readonly api = inject(BookingApiService);

  readonly search = inject(SearchState);
  readonly sort = signal<PriceSort>('asc');
  readonly minBedrooms = signal(0);
  readonly amenities = signal<AmenityFilters>({ ...EMPTY_AMENITY_FILTERS });
  readonly filtersOpen = signal(false);
  readonly mobilePane = signal<'list' | 'map'>('list');

  readonly loading = signal(false);
  readonly hasSearched = signal(false);
  readonly availabilityMap = signal<Record<number, CabinAvailability>>({});

  readonly results = computed(() => {
    const filters = this.amenities();
    const minBeds = this.minBedrooms();
    const matched = CABIN_LISTINGS.filter((cabin) => matches(cabin, filters, minBeds));
    const direction = this.sort() === 'asc' ? 1 : -1;
    return [...matched].sort((a, b) => {
      const price = (a.nightlyFrom - b.nightlyFrom) * direction;
      return price === 0 ? a.name.localeCompare(b.name) : price;
    });
  });

  readonly datedRows = computed((): CabinAvailabilityRow[] => {
    const cabins = this.results();
    const map = this.availabilityMap();
    const searched = this.hasSearched() && this.search.canSearch();

    if (!searched) {
      return cabins.map((cabin) => ({ cabin, available: true }));
    }

    return cabins.map((cabin) => {
      const quote = map[cabin.id];
      return {
        cabin,
        quote,
        available: quote?.available ?? false,
      };
    });
  });

  readonly availableRows = computed(() => this.datedRows().filter((row) => row.available));

  readonly totalCabins = CABIN_LISTINGS.length;

  readonly availableCount = computed(() => {
    if (!this.hasSearched() || !this.search.canSearch()) {
      return this.results().length;
    }
    return this.availableRows().length;
  });

  readonly nightCount = computed(() => {
    const arrival = this.search.checkIn();
    const departure = this.search.checkOut();
    if (!arrival || !departure) {
      return 0;
    }
    return nightCount(arrival, departure);
  });

  readonly showEmptyState = computed(() => {
    if (this.results().length === 0) {
      return true;
    }
    if (this.hasSearched() && this.search.canSearch()) {
      return this.availableRows().length === 0;
    }
    return false;
  });

  readonly resultLabel = computed(() => {
    const count = this.results().length;
    return count === 1 ? '1 cabin' : `${count} cabins`;
  });

  toggleAmenity(key: keyof AmenityFilters): void {
    const current = this.amenities();
    this.amenities.set({ ...current, [key]: !current[key] });
  }

  clearFilters(): void {
    this.amenities.set({ ...EMPTY_AMENITY_FILTERS });
    this.minBedrooms.set(0);
    this.filtersOpen.set(false);
  }

  resetDates(): void {
    this.search.checkIn.set(null);
    this.search.checkOut.set(null);
    this.hasSearched.set(false);
    this.availabilityMap.set({});
  }

  updateAvailability(): void {
    if (!this.search.canSearch()) {
      return;
    }

    const arrival = this.search.checkIn();
    const departure = this.search.checkOut();
    if (!arrival || !departure) {
      return;
    }

    this.loading.set(true);
    this.hasSearched.set(true);

    this.api
      .fetchAvailability({
        arrival: toDateKey(arrival),
        departure: toDateKey(departure),
        adults: this.search.partySize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          const map: Record<number, CabinAvailability> = {};
          for (const cabin of response.cabins) {
            map[cabin.cabinId] = cabin;
          }
          this.availabilityMap.set(map);
        },
        error: () => {
          this.availabilityMap.set({});
        },
      });
  }
}

export function matches(cabin: CabinListing, filters: AmenityFilters, minBedrooms: number): boolean {
  if (minBedrooms > 0 && cabin.bedrooms < minBedrooms) {
    return false;
  }
  if (filters.wifi && !cabin.wifi) return false;
  if (filters.pets && !cabin.pets) return false;
  if (filters.parking && !cabin.parking) return false;
  if (filters.workspace && !cabin.workspace) return false;
  if (filters.fireplace && !cabin.fireplace) return false;
  return true;
}
