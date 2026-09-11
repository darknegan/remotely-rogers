import { afterNextRender, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { BookingStateService } from '../../booking-state.service';
import { CartSummary } from '../../cart/cart-summary/cart-summary';
import { GuestDetailsForm } from '../guest-details-form/guest-details-form';

@Component({
  selector: 'app-checkout-page',
  imports: [GuestDetailsForm, CartSummary],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage {
  private readonly router = inject(Router);
  private readonly state = inject(BookingStateService);
  protected readonly embedMode = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('embed') === '1')),
    { initialValue: false },
  );

  constructor() {
    afterNextRender(() => {
      if (this.state.cartItems().length === 0) {
        void this.router.navigate(['/group-booking'], { queryParamsHandling: 'preserve' });
      }
    });
  }
}
