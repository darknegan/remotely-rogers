import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';

import { BookingStateService } from '../../booking-state.service';
import { CartSummary } from '../../cart/cart-summary/cart-summary';

@Component({
  selector: 'app-checkout-success',
  imports: [CartSummary, Message, ProgressSpinner],
  templateUrl: './checkout-success.html',
  styleUrl: './checkout-success.scss',
})
export class CheckoutSuccessPage {
  private readonly state = inject(BookingStateService);
  protected readonly bookingState = this.state;
  protected readonly embedMode = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('embed') === '1')),
    { initialValue: false },
  );

  constructor() {
    const sessionId = inject(ActivatedRoute).snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      this.state.loadCheckoutSession(sessionId);
    } else {
      this.state.checkoutError.set('Missing Stripe session. Return to checkout and try again.');
    }
  }
}
