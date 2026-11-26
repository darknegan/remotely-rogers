import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { syncChannelFromGroupBooking } from '../../../core/booking/group-booking-channel-sync';
import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { formatGuestCount } from '../../../core/utils/guest-label';
import { BookingStateService } from '../../group-booking/booking-state.service';
import { PriceSummary } from '../price-summary/price-summary';

@Component({
  selector: 'app-custom-checkout-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PriceSummary],
  templateUrl: './custom-checkout-summary.html',
  styleUrl: './custom-checkout-summary.scss',
})
export class CustomCheckoutSummary implements OnInit {
  protected readonly state = inject(BookingChannelStateService);
  private readonly group = inject(BookingStateService);
  readonly formatGuestCount = formatGuestCount;

  ngOnInit(): void {
    syncChannelFromGroupBooking(this.state, this.group);
    this.state.loadChannel();
    this.state.validateCart();
  }

  cabinLineLabel(productId: string): string {
    const product = this.state.products().find((row) => row.id === productId);
    return product ? this.state.productName(product) : 'Cabin';
  }

  guestsForProduct(productId: string): number {
    return this.state.totalGuestsForProduct(productId);
  }
}