import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Drawer } from 'primeng/drawer';

import { formatDateRangeLabel } from '../../../core/utils/date-utils';
import { shortCabinName } from '../../../core/utils/reviews';
import { BookingStateService } from '../booking-state.service';
import { CabinGrid } from '../availability/cabin-grid/cabin-grid';
import { CartSummary } from '../cart/cart-summary/cart-summary';
import { DateRangeForm } from '../availability/date-range-form/date-range-form';

@Component({
  selector: 'app-group-booking-shell',
  imports: [DateRangeForm, CabinGrid, CartSummary, Drawer, CurrencyPipe],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class GroupBookingShell {
  private readonly route = inject(ActivatedRoute);
  protected readonly state = inject(BookingStateService);

  readonly embedded = input(false);

  protected readonly embedMode = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('embed') === '1')),
    { initialValue: false },
  );

  protected readonly mobileCartOpen = signal(false);

  protected readonly cartNightCount = computed(() =>
    this.state.cartItems().reduce((sum, item) => sum + item.nights, 0),
  );

  protected readonly mobileCartSummary = computed(() => {
    const items = this.state.cartItems();
    const count = items.length;
    const nights = this.cartNightCount();

    if (count === 0) {
      return 'No cabins selected';
    }

    const cabinLabel = count === 1 ? '1 cabin' : `${count} cabins`;
    const nightLabel = nights === 1 ? '1 night' : `${nights} nights`;
    return `${cabinLabel} · ${nightLabel}`;
  });

  protected readonly mobileCartDetails = computed(() =>
    this.state
      .cartItems()
      .map(
        (item) =>
          `${shortCabinName(item.cabin.name)} ${formatDateRangeLabel(item.selection.arrival, item.selection.departure)}`,
      )
      .join(' · '),
  );

  protected openMobileCart(): void {
    this.mobileCartOpen.set(true);
  }

  protected closeMobileCart(): void {
    this.mobileCartOpen.set(false);
  }
}
