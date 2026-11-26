import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';
import { Message } from 'primeng/message';

import { useCustomGroupBookingShell } from '../../../core/booking/booking-group-flow';
import { CustomGroupBooking } from '../../custom-booking/custom-group-booking/custom-group-booking';
import { CabinGrid } from '../availability/cabin-grid/cabin-grid';
import { CartSummary } from '../cart/cart-summary/cart-summary';
import { DateRangeForm } from '../availability/date-range-form/date-range-form';
import { BookingStateService } from '../booking-state.service';

@Component({
  selector: 'app-group-booking-shell',
  imports: [CustomGroupBooking, DateRangeForm, CabinGrid, CartSummary, Button, Drawer, Message],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class GroupBookingShell {
  protected readonly state = inject(BookingStateService);
  protected readonly useCustomShell = useCustomGroupBookingShell;
  readonly reservationsOff = this.state.reservationsOff;
  readonly cartOpen = signal(false);
  /** Hide marketing header when embedded on `/cabins` or the booking iframe. */
  readonly embeddedInCabins = input(false);
  protected readonly embedMode = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('embed') === '1')),
    { initialValue: false },
  );
  protected readonly compactLayout = computed(
    () => this.embedMode() || this.embeddedInCabins(),
  );
}
