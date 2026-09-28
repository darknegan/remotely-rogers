import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dialog } from 'primeng/dialog';

import {
  averageRating,
  nextReviewIndex,
  prevReviewIndex,
  shortCabinName,
} from '../../core/utils/reviews';
import { GuestReview, reviewsForCabin } from '../content/reviews/reviews.data';

@Component({
  selector: 'app-home-review-band',
  imports: [Dialog, RouterLink],
  templateUrl: './home-review-band.html',
  styleUrl: './home-review-band.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeReviewBand {
  readonly slug = input.required<string>();
  readonly name = input.required<string>();
  readonly imageUrl = input.required<string>();
  readonly imageOnLeft = input(true);

  readonly reviews = computed(() => reviewsForCabin(this.slug()));
  readonly reviewCount = computed(() => this.reviews().length);
  readonly average = computed(() => averageRating(this.reviews()));

  readonly activeIndex = linkedSignal({
    source: this.reviews,
    computation: () => 0,
  });

  readonly activeReview = computed(() => {
    const list = this.reviews();
    const index = this.activeIndex();
    return list.length > 0 ? list[index % list.length] : null;
  });

  readonly modalVisible = signal(false);

  protected stars(rating: number): string {
    return '★★★★★'.slice(0, Math.max(0, Math.min(5, Math.round(rating))));
  }

  protected indexLabel(): string {
    const count = this.reviewCount();
    if (count === 0) {
      return '';
    }
    return `${this.activeIndex() + 1} / ${count}`;
  }

  protected next(): void {
    this.activeIndex.set(nextReviewIndex(this.activeIndex(), this.reviewCount()));
  }

  protected prev(): void {
    this.activeIndex.set(prevReviewIndex(this.activeIndex(), this.reviewCount()));
  }

  protected openModal(): void {
    this.modalVisible.set(true);
  }

  protected closeModal(): void {
    this.modalVisible.set(false);
  }

  protected displayName(): string {
    return shortCabinName(this.name());
  }
}
