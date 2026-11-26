import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { BookingChannelStateService } from '../../../core/booking/channel/booking-channel-state.service';
import { BookingmoodCartValidateItem } from '../../../core/booking/channel/bookingmood-channel.types';

@Component({
  selector: 'app-price-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  templateUrl: './price-summary.html',
  styleUrl: './price-summary.scss',
})
export class PriceSummary {
  protected readonly state = inject(BookingChannelStateService);

  readonly subtotalCents = computed(() =>
    this.state.cartLineItems().reduce((sum, row) => sum + (row.price?.subtotal ?? 0), 0),
  );

  readonly taxCents = computed(() =>
    this.state.cartLineItems().reduce((sum, row) => sum + (row.price?.tax ?? 0), 0),
  );

  readonly totalCents = computed(() => this.state.cartTotalCents());

  readonly depositCents = computed(() =>
    this.state.cartLineItems().reduce((sum, row) => sum + (row.price?.deposit ?? 0), 0),
  );

  toDollars(cents: number): number {
    return cents / 100;
  }

  lineLabel(line: BookingmoodCartValidateItem): string {
    const index = Number(line.id.replace('item-', '')) - 1;
    const productId = this.state.selectedProductIds()[index];
    const product = this.state.products().find((row) => row.id === productId);
    return product ? this.state.productName(product) : `Cabin ${index + 1}`;
  }
}