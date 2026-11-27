import { CurrencyPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';

import { groupCartBlocksContinueWhileLoading } from '../../../../core/booking/booking-group-flow';
import { formatDateRangeLabel } from '../../../../core/utils/date-utils';
import { formatGuestCount } from '../../../../core/utils/guest-label';
import { shortCabinName } from '../../../../core/utils/reviews';
import { BookingStateService } from '../../booking-state.service';

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
  readonly formatGuestCount = formatGuestCount;
  readonly shortName = shortCabinName;
  readonly blockContinueWhileLoading = groupCartBlocksContinueWhileLoading();

  continueDisabled(): boolean {
    const state = this.state;
    return (
      !state.canContinue() ||
      state.checkoutBlockedByWorker() ||
      (this.blockContinueWhileLoading && state.loading())
    );
  }

  showPaymentNote(): boolean {
    return !this.state.reservationsOff() && !(this.blockContinueWhileLoading && this.state.loading());
  }

  cabinName(cabinId: number): string {
    return this.state.getCabinById(cabinId)?.name ?? `Cabin ${cabinId}`;
  }

  removeCabin(cabinId: number): void {
    this.state.clearCabinSelection(cabinId);
  }

  continueToCheckout(): void {
    if (this.continueDisabled()) {
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
