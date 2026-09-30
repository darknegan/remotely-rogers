import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Dialog } from 'primeng/dialog';

import { nextReviewIndex, prevReviewIndex } from '../../../core/utils/reviews';
import { CabinGalleryImage } from '../cabin-detail.data';

@Component({
  selector: 'app-cabin-gallery',
  imports: [Dialog],
  templateUrl: './cabin-gallery.html',
  styleUrl: './cabin-gallery.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabinGallery {
  readonly cabinName = input.required<string>();
  readonly images = input.required<CabinGalleryImage[]>();

  readonly lightboxOpen = signal(false);
  readonly activeIndex = linkedSignal({
    source: this.images,
    computation: () => 0,
  });

  readonly activeImage = computed(() => {
    const list = this.images();
    const index = this.activeIndex();
    return list.length > 0 ? list[index % list.length] : null;
  });

  readonly indexLabel = computed(() => {
    const count = this.images().length;
    if (count === 0) {
      return '';
    }
    return `${this.activeIndex() + 1} / ${count}`;
  });

  protected openLightbox(index = 0): void {
    this.activeIndex.set(index);
    this.lightboxOpen.set(true);
  }

  protected closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  protected next(): void {
    this.activeIndex.set(nextReviewIndex(this.activeIndex(), this.images().length));
  }

  protected prev(): void {
    this.activeIndex.set(prevReviewIndex(this.activeIndex(), this.images().length));
  }

  protected selectThumb(index: number): void {
    this.activeIndex.set(index);
  }
}
