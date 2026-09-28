import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Dialog } from 'primeng/dialog';

import { reviewsForCabin } from '../../features/content/reviews/reviews.data';
import {
  averageRating,
  guestInitials,
  nextReviewIndex,
  prevReviewIndex,
  visibleReviewWindow,
} from '../../core/utils/reviews';

@Component({
  selector: 'app-review-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Dialog],
  templateUrl: './review-band.html',
})
export class ReviewBand {
  readonly slug = input.required<string>();
  readonly name = input.required<string>();
  readonly imageUrl = input.required<string>();

  readonly index = signal(0);
  readonly open = signal(false);

  readonly reviews = computed(() => reviewsForCabin(this.slug()));
  readonly visible = computed(() => visibleReviewWindow(this.reviews(), this.index(), 2));
  readonly average = computed(() => averageRating(this.reviews()));

  stars(rating: number): string {
    return '★★★★★'.slice(0, Math.round(rating));
  }

  initials(name: string): string {
    return guestInitials(name);
  }

  next(): void {
    this.index.set(nextReviewIndex(this.index(), this.reviews().length));
  }

  prev(): void {
    this.index.set(prevReviewIndex(this.index(), this.reviews().length));
  }
}
