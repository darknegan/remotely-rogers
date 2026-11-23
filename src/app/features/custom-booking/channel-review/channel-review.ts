import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { PriceSummary } from '../price-summary/price-summary';
import { BookingProgress } from '../booking-progress/booking-progress';

@Component({
  selector: 'app-channel-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PriceSummary, BookingProgress],
  templateUrl: './channel-review.html',
  styleUrl: './channel-review.scss',
})
export class ChannelReview implements OnInit {
  protected readonly state = inject(BookingChannelStateService);

  ngOnInit(): void {
    this.state.loadChannel();
    this.state.validateCart();
  }

  pay(): void {
    if (this.state.reservationsOff()) {
      return;
    }
    void this.state.proceedToPayment();
  }
}