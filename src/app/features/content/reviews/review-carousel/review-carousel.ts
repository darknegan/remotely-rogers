import {
  Component,
  DestroyRef,
  Input,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { environment } from '../../../../../environments/environment';
import {
  REVIEW_BAND_INTERVAL_MS,
  averageRating,
  guestInitials,
  nextReviewIndex,
  prevReviewIndex,
  shouldAutoAdvance,
  visibleReviewWindow,
} from '../../../../core/utils/reviews';
import { GuestReview, reviewsForCabin } from '../reviews.data';

@Component({
  selector: 'app-review-carousel',
  templateUrl: './review-carousel.html',
  styleUrl: './review-carousel.scss',
})
export class ReviewCarousel {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private timer: ReturnType<typeof setInterval> | null = null;
  private visibilityHandler?: () => void;
  private keyHandler?: (event: KeyboardEvent) => void;

  @Input() name = '';
  @Input() imageUrl = '';
  @Input() imageOnLeft = true;

  protected cabinSlug = '';
  protected reviews: GuestReview[] = [];
  protected average = 0;
  protected activeIndex = 0;
  protected modalOpen = false;
  protected hovered = false;
  protected reduceMotion = false;
  protected documentHidden = false;

  @Input({ required: true })
  set slug(value: string) {
    this.cabinSlug = value;
    this.reviews = value ? reviewsForCabin(value) : [];
    this.average = averageRating(this.reviews);
    this.activeIndex = 0;
    this.modalOpen = false;
    this.restartTimer();
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.documentHidden = document.hidden;
      this.visibilityHandler = () => {
        this.documentHidden = document.hidden;
        this.restartTimer();
      };
      this.keyHandler = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && this.modalOpen) {
          this.closeModal();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
      document.addEventListener('keydown', this.keyHandler);
    }

    this.destroyRef.onDestroy(() => {
      this.clearTimer();
      if (isPlatformBrowser(this.platformId)) {
        document.body.style.overflow = '';
        if (this.visibilityHandler) {
          document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        if (this.keyHandler) {
          document.removeEventListener('keydown', this.keyHandler);
        }
      }
    });
  }

  protected get cabinHref(): string {
    return `${environment.siteBaseUrl}/en/${this.cabinSlug}/`;
  }

  protected get canRotate(): boolean {
    return this.reviews.length > 2;
  }

  protected isInWindow(index: number): boolean {
    return visibleReviewWindow(this.reviews, this.activeIndex, 2).some(
      (review) => review.id === this.reviews[index]?.id,
    );
  }

  protected initials(guestName: string): string {
    return guestInitials(guestName);
  }

  protected stars(rating: number): string {
    return '★★★★★'.slice(0, Math.max(0, Math.min(5, Math.round(rating))));
  }

  protected hideAvatar(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  protected hidePhoto(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  protected next(): void {
    this.activeIndex = nextReviewIndex(this.activeIndex, this.reviews.length);
    this.restartTimer();
  }

  protected prev(): void {
    // Shift the two-card window backward and reset auto-advance.
    this.activeIndex = prevReviewIndex(this.activeIndex, this.reviews.length);
    this.restartTimer();
  }

  protected setHovered(hovered: boolean): void {
    this.hovered = hovered;
    this.restartTimer();
  }

  protected openModal(): void {
    this.modalOpen = true;
    document.body.style.overflow = 'hidden';
    this.restartTimer();
  }

  protected closeModal(): void {
    this.modalOpen = false;
    document.body.style.overflow = '';
    this.restartTimer();
  }

  private restartTimer(): void {
    this.clearTimer();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    if (
      !shouldAutoAdvance({
        reviewCount: this.reviews.length,
        modalOpen: this.modalOpen,
        reduceMotion: this.reduceMotion,
        documentHidden: this.documentHidden,
        hovered: this.hovered,
      })
    ) {
      return;
    }
    this.timer = setInterval(() => this.next(), REVIEW_BAND_INTERVAL_MS);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
