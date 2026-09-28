import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Dialog } from 'primeng/dialog';

import {
  averageRating,
  carouselCabinName,
  nextReviewIndex,
  prevReviewIndex,
  reviewBandImageOnLeft,
  shortCabinName,
} from '../../core/utils/reviews';
import { CABIN_CONFIG } from '../../../environments/cabin-config';
import { BookingBar } from '../../layout/booking-bar/booking-bar';
import { reviewsForCabin } from '../content/reviews/reviews.data';
import { HomeReviewBand } from './home-review-band';

interface HomeStat {
  value: string;
  label: string;
  mobileLabel: string;
}

interface HomeAmenity {
  title: string;
  description: string;
}

interface HomeCabinCard {
  slug: string;
  name: string;
  carouselName: string;
  imageUrl: string;
  imageOnLeft: boolean;
}

function cabinImageUrl(imageUrl: string, width = 1200): string {
  return imageUrl.replace('w=400', `w=${width}`);
}

@Component({
  selector: 'app-home',
  imports: [BookingBar, Dialog, HomeReviewBand, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly title = inject(Title);

  readonly stats: HomeStat[] = [
    { value: '70', label: 'Private acres', mobileLabel: 'Private acres' },
    { value: '6', label: 'A-frame cabins', mobileLabel: 'A-frames' },
    { value: '4', label: 'Guests per cabin', mobileLabel: 'Guests each' },
    { value: '1', label: 'Pet welcome, arranged first', mobileLabel: 'Pet welcome' },
  ];

  readonly amenities: HomeAmenity[] = [
    {
      title: 'Kitchenette',
      description: 'Cookware, dishes, wine glasses and countertop appliances.',
    },
    {
      title: 'Fridge & freezer',
      description: 'Full size, for a long weekend or a work week.',
    },
    {
      title: 'Bath & bedding',
      description: 'Towels, bedding, shampoo, conditioner, soap and a hair dryer.',
    },
    {
      title: 'Parking',
      description: 'A designated spot at every cabin.',
    },
  ];

  readonly cabins: HomeCabinCard[] = CABIN_CONFIG.cabins.map((cabin, index) => ({
    slug: cabin.slug,
    name: shortCabinName(cabin.name),
    carouselName: carouselCabinName(cabin.name),
    imageUrl: cabinImageUrl(cabin.imageUrl ?? '', 800),
    imageOnLeft: reviewBandImageOnLeft(index),
  }));

  readonly heroImage = cabinImageUrl(CABIN_CONFIG.cabins[0].imageUrl ?? '', 1600);
  readonly galleryPrimaryImage = cabinImageUrl(CABIN_CONFIG.cabins[4].imageUrl ?? '', 1200);
  readonly galleryLoftImage = cabinImageUrl(CABIN_CONFIG.cabins[1].imageUrl ?? '', 1200);
  readonly comfortImage = cabinImageUrl(CABIN_CONFIG.cabins[3].imageUrl ?? '', 1200);
  readonly multiCabinImage = cabinImageUrl(CABIN_CONFIG.cabins[2].imageUrl ?? '', 1600);
  readonly cabinsCtaImage = cabinImageUrl(CABIN_CONFIG.cabins[0].imageUrl ?? '', 1200);

  readonly mobileCabinIndex = signal(0);

  readonly mobileCabin = computed(() => this.cabins[this.mobileCabinIndex()] ?? this.cabins[0]);

  readonly mobileReviews = computed(() => reviewsForCabin(this.mobileCabin().slug));

  readonly mobileReviewIndex = linkedSignal({
    source: this.mobileCabinIndex,
    computation: () => 0,
  });

  readonly mobileReview = computed(() => {
    const reviews = this.mobileReviews();
    const index = this.mobileReviewIndex();
    return reviews.length > 0 ? reviews[index % reviews.length] : null;
  });

  readonly mobileAverage = computed(() => averageRating(this.mobileReviews()));

  readonly mobileModalVisible = signal(false);

  constructor() {
    this.title.setTitle('Remotely Rogers — Six A-frames on 70 acres');
  }

  protected formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  protected stars(rating: number): string {
    return '★★★★★'.slice(0, Math.max(0, Math.min(5, Math.round(rating))));
  }

  protected nextMobileCabin(): void {
    this.mobileCabinIndex.set(nextReviewIndex(this.mobileCabinIndex(), this.cabins.length));
  }

  protected prevMobileCabin(): void {
    this.mobileCabinIndex.set(prevReviewIndex(this.mobileCabinIndex(), this.cabins.length));
  }

  protected openMobileModal(): void {
    this.mobileModalVisible.set(true);
  }

  protected closeMobileModal(): void {
    this.mobileModalVisible.set(false);
  }
}
