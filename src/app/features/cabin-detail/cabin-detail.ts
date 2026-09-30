import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Drawer } from 'primeng/drawer';
import { map } from 'rxjs';

import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { SearchStateService } from '../../core/search/search-state.service';
import { averageRating, shortCabinName } from '../../core/utils/reviews';
import { CabinsMap } from '../cabins/cabins-map/cabins-map';
import { CABIN_LISTINGS } from '../cabins/cabins.data';
import { reviewsForCabin } from '../content/reviews/reviews.data';
import { CabinBookingWidget } from './cabin-booking-widget/cabin-booking-widget';
import {
  CABIN_DOG_NOTE,
  CABIN_HOUSE_RULES,
  CABIN_INTRO_HEADLINE,
  CABIN_INTRO_LEDE,
  CABIN_LOCATION_NOTE,
  CABIN_POLICY_CARDS,
  cabinDetailForSlug,
  HOST_CONTACT,
} from './cabin-detail.data';
import { CabinDetailReviews } from './cabin-detail-reviews/cabin-detail-reviews';
import { CabinGallery } from './cabin-gallery/cabin-gallery';

@Component({
  selector: 'app-cabin-detail',
  imports: [
    CabinBookingWidget,
    CabinDetailReviews,
    CabinGallery,
    CabinsMap,
    Drawer,
    RouterLink,
  ],
  templateUrl: './cabin-detail.html',
  styleUrl: './cabin-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  protected readonly search = inject(SearchStateService);

  private readonly slugParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('slug') ?? '')),
    { initialValue: '' },
  );

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

  readonly bookingDrawerOpen = signal(false);

  readonly cabin = computed(() => {
    const slug = this.slugParam();
    const config = CABIN_CONFIG.cabins.find((entry) => entry.slug === slug);
    if (!config) {
      return null;
    }

    const listing = CABIN_LISTINGS.find((entry) => entry.slug === slug);
    const detail = cabinDetailForSlug(slug);
    if (!detail) {
      return null;
    }

    return {
      ...config,
      ...detail,
      displayName: shortCabinName(config.name),
      listing,
    };
  });

  readonly reviews = computed(() => reviewsForCabin(this.slugParam()));
  readonly reviewCount = computed(() => this.reviews().length);
  readonly average = computed(() => averageRating(this.reviews()));

  readonly moreCabins = computed(() => {
    const currentSlug = this.slugParam();
    return CABIN_LISTINGS.filter((cabin) => cabin.slug !== currentSlug);
  });

  constructor() {
    effect(() => {
      this.search.fromQueryParams({ ...this.queryParams() });
    });

    effect(() => {
      const cabin = this.cabin();
      if (cabin) {
        this.title.setTitle(`Remotely Rogers — ${cabin.displayName}`);
      }
    });

    effect(() => {
      const slug = this.slugParam();
      if (slug && !cabinDetailForSlug(slug)) {
        void this.router.navigate(['/cabins']);
      }
    });
  }

  protected formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  protected openBookingDrawer(): void {
    this.bookingDrawerOpen.set(true);
  }

  protected closeBookingDrawer(): void {
    this.bookingDrawerOpen.set(false);
  }

  protected syncQueryParams(): void {
    const cabin = this.cabin();
    if (!cabin) {
      return;
    }

    void this.router.navigate(['/cabins', cabin.slug], {
      queryParams: this.search.toQueryParams(),
      replaceUrl: true,
    });
  }

  protected readonly introHeadline = CABIN_INTRO_HEADLINE;
  protected readonly introLede = CABIN_INTRO_LEDE;
  protected readonly dogNote = CABIN_DOG_NOTE;
  protected readonly locationNote = CABIN_LOCATION_NOTE;
  protected readonly houseRules = CABIN_HOUSE_RULES;
  protected readonly policyCards = CABIN_POLICY_CARDS;
  protected readonly host = HOST_CONTACT;
}
