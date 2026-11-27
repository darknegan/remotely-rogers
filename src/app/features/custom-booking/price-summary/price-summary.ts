import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { productLabel } from '../../../core/booking/channel/booking-channel-calendar';
import { formatGuestCount } from '../../../core/utils/guest-label';

@Component({
  selector: 'app-price-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  templateUrl: './price-summary.html',
  styleUrl: './price-summary.scss',
})
export class PriceSummary {
  protected readonly state = inject(BookingChannelStateService);
  readonly formatGuestCount = formatGuestCount;

  lineLabelForProduct(productId: string): string {
    const product = this.state.products().find((row) => row.id === productId);
    return product ? productLabel(product.name) : 'Cabin';
  }

  guestsForProduct(productId: string): number {
    return this.state.totalGuestsForProduct(productId);
  }
}