import { CurrencyPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Message } from 'primeng/message';

import { BookingStateService } from '../../booking-state.service';
import { formatDateRangeLabel } from '../../../../core/utils/date-utils';

export type CartSummaryMode = 'calendar' | 'checkout' | 'result';

@Component({
  selector: 'app-cart-summary',
  imports: [CurrencyPipe, Button, Divider, Message],
  templateUrl: './cart-summary.html',
  styleUrl: './cart-summary.scss',
})
export class CartSummary {
  private readonly router = inject(Router);
  protected readonly state = inject(BookingStateService);
  readonly mode = input<CartSummaryMode>('calendar');
  readonly formatDateRangeLabel = formatDateRangeLabel;

  cabinName(cabinId: number): string {
    return this.state.getCabinById(cabinId)?.name ?? `Cabin ${cabinId}`;
  }

  continueToCheckout(): void {
    if (!this.state.canCheckout()) {
      return;
    }

    void this.router.navigate(['/group-booking/checkout'], { queryParamsHandling: 'preserve' });
  }

  bookMoreCabins(): void {
    this.state.startNewBooking();
    void this.router.navigate(['/group-booking'], { queryParamsHandling: 'preserve' });
  }
}
