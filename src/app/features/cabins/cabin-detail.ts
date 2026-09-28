import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Dialog } from 'primeng/dialog';
import { Drawer } from 'primeng/drawer';

import {
  AMENITY_GROUPS,
  CABIN_DESCRIPTION,
  CABIN_LISTINGS,
  cabinBySlug,
} from '../../core/content/cabin-catalog';
import { SITE_EMAIL, SITE_PHONE } from '../../core/content/site-nav';
import { SearchState } from '../../core/search/search-state.service';
import { nightCount, toDateKey } from '../../core/utils/date-utils';
import { averageRating } from '../../core/utils/reviews';
import { reviewsForCabin } from '../content/reviews/reviews.data';
import { BookingBar } from '../../layout/booking-bar/booking-bar';
import { MapEmbed } from '../../layout/map-embed/map-embed';
import { ReviewBand } from '../../shared/review-band/review-band';

@Component({
  selector: 'app-cabin-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, Dialog, Drawer, BookingBar, MapEmbed, ReviewBand],
  templateUrl: './cabin-detail.html',
})
export class CabinDetail {
  readonly search = inject(SearchState);
  private readonly route = inject(ActivatedRoute);
  private readonly slug = toSignal(this.route.paramMap.pipe(map((params) => params.get('slug'))), {
    initialValue: null,
  });

  readonly cabin = computed(() => cabinBySlug(this.slug()));
  readonly others = computed(() => CABIN_LISTINGS.filter((cabin) => cabin.slug !== this.slug()));
  readonly galleryOpen = signal(false);
  readonly galleryIndex = signal(0);
  readonly widgetOpen = signal(false);
  readonly groups = AMENITY_GROUPS;
  readonly description = CABIN_DESCRIPTION;
  readonly email = SITE_EMAIL;
  readonly phone = SITE_PHONE;

  readonly nights = computed(() => {
    const arrival = this.search.checkIn();
    const departure = this.search.checkOut();
    if (!arrival || !departure || this.search.dateError()) {
      return 0;
    }
    return nightCount(arrival, departure);
  });

  readonly total = computed(() => {
    const cabin = this.cabin();
    return cabin ? this.nights() * cabin.nightlyFrom : 0;
  });

  readonly rating = computed(() => averageRating(reviewsForCabin(this.slug() ?? '')));

  readonly bookHref = computed(() => {
    const cabin = this.cabin();
    if (!cabin) {
      return '/cabins';
    }
    const url = new URL(cabin.lodgifyUrl);
    const arrival = this.search.checkIn();
    const departure = this.search.checkOut();
    if (arrival && departure && !this.search.dateError()) {
      url.searchParams.set('from', toDateKey(arrival));
      url.searchParams.set('to', toDateKey(departure));
      url.searchParams.set('adults', String(this.search.adults()));
    }
    return url.toString();
  });

  constructor() {
    effect(() => {
      const params = this.route.snapshot.queryParamMap;
      this.search.hydrate(params);
    });
  }

  showPhoto(index: number): void {
    this.galleryIndex.set(index);
    this.galleryOpen.set(true);
  }
}
