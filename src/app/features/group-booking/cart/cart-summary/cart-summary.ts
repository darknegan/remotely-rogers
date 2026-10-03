import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';

import { BookingStateService } from '../../booking-state.service';
import { formatDateRangeLabel } from '../../../../core/utils/date-utils';
import { shortCabinName } from '../../../../core/utils/reviews';

export type CartSummaryMode = 'calendar' | 'checkout' | 'result';

@Component({
  selector: 'app-cart-summary',
  imports: [CurrencyPipe, Button, Message],
  templateUrl: './cart-summary.html',
  styleUrl: './cart-summary.scss',
})
export class CartSummary {
  private readonly router = inject(Router);
  protected readonly state = inject(BookingStateService);
  readonly mode = input<CartSummaryMode>('calendar');
  readonly checkoutRequested = output<void>();
  readonly formatDateRangeLabel = formatDateRangeLabel;
  readonly shortName = shortCabinName;

  cabinName(cabinId: number): string {
    return this.state.getCabinById(cabinId)?.name ?? `Cabin ${cabinId}`;
  }

  removeCabin(cabinId: number): void {
    this.state.clearCabinSelection(cabinId);
  }

  continueToCheckout(): void {
    if (!this.state.canCheckout()) {
      return;
    }

    this.checkoutRequested.emit();
    void this.router.navigate(['/group-booking/checkout'], { queryParamsHandling: 'preserve' });
  }

  bookMoreCabins(): void {
    this.state.startNewBooking();
    void this.router.navigate(['/group-booking'], { queryParamsHandling: 'preserve' });
  }
}
