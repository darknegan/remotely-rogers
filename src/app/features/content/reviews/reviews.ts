import { Component } from '@angular/core';

import { reviewBandImageOnLeft, shortCabinName } from '../../../core/utils/reviews';
import { CABIN_CONFIG } from '../../../../environments/cabin-config';
import { ReviewCarousel } from './review-carousel/review-carousel';

@Component({
  selector: 'app-reviews',
  imports: [ReviewCarousel],
  templateUrl: './reviews.html',
  styleUrl: './reviews.scss',
})
export class Reviews {
  readonly cabins = CABIN_CONFIG.cabins.map((cabin, index) => ({
    slug: cabin.slug,
    name: shortCabinName(cabin.name),
    imageUrl: (cabin.imageUrl ?? '').replace('w=400', 'w=800'),
    imageOnLeft: reviewBandImageOnLeft(index),
  }));
}
