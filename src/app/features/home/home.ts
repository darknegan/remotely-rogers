import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CABIN_LISTINGS } from '../../core/content/cabin-catalog';
import { BookingBar } from '../../layout/booking-bar/booking-bar';
import { ReviewBand } from '../../shared/review-band/review-band';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, BookingBar, ReviewBand],
  templateUrl: './home.html',
})
export class Home {
  readonly cabins = CABIN_LISTINGS;
  readonly hero = '/cabins/hero.jpg';
}
