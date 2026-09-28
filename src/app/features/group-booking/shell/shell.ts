import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Button } from 'primeng/button';
import { Drawer } from 'primeng/drawer';

import { CabinGrid } from '../availability/cabin-grid/cabin-grid';
import { CartSummary } from '../cart/cart-summary/cart-summary';
import { DateRangeForm } from '../availability/date-range-form/date-range-form';

@Component({
  selector: 'app-group-booking-shell',
  imports: [DateRangeForm, CabinGrid, CartSummary, Button, Drawer],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class GroupBookingShell {
  readonly cartOpen = signal(false);
  protected readonly embedMode = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('embed') === '1')),
    { initialValue: false },
  );
}
