import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Select } from 'primeng/select';

import { SearchStateService } from '../../core/search/search-state.service';
import { formatShortDate } from '../../core/utils/date-utils';
import { BookingBar } from '../../layout/booking-bar/booking-bar';
import { CabinSearchStore } from './cabin-search.store';
import { CABIN_NIGHTLY_RATE, CabinListing, SORT_OPTIONS } from './cabins.data';
import { CabinsFilters } from './cabins-filters/cabins-filters';
import { CabinsMap } from './cabins-map/cabins-map';

@Component({
  selector: 'app-cabins',
  imports: [BookingBar, CabinsFilters, CabinsMap, FormsModule, RouterLink, Select],
  providers: [CabinSearchStore],
  templateUrl: './cabins.html',
  styleUrl: './cabins.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Cabins {
  private readonly title = inject(Title);
  protected readonly store = inject(CabinSearchStore);
  protected readonly search = inject(SearchStateService);

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly nightlyRate = CABIN_NIGHTLY_RATE;
  protected readonly emptyImage = this.store.allCabins[0]?.imageUrl ?? '';

  constructor() {
    this.title.setTitle('Remotely Rogers — Cabins');
  }

  protected mobileDateLabel(): string {
    const checkIn = this.search.checkIn();
    const checkOut = this.search.checkOut();

    if (!checkIn || !checkOut) {
      return 'Add dates';
    }

    return `${formatShortDate(checkIn)} – ${formatShortDate(checkOut)}`;
  }

  protected cabinMeta(cabin: CabinListing): string {
    return `Vacation Home · 4 guests · Wifi`;
  }

  protected cabinHref(cabin: CabinListing): string {
    return `/cabins/${cabin.slug}`;
  }

  protected featuredImage(cabin: CabinListing, width = 1200): string {
    return cabin.imageUrl.replace('w=1200', `w=${width}`);
  }
}
