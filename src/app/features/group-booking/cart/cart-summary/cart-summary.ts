import { CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { Message } from 'primeng/message';

import { BookingStateService } from '../../booking-state.service';
import { formatDateRangeLabel } from '../../../../core/utils/date-utils';

@Component({
  selector: 'app-cart-summary',
  imports: [CurrencyPipe, Button, Divider, Message],
  templateUrl: './cart-summary.html',
  styleUrl: './cart-summary.scss',
})
export class CartSummary {
  protected readonly state = inject(BookingStateService);
  readonly formatDateRangeLabel = formatDateRangeLabel;
}
