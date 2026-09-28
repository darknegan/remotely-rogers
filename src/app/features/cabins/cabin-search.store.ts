import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { SearchStateService } from '../../core/search/search-state.service';
import { formatShortDate, nightCount, parseDateKey, toDateKey } from '../../core/utils/date-utils';
import {
  CABIN_LISTINGS,
  CabinAmenityId,
  CabinListing,
  CabinSort,
  BedroomFilter,
  HOLIDAY_EMPTY_SUGGESTIONS,
  SuggestedDateRange,
} from './cabins.data';

export interface CabinSearchQuery {
  checkIn?: string | null;
  checkOut?: string | null;
  adults?: string | null;
  children?: string | null;
  infants?: string | null;
  pets?: string | null;
}

function sortCabins(cabins: CabinListing[], sort: CabinSort): CabinListing[] {
  const sorted = [...cabins];

  switch (sort) {
    case 'price-desc':
      return sorted.sort((a, b) => b.nightlyRate - a.nightlyRate || a.name.localeCompare(b.name));
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'price-asc':
    default:
      return sorted.sort((a, b) => a.nightlyRate - b.nightlyRate || a.name.localeCompare(b.name));
  }
}

function matchesAmenities(cabin: CabinListing, selected: ReadonlySet<CabinAmenityId>): boolean {
  if (selected.size === 0) {
    return true;
  }

  for (const amenity of selected) {
    if (!cabin.amenities.includes(amenity)) {
      return false;
    }
  }

  return true;
}

function matchesBedrooms(cabin: CabinListing, bedrooms: BedroomFilter): boolean {
  if (bedrooms === 'any') {
    return true;
  }

  return cabin.bedrooms === bedrooms;
}

function monthDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function rangesOverlap(
  arrival: Date,
  departure: Date,
  blockedStart: string,
  blockedEnd: string,
): boolean {
  const arrivalKey = monthDayKey(arrival);
  const departureKey = monthDayKey(departure);

  return arrivalKey < blockedEnd && departureKey > blockedStart;
}

/** Demo holiday block — F-02b empty state when guests search Dec 24–27. */
export function isHolidayFullyBooked(arrival: Date, departure: Date): boolean {
  return rangesOverlap(arrival, departure, '12-24', '12-27');
}

export function filterCabins(
  cabins: readonly CabinListing[],
  options: {
    amenities: ReadonlySet<CabinAmenityId>;
    bedrooms: BedroomFilter;
    arrival: Date | null;
    departure: Date | null;
    totalGuests: number;
  },
): CabinListing[] {
  let results = cabins.filter(
    (cabin) => matchesAmenities(cabin, options.amenities) && matchesBedrooms(cabin, options.bedrooms),
  );

  if (options.arrival && options.departure && isHolidayFullyBooked(options.arrival, options.departure)) {
    return [];
  }

  if (options.totalGuests > 4) {
    return [];
  }

  return results;
}

export function buildSuggestedDateParams(
  suggestion: SuggestedDateRange,
  referenceYear = new Date().getFullYear(),
): { checkIn: string; checkOut: string } {
  const [startMonth, startDay] = suggestion.checkIn.split('-').map(Number);
  const [endMonth, endDay] = suggestion.checkOut.split('-').map(Number);
  const endYear = endMonth < startMonth ? referenceYear + 1 : referenceYear;
  const start = new Date(referenceYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  return {
    checkIn: toDateKey(start),
    checkOut: toDateKey(end),
  };
}

@Injectable()
export class CabinSearchStore {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly search = inject(SearchStateService);

  private readonly queryParams = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => ({
        checkIn: params.get('checkIn'),
        checkOut: params.get('checkOut'),
        adults: params.get('adults'),
        children: params.get('children'),
        infants: params.get('infants'),
        pets: params.get('pets'),
      })),
    ),
    {
      initialValue: {
        checkIn: null,
        checkOut: null,
        adults: null,
        children: null,
        infants: null,
        pets: null,
      },
    },
  );

  readonly sort = signal<CabinSort>('price-asc');
  readonly amenityFilters = signal<ReadonlySet<CabinAmenityId>>(new Set());
  readonly bedroomFilter = signal<BedroomFilter>('any');
  readonly filtersOpen = signal(false);
  readonly mobileView = signal<'list' | 'map'>('list');

  readonly allCabins = CABIN_LISTINGS;

  readonly filteredCabins = computed(() =>
    filterCabins(this.allCabins, {
      amenities: this.amenityFilters(),
      bedrooms: this.bedroomFilter(),
      arrival: this.search.checkIn(),
      departure: this.search.checkOut(),
      totalGuests: this.search.totalPeople(),
    }),
  );

  readonly results = computed(() => sortCabins(this.filteredCabins(), this.sort()));

  readonly resultCount = computed(() => this.results().length);

  readonly resultCountLabel = computed(() => {
    const count = this.resultCount();
    return `${count} cabin${count === 1 ? '' : 's'}`;
  });

  readonly isEmpty = computed(() => this.resultCount() === 0);

  readonly isHolidayEmpty = computed(() => {
    const arrival = this.search.checkIn();
    const departure = this.search.checkOut();
    return Boolean(arrival && departure && isHolidayFullyBooked(arrival, departure));
  });

  readonly hasActiveFilters = computed(
    () => this.amenityFilters().size > 0 || this.bedroomFilter() !== 'any',
  );

  readonly featuredCabin = computed(() =>
    this.results().find((cabin) => cabin.layoutRole === 'featured') ?? null,
  );

  readonly gridCabins = computed(() =>
    this.results().filter(
      (cabin) => cabin.layoutRole === 'grid-primary' || cabin.layoutRole === 'grid-offset',
    ),
  );

  readonly rowCabins = computed(() => this.results().filter((cabin) => cabin.layoutRole === 'row'));

  readonly mobileListCabins = computed(() => {
    const featured = this.featuredCabin();
    if (!featured) {
      return this.results();
    }

    return this.results().filter((cabin) => cabin.id !== featured.id);
  });

  readonly emptyDateLabel = computed(() => {
    const arrival = this.search.checkIn();
    const departure = this.search.checkOut();
    if (!arrival || !departure) {
      return '';
    }

    const lastNight = new Date(departure);
    lastNight.setDate(lastNight.getDate() - 1);
    return `${formatShortDate(arrival)} – ${formatShortDate(lastNight)}`;
  });

  readonly suggestedDates = HOLIDAY_EMPTY_SUGGESTIONS;

  readonly sortLabel = computed(
    () =>
      ({
        'price-asc': 'Price: low to high',
        'price-desc': 'Price: high to low',
        'name-asc': 'Name: A to Z',
      })[this.sort()],
  );

  constructor() {
    effect(() => {
      this.syncFromQueryParams(this.queryParams());
    });
  }

  syncFromQueryParams(params: CabinSearchQuery): void {
    this.search.fromQueryParams({ ...params });
  }

  refreshFromRoute(): void {
    this.syncFromQueryParams(this.queryParams());
  }

  setSort(value: CabinSort): void {
    this.sort.set(value);
  }

  toggleAmenity(amenity: CabinAmenityId): void {
    this.amenityFilters.update((current) => {
      const next = new Set(current);
      if (next.has(amenity)) {
        next.delete(amenity);
      } else {
        next.add(amenity);
      }
      return next;
    });
  }

  isAmenitySelected(amenity: CabinAmenityId): boolean {
    return this.amenityFilters().has(amenity);
  }

  setBedroomFilter(value: BedroomFilter): void {
    this.bedroomFilter.set(value);
  }

  clearFilters(): void {
    this.amenityFilters.set(new Set());
    this.bedroomFilter.set('any');
  }

  openFilters(): void {
    this.filtersOpen.set(true);
  }

  closeFilters(): void {
    this.filtersOpen.set(false);
  }

  applyFilters(): void {
    this.filtersOpen.set(false);
  }

  showList(): void {
    this.mobileView.set('list');
  }

  showMap(): void {
    this.mobileView.set('map');
  }

  applySearch(): void {
    if (!this.search.canSearch()) {
      return;
    }

    void this.router.navigate(['/cabins'], {
      queryParams: this.search.toQueryParams(),
    });
  }

  applySuggestedDates(suggestion: SuggestedDateRange): void {
    const params = buildSuggestedDateParams(suggestion);
    this.search.setCheckIn(parseDateKey(params.checkIn));
    this.search.setCheckOut(parseDateKey(params.checkOut));

    void this.router.navigate(['/cabins'], {
      queryParams: this.search.toQueryParams(),
    });
  }

  clearDates(): void {
    this.search.clearDates();
    void this.router.navigate(['/cabins']);
  }

  nightsForStay(): number {
    const arrival = this.search.checkIn();
    const departure = this.search.checkOut();
    if (!arrival || !departure) {
      return 0;
    }

    return nightCount(arrival, departure);
  }
}
