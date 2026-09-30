import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Dialog } from 'primeng/dialog';

import {
  averageRating,
  nextReviewIndex,
  prevReviewIndex,
  visibleReviewWindow,
} from '../../../core/utils/reviews';
import { reviewsForCabin } from '../../content/reviews/reviews.data';

@Component({
  selector: 'app-cabin-detail-reviews',
  imports: [Dialog],
  templateUrl: './cabin-detail-reviews.html',
  styleUrl: './cabin-detail-reviews.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinDetailReviews {
  readonly slug = input.required<string>();

  readonly reviews = computed(() => reviewsForCabin(this.slug()));
  readonly reviewCount = computed(() => this.reviews().length);
  readonly average = computed(() => averageRating(this.reviews()));

  readonly activeIndex = linkedSignal({
    source: this.reviews,
    computation: () => 0,
  });

  readonly visibleReviews = computed(() =>
    visibleReviewWindow(this.reviews(), this.activeIndex(), 2),
  );

  readonly modalVisible = signal(false);

  protected formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  protected stars(rating: number): string {
    return '★★★★★'.slice(0, Math.max(0, Math.min(5, Math.round(rating))));
  }

  protected rangeLabel(): string {
    const count = this.reviewCount();
    if (count === 0) {
      return '';
    }

    const start = this.activeIndex() + 1;
    const end = Math.min(start + 1, count);
    return `${start}–${end} of ${count}`;
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
}
