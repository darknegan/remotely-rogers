import { Injectable, computed, inject, signal } from '@angular/core';

import { CABIN_LISTINGS, CabinListing } from '../content/cabin-catalog';
import { SearchState } from '../search/search-state.service';

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

@Injectable({ providedIn: 'root' })
export class CabinSearchStore {
  readonly search = inject(SearchState);
  readonly sort = signal<PriceSort>('asc');
  readonly minBedrooms = signal(0);
  readonly amenities = signal<AmenityFilters>({ ...EMPTY_AMENITY_FILTERS });
  readonly filtersOpen = signal(false);
  readonly mobilePane = signal<'list' | 'map'>('list');

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
