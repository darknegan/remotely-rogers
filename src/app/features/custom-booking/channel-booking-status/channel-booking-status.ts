import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED } from '../../../core/booking/channel/bookingmood-channel-checkout-gate';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';

@Component({
  selector: 'app-channel-booking-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, JsonPipe],
  templateUrl: './channel-booking-status.html',
})
export class ChannelBookingStatus implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly state = inject(BookingChannelStateService);
  readonly checkoutEnabled = BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED;

  ngOnInit(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    const secret = this.route.snapshot.queryParamMap.get('secret');
    if (!checkoutEnabled() || !bookingId || !secret) {
      return;
    }
    this.state.loadBookingStatus(bookingId, secret);
  }
}

function checkoutEnabled(): boolean {
  return BOOKINGMOOD_CHANNEL_CHECKOUT_ENABLED;
}