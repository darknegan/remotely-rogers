import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, afterNextRender, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { DatePicker } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { InputNumber } from 'primeng/inputnumber';
import { Popover } from 'primeng/popover';
import { Select } from 'primeng/select';

import {
  CabinAvailabilityRow,
  CabinSearchStore,
} from '../../core/cabins/cabin-search.store';
import { SITE_ADDRESS, SITE_MAP_LINK } from '../../core/content/site-nav';
import { addDays, formatShortDate, formatWeekday, toDateKey } from '../../core/utils/date-utils';
import { MapEmbed } from '../../layout/map-embed/map-embed';
import { BookingStateService } from '../group-booking/booking-state.service';
import { GroupBookingShell } from '../group-booking/shell/shell';

@Component({
  selector: 'app-cabin-listing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BookingStateService],
  imports: [
    DecimalPipe,
    FormsModule,
    RouterLink,
    Button,
    Dialog,
    Select,
    DatePicker,
    InputNumber,
    Popover,
    MapEmbed,
    GroupBookingShell,
  ],
  templateUrl: './cabin-listing.html',
})
export class CabinListing {
  readonly store = inject(CabinSearchStore);
  readonly booking = inject(BookingStateService);
  readonly search = this.store.search;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.queryParamMap);

  readonly siteAddress = SITE_ADDRESS;
  readonly mapDirections = SITE_MAP_LINK;

  readonly sortOptions = [
    { label: 'Price: low to high', value: 'asc' as const },
    { label: 'Price: high to low', value: 'desc' as const },
  ];

  readonly bedroomOptions = [
    { label: 'Any bedrooms', value: 0 },
    { label: '2+ bedrooms', value: 2 },
    { label: '3+ bedrooms', value: 3 },
  ];

  readonly amenityKeys = [
    ['wifi', 'Wi-Fi'],
    ['pets', 'Pets welcome'],
    ['parking', 'Parking'],
    ['workspace', 'Dedicated workspace'],
    ['fireplace', 'Fireplace'],
  ] as const;

  readonly guestSummary = computed(() => {
    const guests = this.search.partySize();
    const parts = [guests === 1 ? '1 guest' : `${guests} guests`];
    const pets = this.search.pets();
    if (pets > 0) {
      parts.push(pets === 1 ? '1 pet' : `${pets} pets`);
    }
    return parts.join(' · ');
  });

  readonly resultsEyebrow = computed(() => {
    const nights = this.store.nightCount();
    const arrival = this.search.checkIn();
    const departure = this.search.checkOut();
    if (!this.search.canSearch() || !arrival || !departure || nights === 0) {
      return 'Pick dates to see availability';
    }
    const nightLabel = nights === 1 ? '1 night' : `${nights} nights`;
    return `${nightLabel} · ${formatWeekday(arrival)} – ${formatWeekday(departure)}`;
  });

  readonly resultsTitle = computed(() => {
    const arrival = this.search.checkIn();
    const departure = this.search.checkOut();
    if (!this.search.canSearch() || !arrival || !departure) {
      return 'Six cabins on one hill';
    }
    const lastNight = addDays(departure, -1);
    return `Available ${formatShortDate(arrival)} – ${formatShortDate(lastNight)}`;
  });

  readonly showAvailabilityBadge = computed(
    () => this.store.hasSearched() && this.search.canSearch(),
  );

  readonly bookedRows = computed(() =>
    this.store.datedRows().filter((row) => this.store.hasSearched() && !row.available),
  );

  readonly showBookedStrip = computed(
    () => this.store.hasSearched() && this.search.canSearch() && this.bookedRows().length > 0,
  );

  nextOpenLabel(cabinId: number): string {
    return this.booking.nextOpenLabels()[cabinId] ?? 'Finding open nights…';
  }

  private lastListingSyncKey = '';
  private lastNextOpenKey = '';
  private lastFetchKey = '';

  constructor() {
    afterNextRender(() => {
      this.booking.initializeDefaultView();
      if (!this.booking.hasSearched() && this.booking.viewStartDate() && !this.booking.dateError()) {
        this.booking.searchAvailability();
      }
    });

    effect(() => {
      const params = this.params();
      if (!params) {
        return;
      }
      this.store.search.hydrate(params);
      if (!params.has('from') || !params.has('to') || !this.search.canSearch()) {
        return;
      }
      const key = `${params.get('from')}|${params.get('to')}|${params.get('adults')}|${params.get('children')}|${params.get('infants')}|${params.get('pets')}`;
      if (key === this.lastFetchKey) {
        return;
      }
      this.lastFetchKey = key;
      this.store.updateAvailability();
    });

    effect(() => {
      const arrival = this.search.checkIn();
      const departure = this.search.checkOut();
      if (!this.store.hasSearched() || !arrival || !departure || !this.search.canSearch()) {
        return;
      }

      const syncKey = `${toDateKey(arrival)}|${toDateKey(departure)}|${this.search.partySize()}`;
      if (syncKey !== this.lastListingSyncKey) {
        this.lastListingSyncKey = syncKey;
        this.booking.syncFromListingSearch(arrival, departure, this.search.partySize());
      }

      const map = this.store.availabilityMap();
      if (Object.keys(map).length > 0) {
        this.booking.mergeListingAvailability(map);
      }

      const booked = this.bookedRows();
      const nextOpenKey = `${syncKey}|${booked.map((row) => row.cabin.id).join(',')}|${Object.keys(map).length}`;
      if (nextOpenKey === this.lastNextOpenKey) {
        return;
      }
      this.lastNextOpenKey = nextOpenKey;
      this.booking.refreshNextOpenLabels(
        booked.map((row) => row.cabin.id),
        departure,
        map,
      );
    });
  }

  formatBarDate(value: Date | null): string {
    if (!value) {
      return 'Add date';
    }
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(value);
  }

  nightlyFrom(row: CabinAvailabilityRow): number {
    return row.quote?.nightlyRate ?? row.cabin.nightlyFrom;
  }

  stayTotal(row: CabinAvailabilityRow): number | null {
    if (row.quote) {
      return row.quote.totalPrice;
    }
    const nights = this.store.nightCount();
    if (nights > 0 && !this.store.hasSearched()) {
      return row.cabin.nightlyFrom * nights;
    }
    return null;
  }

  updateAvailability(): void {
    if (!this.search.canSearch()) {
      return;
    }
    this.lastFetchKey = '';
    this.lastNextOpenKey = '';
    void this.router.navigate(['/cabins'], { queryParams: this.search.toQuery() });
    this.store.updateAvailability();
    const query = this.search.toQuery();
    this.lastFetchKey = `${query['from']}|${query['to']}|${query['adults']}|${query['children']}|${query['infants']}|${query['pets']}`;
  }
}
